import { createHash, createHmac } from "crypto";

export const checkTelegramAuth = (
  data: Record<string, string>,
  botToken: string,
): boolean => {
  const { hash, ...rest } = data;
  if (!hash) {
    return false;
  }

  const checkString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const hmac = createHmac("sha256", secretKey).update(checkString).digest("hex");

  return hmac === hash;
};
