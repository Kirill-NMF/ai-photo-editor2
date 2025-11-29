import sharp from 'sharp';
import { File } from "@google-cloud/storage";
import { objectStorageClient } from "./objectStorage";

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export class ThumbnailGenerator {
  private defaultOptions: Required<ThumbnailOptions> = {
    width: 400,
    height: 225,
    quality: 80,
    format: 'webp',
  };

  async generateThumbnail(
    sourceFile: File,
    destinationPath: string,
    options?: ThumbnailOptions
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      console.log(`[ThumbnailGenerator] Generating ${opts.format} thumbnail for ${sourceFile.name}`);
      console.log(`[ThumbnailGenerator] Target size: ${opts.width}x${opts.height}`);
      console.log(`[ThumbnailGenerator] Destination: ${destinationPath}`);

      const [imageBuffer] = await sourceFile.download();
      console.log(`[ThumbnailGenerator] Downloaded original (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

      const metadata = await sharp(imageBuffer).metadata();
      console.log(`[ThumbnailGenerator] Original dimensions: ${metadata.width}x${metadata.height}`);

      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(opts.width, opts.height, {
          fit: 'cover',
          position: 'center',
        })
        .toFormat(opts.format, {
          quality: opts.quality,
          ...(opts.format === 'webp' && {
            effort: 4,
            smartSubsample: true,
          }),
        })
        .toBuffer();

      const thumbnailSizeKB = (thumbnailBuffer.length / 1024).toFixed(1);
      const compressionRatio = ((1 - thumbnailBuffer.length / imageBuffer.length) * 100).toFixed(1);
      
      console.log(`[ThumbnailGenerator] Generated thumbnail (${thumbnailSizeKB} KB)`);
      console.log(`[ThumbnailGenerator] Compression: ${compressionRatio}%`);

      const { bucketName, objectName } = this.parseObjectPath(destinationPath);
      const bucket = objectStorageClient.bucket(bucketName);
      const thumbnailFile = bucket.file(objectName);

      await thumbnailFile.save(thumbnailBuffer, {
        metadata: {
          contentType: `image/${opts.format}`,
          cacheControl: 'public, max-age=31536000',
          metadata: {
            originalFile: sourceFile.name,
            generatedAt: new Date().toISOString(),
            width: opts.width.toString(),
            height: opts.height.toString(),
            format: opts.format,
            originalWidth: metadata.width?.toString() || 'unknown',
            originalHeight: metadata.height?.toString() || 'unknown',
          },
        },
        public: true,
      });

      console.log(`[ThumbnailGenerator] ✓ Uploaded thumbnail to ${destinationPath}`);

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectName}`;
      return publicUrl;

    } catch (error) {
      console.error('[ThumbnailGenerator] ✗ Error generating thumbnail:', error);
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateUploadThumbnail(
    originalFile: File,
    uploadId: string,
    privateObjectDir: string
  ): Promise<string> {
    const thumbnailPath = `${privateObjectDir}/uploads/${uploadId}/thumb.webp`;
    
    return this.generateThumbnail(originalFile, thumbnailPath, {
      width: 400,
      height: 225,
      quality: 80,
      format: 'webp',
    });
  }

  async generateEditThumbnail(
    editResultFile: File,
    editId: string,
    privateObjectDir: string
  ): Promise<string> {
    const thumbnailPath = `${privateObjectDir}/edits/${editId}/thumb.webp`;
    
    return this.generateThumbnail(editResultFile, thumbnailPath, {
      width: 400,
      height: 225,
      quality: 80,
      format: 'webp',
    });
  }

  private parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return { bucketName, objectName };
  }
}

export const thumbnailGenerator = new ThumbnailGenerator();
