import { createHash, randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

export interface LocalObjectMetadata {
  contentType?: string;
  size?: number;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

interface StoredMetadata extends LocalObjectMetadata {
  key: string;
  size: number;
  version: 1;
}

export class StorageQuotaExceededError extends Error {
  constructor() {
    super("Local storage quota exceeded");
    this.name = "StorageQuotaExceededError";
  }
}

export class LocalObjectStore {
  private operationTail: Promise<void> = Promise.resolve();
  private readonly objectRoot: string;

  constructor(
    rootDirectory: string,
    private readonly maxBytes: number,
  ) {
    this.objectRoot = path.join(path.resolve(rootDirectory), "objects");
  }

  async exists(key: string): Promise<boolean> {
    return this.withLock(() => this.existsUnlocked(this.objectDirectory(key)));
  }

  async read(key: string): Promise<Buffer> {
    return this.withLock(async () => {
      const files = this.objectFiles(key);
      await this.readMetadataUnlocked(key);
      return readFile(files.data);
    });
  }

  async getMetadata(key: string): Promise<LocalObjectMetadata> {
    return this.withLock(async () => {
      const stored = await this.readMetadataUnlocked(key);
      return {
        contentType: stored.contentType,
        size: stored.size,
        cacheControl: stored.cacheControl,
        metadata: stored.metadata,
      };
    });
  }

  async write(
    key: string,
    body: Buffer,
    metadata: Omit<LocalObjectMetadata, "size"> = {},
  ): Promise<void> {
    return this.withLock(() => this.writeUnlocked(key, body, metadata));
  }

  async updateMetadata(
    key: string,
    update: { metadata?: Record<string, string> },
  ): Promise<void> {
    return this.withLock(async () => {
      const current = await this.readMetadataUnlocked(key);
      const body = await readFile(this.objectFiles(key).data);
      await this.writeUnlocked(key, body, {
        contentType: current.contentType,
        cacheControl: current.cacheControl,
        metadata: { ...current.metadata, ...update.metadata },
      });
    });
  }

  async delete(key: string): Promise<void> {
    return this.withLock(async () => {
      await rm(this.objectDirectory(key), { recursive: true, force: true });
    });
  }

  async usageBytes(): Promise<number> {
    return this.withLock(() => this.directoryUsage(this.objectRoot));
  }

  private async writeUnlocked(
    key: string,
    body: Buffer,
    metadata: Omit<LocalObjectMetadata, "size">,
  ): Promise<void> {
    const files = this.objectFiles(key);
    const storedMetadata: StoredMetadata = {
      version: 1,
      key,
      contentType: metadata.contentType,
      cacheControl: metadata.cacheControl,
      metadata: metadata.metadata,
      size: body.length,
    };
    const metadataBody = Buffer.from(JSON.stringify(storedMetadata));
    const currentUsage = await this.directoryUsage(this.objectRoot);
    const existingUsage = await this.directoryUsage(files.directory);
    const projectedUsage = currentUsage - existingUsage + body.length + metadataBody.length;
    if (projectedUsage > this.maxBytes) throw new StorageQuotaExceededError();

    await mkdir(files.shard, { recursive: true, mode: 0o700 });
    const temporaryDirectory = path.join(files.shard, `.tmp-${randomUUID()}`);
    const backupDirectory = path.join(files.shard, `.old-${randomUUID()}`);
    await mkdir(temporaryDirectory, { mode: 0o700 });

    try {
      await writeFile(path.join(temporaryDirectory, "data"), body, { flag: "wx", mode: 0o600 });
      await writeFile(path.join(temporaryDirectory, "metadata.json"), metadataBody, {
        flag: "wx",
        mode: 0o600,
      });

      const hadExistingObject = await this.existsUnlocked(files.directory);
      if (hadExistingObject) await rename(files.directory, backupDirectory);
      try {
        await rename(temporaryDirectory, files.directory);
      } catch (error) {
        if (hadExistingObject) await rename(backupDirectory, files.directory);
        throw error;
      }
      if (hadExistingObject) {
        await rm(backupDirectory, { recursive: true, force: true });
      }
    } finally {
      await rm(temporaryDirectory, { recursive: true, force: true });
    }
  }

  private async readMetadataUnlocked(key: string): Promise<StoredMetadata> {
    const raw = await readFile(this.objectFiles(key).metadata, "utf8");
    const metadata = JSON.parse(raw) as StoredMetadata;
    if (metadata.version !== 1 || metadata.key !== key || !Number.isSafeInteger(metadata.size)) {
      throw new Error("Invalid local object metadata");
    }
    return metadata;
  }

  private objectFiles(key: string) {
    const directory = this.objectDirectory(key);
    return {
      shard: path.dirname(directory),
      directory,
      data: path.join(directory, "data"),
      metadata: path.join(directory, "metadata.json"),
    };
  }

  private objectDirectory(key: string): string {
    const hash = createHash("sha256").update(key).digest("hex");
    return path.join(this.objectRoot, hash.slice(0, 2), hash);
  }

  private async directoryUsage(directory: string): Promise<number> {
    if (!(await this.existsUnlocked(directory))) return 0;
    const entries = await readdir(directory, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      const entryInfo = await lstat(entryPath);
      if (entryInfo.isSymbolicLink()) throw new Error("Symlinks are not allowed in local storage");
      if (entryInfo.isDirectory()) total += await this.directoryUsage(entryPath);
      else if (entryInfo.isFile()) total += entryInfo.size;
    }
    return total;
  }

  private async existsUnlocked(target: string): Promise<boolean> {
    try {
      await stat(target);
      return true;
    } catch (error: any) {
      if (error?.code === "ENOENT") return false;
      throw error;
    }
  }

  private withLock<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationTail.then(operation, operation);
    this.operationTail = result.then(() => undefined, () => undefined);
    return result;
  }
}
