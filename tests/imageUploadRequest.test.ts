import assert from "node:assert/strict";
import test from "node:test";

import {
  imageUploadRequestSchema,
  summarizeImageUploadValidation,
} from "../server/validation/imageUploadRequest";

const validRequest = {
  uploadUrl: "https://ai-photo-editor.store/objects/uploads/id",
  fileName: "photo.webp",
};

test("image registration accepts a named upload", () => {
  assert.equal(imageUploadRequestSchema.parse(validRequest).fileName, "photo.webp");
});

test("image registration no longer depends on browser-reported dimensions or size", () => {
  assert.deepEqual(imageUploadRequestSchema.parse({
    uploadUrl: validRequest.uploadUrl,
  }), {
    uploadUrl: validRequest.uploadUrl,
    fileName: "Uploaded image",
  });
});

test("image registration rejects invalid URLs and names", () => {
  for (const request of [
    { ...validRequest, uploadUrl: "/objects/uploads/id" },
    { ...validRequest, fileName: "" },
    { ...validRequest, fileName: "x".repeat(256) },
  ]) {
    assert.equal(imageUploadRequestSchema.safeParse(request).success, false);
  }
});

test("image registration diagnostics contain issue paths but no submitted values", () => {
  const result = imageUploadRequestSchema.safeParse({
    ...validRequest,
    fileName: "private-photo-name.jpg",
    uploadUrl: "/not-an-upload",
  });
  assert.equal(result.success, false);
  if (result.success) return;

  const summary = summarizeImageUploadValidation(result.error);

  assert.deepEqual(summary, [{ path: "uploadUrl", code: "invalid_string" }]);
  assert.equal(JSON.stringify(summary).includes("private-photo-name"), false);
});
