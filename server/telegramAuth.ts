import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { getConfig } from "./config";
import {
  isTelegramAuthRecent,
  verifyTelegramAuth,
  type TelegramAuthData,
} from "./auth/telegramVerification";

export function setupTelegramAuth(app: Express) {
  const telegram = getConfig().telegram;

  if (telegram) {
    console.log(`Telegram Auth: configured with bot @${telegram.botUsername}`);
  }

  app.get("/api/auth/telegram/config", (_req, res) => {
    if (!telegram) {
      return res.status(503).json({ error: "Telegram auth not configured" });
    }
    res.json({ botUsername: telegram.botUsername });
  });

  app.get("/api/auth/telegram/callback", async (req, res) => {
    try {
      if (!telegram) {
        return res.redirect("/login?error=telegram_not_configured");
      }

      const data = req.query as unknown as TelegramAuthData;

      if (!data.id || !data.hash || !data.auth_date) {
        return res.redirect("/login?error=missing_fields");
      }

      if (!verifyTelegramAuth(data, telegram.botToken)) {
        return res.redirect("/login?error=invalid_signature");
      }

      if (!isTelegramAuthRecent(data.auth_date)) {
        return res.redirect("/login?error=expired");
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
          email: user.email ?? undefined,
          first_name: user.firstName ?? undefined,
          last_name: user.lastName ?? undefined,
          profile_image_url: user.profileImageUrl ?? undefined,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
      };

      req.login(sessionUser, (err) => {
        if (err) {
          console.error("Telegram Auth: Session creation failed:", err);
          return res.redirect("/login?error=session_failed");
        }
        res.redirect("/editor");
      });
    } catch (error) {
      console.error("Telegram Auth: callback failed", error);
      res.redirect("/login?error=server_error");
    }
  });
}
