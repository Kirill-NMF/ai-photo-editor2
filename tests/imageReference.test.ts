import assert from "node:assert/strict";
import test from "node:test";

import sharp from "sharp";

import {
  getImageDisplayDimensions,
  normalizeImageReference,
} from "../server/imageReference";

test("OpenRouter references physically apply EXIF orientation before encoding", async () => {
  const orientedJpeg = await sharp({
    create: {
      width: 4,
      height: 2,
      channels: 3,
      background: { r: 240, g: 120, b: 40 },
    },
  })
    .jpeg()
    .withMetadata({ orientation: 8 })
    .toBuffer();

  const normalized = await normalizeImageReference(orientedJpeg, "image/jpeg");
  const metadata = await sharp(normalized.body).metadata();

  assert.equal(normalized.contentType, "image/jpeg");
  assert.equal(metadata.width, 2);
  assert.equal(metadata.height, 4);
  assert.equal(metadata.orientation ?? 1, 1);
  assert.deepEqual(await getImageDisplayDimensions(orientedJpeg), {
    width: 2,
    height: 4,
  });
});

test("upright OpenRouter references are not recompressed", async () => {
  const uprightPng = await sharp({
    create: {
      width: 3,
      height: 5,
      channels: 4,
      background: { r: 10, g: 20, b: 30, alpha: 1 },
    },
  }).png().toBuffer();

  const normalized = await normalizeImageReference(uprightPng, "image/png");

  assert.equal(normalized.body, uprightPng);
  assert.equal(normalized.contentType, "image/png");
});
