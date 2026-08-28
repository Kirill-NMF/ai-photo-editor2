import { randomUUID } from "node:crypto";
import type { Response } from "express";

import { getConfig } from "./config";
import {
  type ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";
import {
  LocalObjectStore,
  type LocalObjectMetadata,
  StorageQuotaExceededError,
} from "./storage/localObjectStore";
import {
  keyFromObjectPath,
  keyFromUploadUrl,
  objectPathFromKey,
} from "./storage/localPaths";
import {
  validateImageContents,
  validateImageUpload,
} from "./storage/imageUploadPolicy";

let cachedStore: LocalObjectStore | undefined;

function getLocalStore(): LocalObjectStore {
  const config = getConfig().localStorage;
  cachedStore ??= new LocalObjectStore(config.directory, config.maxBytes);
  return cachedStore;
}

function getPublicOrigin(): string {
  const config = getConfig();
  return new URL(
    config.publicBaseUrl ?? `http://${config.host}:${config.port}`,
  ).origin;
}

export class LocalObjectFile {
  readonly name: string;

  constructor(
    readonly key: string,
    private readonly store: LocalObjectStore = getLocalStore(),
  ) {
    this.name = key;
  }

  async exists(): Promise<[boolean]> {
    return [await this.store.exists(this.key)];
  }

  async download(): Promise<[Buffer]> {
    try {
      return [await this.store.read(this.key)];
    } catch (error: any) {
      if (error?.code === "ENOENT") throw new ObjectNotFoundError();
      throw error;
    }
  }

  async getMetadata(): Promise<[LocalObjectMetadata]> {
    try {
      return [await this.store.getMetadata(this.key)];
    } catch (error: any) {
      if (error?.code === "ENOENT") throw new ObjectNotFoundError();
      throw error;
    }
  }

  async setMetadata(update: { metadata?: Record<string, string> }): Promise<void> {
    await this.store.updateMetadata(this.key, update);
  }

  async save(body: Buffer, options: { metadata?: {
    contentType?: string;
    cacheControl?: string;
    metadata?: Record<string, string>;
  }} = {}): Promise<void> {
    await this.store.write(this.key, body, options.metadata);
  }

  async delete(): Promise<void> {
    await this.store.delete(this.key);
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

export { StorageQuotaExceededError };

export class ObjectStorageService {
  constructor(
    private readonly store: LocalObjectStore = getLocalStore(),
    private readonly publicOrigin: string = getPublicOrigin(),
  ) {}

  getPrivateObjectDir(): string {
    return "/objects";
  }

  async downloadObject(file: LocalObjectFile, res: Response, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();
      const aclPolicy = await getObjectAclPolicy(file);
      const [body] = await file.download();
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Length": String(body.length),
        "Cache-Control": `${aclPolicy?.visibility === "public" ? "public" : "private"}, max-age=${cacheTtlSec}`,
        "X-Content-Type-Options": "nosniff",
      });
      res.send(body);
    } catch (error) {
      console.error("Object download failed", error);
      if (!res.headersSent) res.status(500).json({ error: "Error downloading file" });
    }
  }

  async saveUploadedImage(body: Buffer, contentType?: string): Promise<string> {
    validateImageUpload(contentType, body.length);
    await validateImageContents(body, contentType);
    const key = `uploads/${randomUUID()}`;
    await new LocalObjectFile(key, this.store).save(body, {
      metadata: { contentType },
    });
    return new URL(objectPathFromKey(key), this.publicOrigin).toString();
  }

  async saveGeneratedImage(
    body: Buffer,
    contentType: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    validateImageUpload(contentType, body.length);
    await validateImageContents(body, contentType);
    const key = `uploads/${randomUUID()}`;
    const file = new LocalObjectFile(key, this.store);
    await file.save(body, { metadata: { contentType } });
    try {
      await setObjectAclPolicy(file, aclPolicy);
    } catch (error) {
      await file.delete();
      throw error;
    }
    return objectPathFromKey(key);
  }

  async getObjectEntityFile(objectPath: string): Promise<LocalObjectFile> {
    let key: string;
    try {
      key = keyFromObjectPath(objectPath);
    } catch {
      throw new ObjectNotFoundError();
    }
    const file = new LocalObjectFile(key, this.store);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    const key = rawPath.startsWith("/objects/")
      ? keyFromObjectPath(rawPath)
      : keyFromUploadUrl(rawPath, this.publicOrigin);
    return objectPathFromKey(key);
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy,
  ): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    const objectFile = await this.getObjectEntityFile(normalizedPath);
    const [metadata] = await objectFile.getMetadata();
    try {
      validateImageUpload(metadata.contentType, metadata.size);
      const [body] = await objectFile.download();
      await validateImageContents(body, metadata.contentType);
    } catch (error) {
      await objectFile.delete();
      throw error;
    }
    try {
      await setObjectAclPolicy(objectFile, aclPolicy);
    } catch (error) {
      await objectFile.delete();
      throw error;
    }
    return normalizedPath;
  }

  async canAccessObjectEntity({ userId, objectFile, requestedPermission }: {
    userId?: string;
    objectFile: LocalObjectFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }

  async getObjectAclPolicy(objectPath: string): Promise<ObjectAclPolicy | null> {
    return getObjectAclPolicy(await this.getObjectEntityFile(objectPath));
  }
}
