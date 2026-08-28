import assert from "node:assert/strict";
import test from "node:test";

import { buildContentSecurityPolicy } from "../server/middleware/security";

test("development CSP permits the Vite React refresh preamble", () => {
  const policy = buildContentSecurityPolicy("development");

  assert.ok(policy.directives.scriptSrc.includes("'unsafe-inline'"));
});

test("production CSP keeps inline scripts disabled", () => {
  const policy = buildContentSecurityPolicy("production");

  assert.equal(policy.directives.scriptSrc.includes("'unsafe-inline'"), false);
});
