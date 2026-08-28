import assert from "node:assert/strict";
import test from "node:test";

import {
  isDevelopmentLoginAvailable,
  startDevelopmentLogin,
} from "../client/src/lib/devAuth";

test("development login availability is false when the server hides the route", async () => {
  const available = await isDevelopmentLoginAvailable(async () => new Response(null, { status: 404 }));

  assert.equal(available, false);
});

test("development login availability requires an explicit enabled response", async () => {
  const available = await isDevelopmentLoginAvailable(async () => Response.json({ enabled: true }));

  assert.equal(available, true);
});

test("development login creates a session with a bodyless same-origin POST", async () => {
  let requestedUrl = "";
  let requestedInit: RequestInit | undefined;

  const redirectTo = await startDevelopmentLogin(async (input, init) => {
    requestedUrl = String(input);
    requestedInit = init;
    return Response.json({ redirectTo: "/editor" });
  });

  assert.equal(requestedUrl, "/api/auth/dev");
  assert.equal(requestedInit?.method, "POST");
  assert.equal(requestedInit?.body, undefined);
  assert.equal(redirectTo, "/editor");
});

test("development login never trusts an external redirect from the response", async () => {
  const redirectTo = await startDevelopmentLogin(async () => Response.json({
    redirectTo: "https://malicious.example",
  }));

  assert.equal(redirectTo, "/editor");
});
