import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  LocalObjectStore,
  StorageQuotaExceededError,
} from "../server/storage/localObjectStore";
import {
  keyFromObjectPath,
  keyFromUploadUrl,
  objectPathFromKey,
} from "../server/storage/localPaths";

test("local object keys round-trip without exposing filesystem paths", () => {
  const key = "uploads/550e8400-e29b-41d4-a716-446655440000/thumb.webp";
  assert.equal(objectPathFromKey(key), `/objects/${key}`);
  assert.equal(keyFromObjectPath(`/objects/${key}`), key);
});

test("local object paths reject traversal and keys outside the upload namespace", () => {
  assert.throws(() => keyFromObjectPath("/objects/uploads/../secret"));
  assert.throws(() => keyFromObjectPath("/objects/system/file"));
  assert.throws(() => keyFromObjectPath("/objects/uploads\\secret"));
});

test("same-origin upload URLs normalize to local object keys", () => {
  const uploadUrl = "https://ai-photo-editor.store/objects/uploads/550e8400-e29b-41d4-a716-446655440000";
  assert.equal(
    keyFromUploadUrl(uploadUrl, "https://ai-photo-editor.store"),
    "uploads/550e8400-e29b-41d4-a716-446655440000",
  );
  assert.throws(() => keyFromUploadUrl(uploadUrl, "https://evil.example"));
  assert.throws(() => keyFromUploadUrl(`${uploadUrl}?unexpected=1`, "https://ai-photo-editor.store"));
});

test("local storage preserves existing files when a write would exceed quota", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "photoai-local-store-"));
  try {
    const store = new LocalObjectStore(root, 700);
    await store.write("uploads/first", Buffer.alloc(256, 1), {
      contentType: "image/png",
    });

    await assert.rejects(
      store.write("uploads/second", Buffer.alloc(512, 2), {
        contentType: "image/png",
      }),
      StorageQuotaExceededError,
    );

    assert.deepEqual(await store.read("uploads/first"), Buffer.alloc(256, 1));
    assert.equal(await store.exists("uploads/second"), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("concurrent local writes are serialized against the quota", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "photoai-local-store-"));
  try {
    const store = new LocalObjectStore(root, 900);
    const results = await Promise.allSettled([
      store.write("uploads/one", Buffer.alloc(500, 1), { contentType: "image/png" }),
      store.write("uploads/two", Buffer.alloc(500, 2), { contentType: "image/png" }),
    ]);

    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("local storage metadata updates do not alter object contents", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "photoai-local-store-"));
  try {
    const store = new LocalObjectStore(root, 4_096);
    await store.write("uploads/image", Buffer.from("image-data"), {
      contentType: "image/webp",
      metadata: { owner: "user-1" },
    });
    await store.updateMetadata("uploads/image", {
      metadata: { visibility: "private" },
    });

    assert.equal((await store.getMetadata("uploads/image")).contentType, "image/webp");
    assert.deepEqual((await store.getMetadata("uploads/image")).metadata, {
      owner: "user-1",
      visibility: "private",
    });
    assert.equal((await store.read("uploads/image")).toString(), "image-data");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
