import { Router } from "express";
import cookieParser from 'cookie-parser';
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { checkTelegramAuth } from "../utils/telegramAuth";

interface TelegramAuthPayload {
  id?: number | string;
  hash?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number | string;
  [key: string]: unknown;
}

const authRouter = Router();
authRouter.use(cookieParser());

authRouter.get("/telegram/callback", async (req, res) => {
  try {
    const telegramData: TelegramAuthPayload = req.query;

    if (!telegramData || typeof telegramData !== "object") {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // console.log(" =", botToken); // temporary debug log
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not configured");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    if (!telegramData.hash) {
      return res.status(401).json({ error: "Unauthorized: Hash is missing" });
    }

    const normalizedData: Record<string, string> = {};
    for (const [key, value] of Object.entries(telegramData)) {
      if (value === undefined || value === null) {
        continue;
      }
      normalizedData[key] =
        typeof value === "string" ? value : String(value);
    }

    const isValid = checkTelegramAuth(normalizedData, botToken);

    
    if (!isValid) {
      return res.status(401).json({ error: "Unauthorized: Invalid hash" });
    }

    const telegramId = normalizedData.id;
    if (!telegramId) {
      return res.status(400).json({ error: "Telegram user id is required" });
    }

    const user = await storage.upsertUser({
      id: telegramId,
      email: normalizedData.username
        ? `${normalizedData.username}@telegram.local`
        : null,
      firstName: normalizedData.first_name,
      lastName: normalizedData.last_name,
      profileImageUrl: normalizedData.photo_url,
    });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        provider: "telegram",
      },
      jwtSecret,
      { expiresIn: "7d" },
    );

    res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
    return res.redirect('/');
  } catch (error) {
    console.error("Telegram auth callback error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));

    return res.status(500).json({
      error: "Failed to authenticate with Telegram",
    });
  }
});

export default authRouter;