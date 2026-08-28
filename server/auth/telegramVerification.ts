import crypto from "node:crypto";

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export function verifyTelegramAuth(
  data: TelegramAuthData,
  botToken: string,
): boolean {
  const { hash, ...unsignedData } = data;
  if (!/^[a-f0-9]{64}$/i.test(hash)) {
    return false;
  }

  const dataCheckString = Object.entries(unsignedData)
    .filter(([, value]) => value !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secret = crypto.createHash("sha256").update(botToken).digest();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest();
  const received = Buffer.from(hash, "hex");

  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

export function isTelegramAuthRecent(
  authDate: string,
  nowSeconds = Math.floor(Date.now() / 1000),
  maxAgeSeconds = 600,
): boolean {
  const authTimestamp = Number(authDate);
  if (!Number.isInteger(authTimestamp)) {
    return false;
  }

  const age = nowSeconds - authTimestamp;
  return age >= 0 && age <= maxAgeSeconds;
}
