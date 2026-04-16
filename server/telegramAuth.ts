import crypto from "crypto";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

function verifyTelegramAuth(data: TelegramAuthData, botToken: string): boolean {
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const { hash, ...dataWithoutHash } = data;

  const dataCheckString = Object.keys(dataWithoutHash)
    .sort()
    .filter((key) => dataWithoutHash[key as keyof typeof dataWithoutHash] !== undefined)
    .map((key) => `${key}=${dataWithoutHash[key as keyof typeof dataWithoutHash]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  console.log("Telegram Auth: dataCheckString keys:", Object.keys(dataWithoutHash).sort());
  console.log("Telegram Auth: computed hmac:", hmac, "received hash:", hash, "match:", hmac === hash);

  return hmac === hash;
}

function isAuthRecent(authDate: string, maxAgeSeconds = 600): boolean {
  const now = Math.floor(Date.now() / 1000);
  const authTimestamp = parseInt(authDate, 10);
  const age = now - authTimestamp;
  console.log(`Telegram Auth: auth_date=${authDate}, now=${now}, age=${age}s, max=${maxAgeSeconds}s`);
  return age < maxAgeSeconds;
}

export function setupTelegramAuth(app: Express) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

  if (!BOT_TOKEN || !BOT_USERNAME) {
    console.log("Telegram Auth: BOT_TOKEN or BOT_USERNAME not configured, skipping setup");
    return;
  }

  console.log(`Telegram Auth: Configured with bot @${BOT_USERNAME}`);

  app.get("/api/auth/telegram/config", (_req, res) => {
    if (!BOT_USERNAME) {
      return res.status(503).json({ error: "Telegram auth not configured" });
    }
    res.json({ botUsername: BOT_USERNAME });
  });

  app.get("/api/auth/telegram/callback", async (req, res) => {
    try {
      console.log("Telegram Auth: Callback received, query params:", JSON.stringify(req.query));

      const data = req.query as unknown as TelegramAuthData;

      if (!data.id || !data.hash || !data.auth_date) {
        console.error("Telegram Auth: Missing required fields — id:", data.id, "hash:", !!data.hash, "auth_date:", data.auth_date);
        return res.redirect("/login?error=missing_fields");
      }

      if (!verifyTelegramAuth(data, BOT_TOKEN!)) {
        console.error("Telegram Auth: HMAC verification failed for user id:", data.id);
        return res.redirect("/login?error=invalid_signature");
      }

      if (!isAuthRecent(data.auth_date)) {
        console.error("Telegram Auth: Auth data expired for user id:", data.id);
        return res.redirect("/login?error=expired");
      }

      console.log("Telegram Auth: Verification passed, upserting user id:", data.id);

      const user = await storage.upsertUserByTelegramId(data.id, {
        firstName: data.first_name,
        lastName: data.last_name,
        telegramUsername: data.username,
        profileImageUrl: data.photo_url,
      });

      console.log("Telegram Auth: User upserted, DB id:", user.id);

      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          profile_image_url: user.profileImageUrl,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Telegram Auth: Session creation failed:", err);
          return res.redirect("/login?error=session_failed");
        }
        console.log("Telegram Auth: Login successful, redirecting to /editor");
        res.redirect("/editor");
      });
    } catch (error) {
      const err = error as any;
      console.error("Telegram Auth: Unexpected error message:", err?.message ?? String(error));
      console.error("Telegram Auth: Error code:", err?.code);
      console.error("Telegram Auth: Error name:", err?.name);
      if (err?.cause) console.error("Telegram Auth: Error cause:", err.cause);
      res.redirect("/login?error=server_error");
    }
  });
}

export const isTelegramAuthConfigured = (): boolean => {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
};
