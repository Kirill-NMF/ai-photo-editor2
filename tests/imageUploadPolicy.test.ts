import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import {
  validateImageContents,
  validateImageUpload,
} from "../server/storage/imageUploadPolicy";

test("image upload policy accepts supported images within 10 MiB", () => {
  assert.doesNotThrow(() => validateImageUpload("image/webp", 10 * 1024 * 1024));
});

test("image upload policy rejects oversized and non-image objects", () => {
  assert.throws(() => validateImageUpload("image/png", 10 * 1024 * 1024 + 1), /large/i);
  assert.throws(() => validateImageUpload("text/html", 100), /type/i);
});

test("image content validation accepts real images and rejects MIME spoofing", async () => {
  const png = await sharp({
    create: {
      width: 2,
      height: 2,
      channels: 3,
      background: "black",
    },
  }).png().toBuffer();

  await validateImageContents(png, "image/png");
  await assert.rejects(
    validateImageContents(Buffer.from("not-an-image"), "image/png"),
    /Invalid image contents/,
  );
});
