import assert from "node:assert/strict";
import test from "node:test";

import { shouldUseMemorySessionStore } from "../server/auth/sessionStore";
import { parseConfig } from "../server/config";

const baseEnv = {
  DATABASE_URL: "postgresql://photoeditor:secret@127.0.0.1:5432/photoeditor",
  SESSION_SECRET: "a-development-session-secret-that-is-long-enough",
};

test("explicit local development login keeps sessions in the local process", () => {
  const config = parseConfig({
    ...baseEnv,
    NODE_ENV: "development",
    HOST: "127.0.0.1",
    DEV_AUTH_ENABLED: "true",
  });

  assert.equal(shouldUseMemorySessionStore(config), true);
});

test("normal development and production keep PostgreSQL-backed sessions", () => {
  const development = parseConfig({ ...baseEnv, NODE_ENV: "development" });
  const production = parseConfig({
    ...baseEnv,
    NODE_ENV: "production",
    LOCAL_STORAGE_DIR: "C:\\photoai-storage",
  });

  assert.equal(shouldUseMemorySessionStore(development), false);
  assert.equal(shouldUseMemorySessionStore(production), false);
});
