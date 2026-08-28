import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";

import {
  isTelegramAuthRecent,
  verifyTelegramAuth,
  type TelegramAuthData,
} from "../server/auth/telegramVerification";

function signedTelegramData(botToken: string): TelegramAuthData {
  const unsigned = {
    id: "123456",
    first_name: "Test",
    auth_date: Math.floor(Date.now() / 1000).toString(),
  };
  const dataCheckString = Object.entries(unsigned)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  return { ...unsigned, hash };
}

test("verifyTelegramAuth accepts a correctly signed payload", () => {
  const botToken = "123456:telegram-test-token";
  assert.equal(verifyTelegramAuth(signedTelegramData(botToken), botToken), true);
});

test("verifyTelegramAuth rejects a tampered payload", () => {
  const botToken = "123456:telegram-test-token";
  const data = signedTelegramData(botToken);

  assert.equal(
    verifyTelegramAuth({ ...data, first_name: "Attacker" }, botToken),
    false,
  );
});

test("isTelegramAuthRecent rejects expired and future timestamps", () => {
  const now = 2_000_000_000;

  assert.equal(isTelegramAuthRecent((now - 60).toString(), now), true);
  assert.equal(isTelegramAuthRecent((now - 601).toString(), now), false);
  assert.equal(isTelegramAuthRecent((now + 1).toString(), now), false);
});
