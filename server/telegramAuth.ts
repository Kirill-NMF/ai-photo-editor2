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
    .map((key) => `${key}=${dataWithoutHash[key as keyof typeof dataWithoutHash]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex");

  return hmac === hash;
}

function isAuthRecent(authDate: string, maxAgeSeconds = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  const authTimestamp = parseInt(authDate, 10);
  return now - authTimestamp < maxAgeSeconds;
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
      const data = req.query as unknown as TelegramAuthData;

      if (!data.id || !data.hash || !data.auth_date) {
        return res.status(400).send("Missing required fields");
      }

      if (!verifyTelegramAuth(data, BOT_TOKEN!)) {
        return res.status(403).send("Invalid authentication data");
      }

      if (!isAuthRecent(data.auth_date)) {
        return res.status(403).send("Authentication data expired");
      }

      const user = await storage.upsertUserByTelegramId(data.id, {
        firstName: data.first_name,
        lastName: data.last_name,
        telegramUsername: data.username,
        profileImageUrl: data.photo_url,
      });

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
          console.error("Telegram Auth: Session creation failed", err);
          return res.status(500).send("Session creation failed");
        }
        res.redirect("/editor");
      });
    } catch (error) {
      console.error("Telegram Auth: Error", error);
      res.status(500).send("Authentication failed");
    }
  });
}

export const isTelegramAuthConfigured = (): boolean => {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
};
