import assert from "node:assert/strict";
import test from "node:test";

import {
  ACCEPTED_UPLOAD_MIME_TYPES,
  getUploadFailureMessage,
} from "../client/src/lib/uploadFeedback";

test("the uploader rejects iPhone-only formats before starting a transfer", () => {
  assert.deepEqual(ACCEPTED_UPLOAD_MIME_TYPES, [
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);
  assert.equal(
    getUploadFailureMessage({ phase: "selection", code: "FILE_TYPE_ERROR" }),
    "This photo format is not supported. Choose a JPEG, PNG, or WebP image.",
  );
});

test("upload failures explain whether the session, file, or connection failed", () => {
  assert.equal(
    getUploadFailureMessage({ phase: "transfer", status: 401 }),
    "Your session expired. Sign in again, then retry the upload.",
  );
  assert.equal(
    getUploadFailureMessage({ phase: "transfer", status: 413 }),
    "This photo is larger than 10MB. Choose a smaller image.",
  );
  assert.equal(
    getUploadFailureMessage({ phase: "transfer" }),
    "The upload did not finish. Check your connection and try again.",
  );
});

test("image registration failures never leave the user at an unexplained zero state", () => {
  assert.equal(
    getUploadFailureMessage({ phase: "registration", status: 400 }),
    "The photo uploaded, but its image details could not be saved. Choose the photo again.",
  );
});
