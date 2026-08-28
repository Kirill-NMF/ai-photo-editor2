import assert from "node:assert/strict";
import test from "node:test";

import {
  createDevelopmentIdentity,
  isAllowedDevelopmentOrigin,
} from "../server/auth/devIdentity";

test("development identity is fixed, non-admin, and provider-scoped", () => {
  const identity = createDevelopmentIdentity();

  assert.equal(identity.user.id, "dev:local");
  assert.equal(identity.user.isAdmin, false);
  assert.equal(identity.session.claims.sub, "dev:local");
});

test("development login accepts only the configured same origin", () => {
  assert.equal(
    isAllowedDevelopmentOrigin(
      "http://127.0.0.1:5080",
      "http://127.0.0.1:5080",
    ),
    true,
  );
  assert.equal(
    isAllowedDevelopmentOrigin(
      "https://malicious.example",
      "http://127.0.0.1:5080",
    ),
    false,
  );
  assert.equal(
    isAllowedDevelopmentOrigin(undefined, "http://127.0.0.1:5080"),
    false,
  );
});
