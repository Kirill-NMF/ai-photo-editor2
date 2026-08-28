import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import { ObjectStorageService } from "../server/objectStorage";
import { ObjectPermission } from "../server/objectAcl";
import { LocalObjectStore } from "../server/storage/localObjectStore";

test("local object service stores, normalizes, and protects an uploaded image", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "photoai-object-service-"));
  try {
    const store = new LocalObjectStore(root, 1024 * 1024);
    const service = new ObjectStorageService(store, "https://ai-photo-editor.store");
    const image = await sharp({
      create: { width: 4, height: 4, channels: 3, background: "#336699" },
    }).png().toBuffer();

    const uploadUrl = await service.saveUploadedImage(image, "image/png");
    assert.match(uploadUrl, /^https:\/\/ai-photo-editor\.store\/objects\/uploads\//);

    const objectPath = await service.trySetObjectEntityAclPolicy(uploadUrl, {
      owner: "user-1",
      visibility: "private",
    });
    const file = await service.getObjectEntityFile(objectPath);
    assert.deepEqual((await file.download())[0], image);
    assert.equal(await service.canAccessObjectEntity({
      userId: "user-1",
      objectFile: file,
      requestedPermission: ObjectPermission.READ,
    }), true);
    assert.equal(await service.canAccessObjectEntity({
      userId: "user-2",
      objectFile: file,
      requestedPermission: ObjectPermission.READ,
    }), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
