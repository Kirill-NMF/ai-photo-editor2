import assert from "node:assert/strict";
import test from "node:test";

import { parseConfig, requireGeminiApiKey } from "../server/config";

const baseEnv = {
  DATABASE_URL: "postgresql://photoeditor:secret@127.0.0.1:5432/photoeditor",
  SESSION_SECRET: "a-production-session-secret-that-is-long-enough",
};

test("parseConfig applies loopback production-safe network defaults", () => {
  const config = parseConfig(baseEnv);

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 5080);
});

test("parseConfig rejects a partial Google OAuth configuration", () => {
  assert.throws(
    () => parseConfig({ ...baseEnv, GOOGLE_CLIENT_ID: "client-id" }),
    /Google OAuth configuration is incomplete/,
  );
});

test("parseConfig rejects a partial Telegram configuration", () => {
  assert.throws(
    () => parseConfig({ ...baseEnv, TELEGRAM_BOT_USERNAME: "photo_bot" }),
    /Telegram authentication configuration is incomplete/,
  );
});

test("Gemini credentials are required only when the feature is called", () => {
  const config = parseConfig(baseEnv);

  assert.equal(config.geminiApiKey, undefined);
  assert.throws(() => requireGeminiApiKey(config), /GEMINI_API_KEY is required/);
});

test("parseConfig does not include secret values in validation errors", () => {
  const leakedValue = "do-not-print-this-secret";

  assert.throws(
    () => parseConfig({ ...baseEnv, SESSION_SECRET: leakedValue }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.equal(error.message.includes(leakedValue), false);
      return true;
    },
  );
});
