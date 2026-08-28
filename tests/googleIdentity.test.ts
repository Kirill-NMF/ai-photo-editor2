import assert from "node:assert/strict";
import test from "node:test";

import { mapGoogleClaims } from "../server/auth/googleIdentity";

test("mapGoogleClaims creates a provider-scoped user and session identity", () => {
  const identity = mapGoogleClaims({
    sub: "123456789",
    email: "person@example.com",
    given_name: "Ada",
    family_name: "Lovelace",
    picture: "https://example.com/avatar.jpg",
  });

  assert.deepEqual(identity.user, {
    id: "google:123456789",
    email: "person@example.com",
    firstName: "Ada",
    lastName: "Lovelace",
    profileImageUrl: "https://example.com/avatar.jpg",
  });
  assert.equal(identity.session.claims.sub, "google:123456789");
});

test("mapGoogleClaims rejects claims without a subject", () => {
  assert.throws(() => mapGoogleClaims({ email: "person@example.com" }), /subject/i);
});
