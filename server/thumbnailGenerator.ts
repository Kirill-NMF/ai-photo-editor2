import sharp from 'sharp';
import { S3ObjectFile } from "./objectStorage";
import { setObjectAclPolicy, ObjectAclPolicy } from "./objectAcl";

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

  /**
   * Generate a thumbnail from an S3 object.
   * @param sourceFile - Source image in object storage
   * @param destinationPath - Bucket-qualified thumbnail path
   * @param options - Thumbnail generation options
   * @returns Public URL of the generated thumbnail
   */
  async generateThumbnail(
    sourceFile: S3ObjectFile,
    destinationPath: string,
    options?: ThumbnailOptions
  ): Promise<string> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      console.log(`[ThumbnailGenerator] Generating ${opts.format} thumbnail for ${sourceFile.name}`);
      console.log(`[ThumbnailGenerator] Target size: ${opts.width}x${opts.height}`);
      console.log(`[ThumbnailGenerator] Destination: ${destinationPath}`);

      // Download original image to buffer
      const [imageBuffer] = await sourceFile.download();
      console.log(`[ThumbnailGenerator] Downloaded original (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

      // Get original image metadata
      const metadata = await sharp(imageBuffer).metadata();
      console.log(`[ThumbnailGenerator] Original dimensions: ${metadata.width}x${metadata.height}`);

      // Generate thumbnail using Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .rotate()  // Auto-rotate based on EXIF orientation (fixes sideways photos)
        .resize(opts.width, opts.height, {
          fit: 'cover',  // Crop to exact dimensions (maintains aspect ratio)
          position: 'center',  // Center crop
        })
        .toFormat(opts.format, {
          quality: opts.quality,
          // WebP-specific optimizations
          ...(opts.format === 'webp' && {
            effort: 4,  // Compression effort (0-6, higher = smaller file but slower)
            smartSubsample: true,  // Better quality at low bitrates
          }),
        })
        .toBuffer();

      const thumbnailSizeKB = (thumbnailBuffer.length / 1024).toFixed(1);
      const compressionRatio = ((1 - thumbnailBuffer.length / imageBuffer.length) * 100).toFixed(1);
      
      console.log(`[ThumbnailGenerator] Generated thumbnail (${thumbnailSizeKB} KB)`);
      console.log(`[ThumbnailGenerator] Compression: ${compressionRatio}%`);

      // Parse destination path
      const { objectName } = this.parseObjectPath(destinationPath);
      const thumbnailFile = new S3ObjectFile(objectName);

      // Upload the thumbnail to the private bucket.
      await thumbnailFile.save(thumbnailBuffer, {
        metadata: {
          contentType: `image/${opts.format}`,
          cacheControl: 'public, max-age=31536000',  // Cache for 1 year
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
      });

      console.log(`[ThumbnailGenerator] ✓ Uploaded thumbnail to ${destinationPath}`);

      // Set ACL policy to make thumbnail publicly readable
      // Visibility is enforced by the application, not by a public bucket ACL.
      const aclPolicy: ObjectAclPolicy = {
        owner: 'system',  // System-generated thumbnails
        visibility: 'public',  // Publicly readable (low-res previews are safe)
      };
      await setObjectAclPolicy(thumbnailFile, aclPolicy);
      console.log(`[ThumbnailGenerator] ✓ Set ACL policy to public`);

      // Return the object path (not public URL, for consistency with original images)
      return destinationPath;

    } catch (error) {
      console.error('[ThumbnailGenerator] ✗ Error generating thumbnail:', error);
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate WebP thumbnail from uploaded image during upload flow
   * @param originalFile - Original uploaded file
   * @param uploadId - Unique upload ID
   * @param privateObjectDir - Private object directory from env (same location as originals)
   * @returns Thumbnail path
   */
  async generateUploadThumbnail(
    originalFile: S3ObjectFile,
    uploadId: string,
    privateObjectDir: string
  ): Promise<string> {
    // Thumbnails share the original upload namespace and are exposed only by the
    // dedicated low-resolution application route.
    const thumbnailPath = `${privateObjectDir}/uploads/${uploadId}/thumb.webp`;
    
    return this.generateThumbnail(originalFile, thumbnailPath, {
      width: 400,   // Matches gallery card width (16:9 aspect ratio)
      height: 225,  // Matches gallery card height
      quality: 80,  // Good balance between quality and size
      format: 'webp',  // Modern format, 30% smaller than JPEG
    });
  }

  /**
   * Generate WebP thumbnail from edit result
   * @param editResultFile - Edit result file
   * @param editId - Edit ID
   * @param privateObjectDir - Private object directory from env
   * @returns Thumbnail path
   */
  async generateEditThumbnail(
    editResultFile: S3ObjectFile,
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

// Export singleton instance
export const thumbnailGenerator = new ThumbnailGenerator();
