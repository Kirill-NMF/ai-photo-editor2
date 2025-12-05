import crypto from 'crypto';

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Express, Request, Response } from 'express';
import * as storage from './storage';
import crypto from 'crypto';
// ... (другие импорты, если есть)

// Функция верификации данных от Telegram
const verifyTelegramAuth = (data: any, botToken: string): boolean => {
  const { hash, ...fields } = data;
  if (!hash) return false;

  const dataCheckString = Object.keys(fields)
    .sort()
    .map(key => `${key}=${fields[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (calculatedHash !== hash) {
    return false;
  }

  const authDate = parseInt(fields.auth_date, 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 86400) { // Данные старше 24 часов
    return false;
  }

  return true;
};

export async function setupAuth(app: Express) {
  // ... (существующий код для Google Auth и Passport serialize/deserialize) ...

  app.use(passport.initialize());
  app.use(passport.session());

  // ... (существующие маршруты Google Auth) ...

  // Новый маршрут для Telegram Auth
  app.post('/auth/telegram', async (req: Request, res: Response) => {
    const telegramData = req.body;

    try {
      const isVerified = verifyTelegramAuth(telegramData, process.env.TELEGRAM_BOT_TOKEN!);
      if (!isVerified) {
        return res.status(401).json({ success: false, message: 'Invalid Telegram data' });
      }

      const user = await storage.upsertUser({
        id: telegramData.id.toString(), // Telegram ID
        email: null, // Telegram не передает email
        firstName: telegramData.first_name,
        lastName: telegramData.last_name,
        profileImageUrl: telegramData.photo_url,
        provider: 'telegram',
      });

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ success: false, message: 'Session login failed' });
        }
        return res.json({ success: true });
      });

    } catch (error: any) {
      console.error('Telegram auth error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });
}
