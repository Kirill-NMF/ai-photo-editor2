import assert from "node:assert/strict";
import test from "node:test";

import { getRestoreFailureAction } from "../client/src/utils/editorRestore";

test("automatic restore silently discards a stale cached image", () => {
  assert.equal(getRestoreFailureAction("cache", 404), "discard-stale-cache");
  assert.equal(getRestoreFailureAction("cache", 403), "discard-stale-cache");
});

test("explicit image links and non-404 failures remain visible", () => {
  assert.equal(getRestoreFailureAction("url", 404), "notify");
  assert.equal(getRestoreFailureAction("cache", 500), "notify");
});
