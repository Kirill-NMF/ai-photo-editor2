import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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
  keyFromObjectPath,
  keyFromUploadUrl,
  objectPathFromKey,
} from "./storage/s3Paths";
import { validateImageUpload } from "./storage/imageUploadPolicy";

interface ObjectMetadata {
  contentType?: string;
  size?: number;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

function requireS3Config() {
  const s3 = getConfig().s3;
  if (!s3) throw new Error("S3 storage is not configured");
  return s3;
}

let cachedClient: S3Client | undefined;

function getS3Client(): S3Client {
  const config = requireS3Config();
  cachedClient ??= new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return cachedClient;
}

export class S3ObjectFile {
  readonly name: string;

  constructor(readonly key: string) {
    this.name = key;
  }

  async exists(): Promise<[boolean]> {
    try {
      await this.head();
      return [true];
    } catch (error: any) {
      if (error?.$metadata?.httpStatusCode === 404 || error?.name === "NotFound") {
        return [false];
      }
      throw error;
    }
  }

  async download(): Promise<[Buffer]> {
    const config = requireS3Config();
    const response = await getS3Client().send(
      new GetObjectCommand({ Bucket: config.bucket, Key: this.key }),
    );
    if (!response.Body) throw new ObjectNotFoundError();
    return [Buffer.from(await response.Body.transformToByteArray())];
  }

  async getMetadata(): Promise<[ObjectMetadata]> {
    const response = await this.head();
    return [{
      contentType: response.ContentType,
      size: response.ContentLength,
      cacheControl: response.CacheControl,
      metadata: response.Metadata,
    }];
  }

  async setMetadata(update: { metadata?: Record<string, string> }): Promise<void> {
    const config = requireS3Config();
    const [current] = await this.getMetadata();
    await getS3Client().send(new CopyObjectCommand({
      Bucket: config.bucket,
      Key: this.key,
      CopySource: `${config.bucket}/${this.key}`,
      MetadataDirective: "REPLACE",
      ContentType: current.contentType,
      CacheControl: current.cacheControl,
      Metadata: { ...current.metadata, ...update.metadata },
    }));
  }

  async save(body: Buffer, options: { metadata?: {
    contentType?: string;
    cacheControl?: string;
    metadata?: Record<string, string>;
  }} = {}): Promise<void> {
    const config = requireS3Config();
    await getS3Client().send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: this.key,
      Body: body,
      ContentType: options.metadata?.contentType,
      CacheControl: options.metadata?.cacheControl,
      Metadata: options.metadata?.metadata,
    }));
  }

  async delete(): Promise<void> {
    const config = requireS3Config();
    await getS3Client().send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: this.key }),
    );
  }

  private head() {
    const config = requireS3Config();
    return getS3Client().send(
      new HeadObjectCommand({ Bucket: config.bucket, Key: this.key }),
    );
  }
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
  }
}

export class ObjectStorageService {
  getPrivateObjectDir(): string {
    return `/${requireS3Config().bucket}`;
  }

  async downloadObject(file: S3ObjectFile, res: Response, cacheTtlSec = 3600) {
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

  async getObjectEntityUploadURL(): Promise<string> {
    const config = requireS3Config();
    const key = `uploads/${randomUUID()}`;
    return getSignedUrl(
      getS3Client(),
      new PutObjectCommand({ Bucket: config.bucket, Key: key }),
      { expiresIn: 15 * 60 },
    );
  }

  async getObjectEntityFile(objectPath: string): Promise<S3ObjectFile> {
    let key: string;
    try {
      key = keyFromObjectPath(objectPath);
    } catch {
      throw new ObjectNotFoundError();
    }
    const file = new S3ObjectFile(key);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return file;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    const config = requireS3Config();
    return objectPathFromKey(
      keyFromUploadUrl(rawPath, config.endpoint, config.bucket),
    );
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
    } catch (error) {
      await objectFile.delete();
      throw error;
    }
    await setObjectAclPolicy(objectFile, aclPolicy);
    return normalizedPath;
  }

  async canAccessObjectEntity({ userId, objectFile, requestedPermission }: {
    userId?: string;
    objectFile: S3ObjectFile;
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
