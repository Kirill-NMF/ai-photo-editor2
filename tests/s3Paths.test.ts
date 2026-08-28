import assert from "node:assert/strict";
import test from "node:test";

import {
  keyFromObjectPath,
  keyFromUploadUrl,
  objectPathFromKey,
} from "../server/storage/s3Paths";

test("S3 object keys round-trip through application object paths", () => {
  const key = "uploads/550e8400-e29b-41d4-a716-446655440000/thumb.webp";
  assert.equal(objectPathFromKey(key), `/objects/${key}`);
  assert.equal(keyFromObjectPath(`/objects/${key}`), key);
});

test("object paths reject traversal and keys outside the upload namespace", () => {
  assert.throws(() => keyFromObjectPath("/objects/uploads/../secret"));
  assert.throws(() => keyFromObjectPath("/objects/system/file"));
});

test("a path-style Beget signed URL resolves only to the configured bucket", () => {
  const url = "https://s3.example.test/photo-bucket/uploads/abc?X-Amz-Signature=test";
  assert.equal(
    keyFromUploadUrl(url, "https://s3.example.test", "photo-bucket"),
    "uploads/abc",
  );
  assert.throws(() =>
    keyFromUploadUrl(url, "https://s3.example.test", "another-bucket"),
  );
});
