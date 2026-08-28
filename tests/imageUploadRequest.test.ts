import assert from "node:assert/strict";
import test from "node:test";

import { imageUploadRequestSchema } from "../server/validation/imageUploadRequest";

const validRequest = {
  uploadUrl: "https://ai-photo-editor.store/objects/uploads/id",
  fileName: "photo.webp",
  fileSize: 1024,
  width: 1920,
  height: 1080,
};

test("image metadata accepts a bounded valid request", () => {
  assert.equal(imageUploadRequestSchema.parse(validRequest).fileName, "photo.webp");
});

test("image metadata rejects invalid URLs, dimensions, names, and sizes", () => {
  for (const request of [
    { ...validRequest, uploadUrl: "/objects/uploads/id" },
    { ...validRequest, fileName: "" },
    { ...validRequest, fileName: "x".repeat(256) },
    { ...validRequest, fileSize: 10 * 1024 * 1024 + 1 },
    { ...validRequest, width: 0 },
    { ...validRequest, height: 50_001 },
  ]) {
    assert.equal(imageUploadRequestSchema.safeParse(request).success, false);
  }
});
