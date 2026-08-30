import assert from "node:assert/strict";
import test from "node:test";

import { resolveRequestId } from "../server/observability/requestId";

test("request correlation accepts only a canonical UUID from the client", () => {
  const provided = "123e4567-e89b-42d3-a456-426614174000";

  assert.equal(resolveRequestId(provided), provided);
  assert.match(resolveRequestId("not-a-safe-request-id"), /^[0-9a-f-]{36}$/);
  assert.notEqual(resolveRequestId("not-a-safe-request-id"), "not-a-safe-request-id");
});
