import assert from "node:assert/strict";
import test from "node:test";

import {
  consumePendingUpload,
  rememberPendingUpload,
} from "../server/storage/pendingUploads";

test("pending uploads are session-bound, deduplicated, and capped", () => {
  let pending: string[] = [];
  for (let index = 0; index < 12; index++) {
    pending = rememberPendingUpload(pending, `/objects/uploads/${index}`);
  }
  pending = rememberPendingUpload(pending, "/objects/uploads/11");

  assert.equal(pending.length, 10);
  assert.equal(pending[0], "/objects/uploads/2");
  assert.equal(pending.filter((path) => path.endsWith("/11")).length, 1);
});

test("pending uploads can be consumed once and unknown uploads are rejected", () => {
  const pending = ["/objects/uploads/known"];
  assert.deepEqual(consumePendingUpload(pending, pending[0]), []);
  assert.equal(consumePendingUpload(pending, "/objects/uploads/unknown"), null);
});
