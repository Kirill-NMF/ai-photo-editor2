import assert from "node:assert/strict";
import test from "node:test";

import { validateImageUpload } from "../server/storage/imageUploadPolicy";

test("image upload policy accepts supported images within 10 MiB", () => {
  assert.doesNotThrow(() => validateImageUpload("image/webp", 10 * 1024 * 1024));
});

test("image upload policy rejects oversized and non-image objects", () => {
  assert.throws(() => validateImageUpload("image/png", 10 * 1024 * 1024 + 1), /large/i);
  assert.throws(() => validateImageUpload("text/html", 100), /type/i);
});
