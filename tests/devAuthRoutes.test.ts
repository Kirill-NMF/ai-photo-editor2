import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import test from "node:test";

import express from "express";

import { registerDevelopmentAuth } from "../server/auth/devAuth";
import { parseConfig } from "../server/config";

const baseEnv = {
  NODE_ENV: "development",
  HOST: "127.0.0.1",
  PORT: "5080",
  PUBLIC_BASE_URL: "http://127.0.0.1:5080",
  DATABASE_URL: "postgresql://photoeditor:secret@127.0.0.1:5432/photoeditor",
  SESSION_SECRET: "a-development-session-secret-that-is-long-enough",
};

async function withDevelopmentAuthServer(
  enabled: boolean,
  run: (baseUrl: string, state: { upsertedUserId?: string; sessionUserId?: string }) => Promise<void>,
) {
  const app = express();
  const state: { upsertedUserId?: string; sessionUserId?: string } = {};

  app.use((req: any, _res, next) => {
    req.login = (user: any, callback: (error?: Error) => void) => {
      state.sessionUserId = user.claims.sub;
      callback();
    };
    next();
  });

  registerDevelopmentAuth(app, {
    config: parseConfig({
      ...baseEnv,
      DEV_AUTH_ENABLED: enabled ? "true" : "false",
    }),
    upsertUser: async (user) => {
      state.upsertedUserId = user.id;
    },
  });

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;

  try {
    await run(`http://127.0.0.1:${port}`, state);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test("development auth routes are hidden when the feature is disabled", async () => {
  await withDevelopmentAuthServer(false, async (baseUrl) => {
    assert.equal((await fetch(`${baseUrl}/api/auth/dev/config`)).status, 404);
    assert.equal((await fetch(`${baseUrl}/api/auth/dev`, { method: "POST" })).status, 404);
  });
});

test("development auth rejects cross-origin session creation", async () => {
  await withDevelopmentAuthServer(true, async (baseUrl, state) => {
    const response = await fetch(`${baseUrl}/api/auth/dev`, {
      method: "POST",
      headers: { Origin: "https://malicious.example" },
    });

    assert.equal(response.status, 403);
    assert.equal(state.upsertedUserId, undefined);
    assert.equal(state.sessionUserId, undefined);
  });
});

test("development auth creates the fixed local session from the configured origin", async () => {
  await withDevelopmentAuthServer(true, async (baseUrl, state) => {
    const configResponse = await fetch(`${baseUrl}/api/auth/dev/config`);
    assert.deepEqual(await configResponse.json(), { enabled: true });

    const loginResponse = await fetch(`${baseUrl}/api/auth/dev`, {
      method: "POST",
      headers: { Origin: baseEnv.PUBLIC_BASE_URL },
    });

    assert.equal(loginResponse.status, 200);
    assert.deepEqual(await loginResponse.json(), { redirectTo: "/editor" });
    assert.equal(state.upsertedUserId, "dev:local");
    assert.equal(state.sessionUserId, "dev:local");
  });
});
