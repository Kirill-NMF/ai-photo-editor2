import { db } from "./db";
import { images, edits } from "../shared/schema";
import { eq } from "drizzle-orm";
import { thumbnailGenerator } from "./thumbnailGenerator";
import { ObjectStorageService } from "./objectStorage";

/**
 * Generate thumbnail in background (fire-and-forget)
 * This function is safe to call without await - errors are caught and logged
 * 
 * @param imageId - Database ID of the image
 * @param originalUrl - Object path of the original image (e.g., "/objects/uploads/abc-123/original.jpg")
 * @returns Promise that resolves when thumbnail is generated (or fails silently)
 */
export async function generateThumbnailInBackground(
  imageId: number,
  originalUrl: string
): Promise<void> {
  try {
    console.log(`[ThumbnailBG] Starting thumbnail generation for image ${imageId}`);
    console.log(`[ThumbnailBG] Original URL: ${originalUrl}`);

    // Initialize object storage service
    const objectStorageService = new ObjectStorageService();
    const privateObjectDir = objectStorageService.getPrivateObjectDir();

    console.log(`[ThumbnailBG] Using private directory: ${privateObjectDir}`);

    // Get the original file from object storage.
    const originalFile = await objectStorageService.getObjectEntityFile(originalUrl);
    
    // Extract upload ID from the path
    const uploadId = extractUploadIdFromPath(originalUrl);
    console.log(`[ThumbnailBG] Extracted upload ID: ${uploadId}`);

    // Generate WebP thumbnail in PRIVATE directory (ACL policy makes it publicly accessible)
    const startTime = Date.now();
    const thumbnailPath = await thumbnailGenerator.generateUploadThumbnail(
      originalFile,
      uploadId,
      privateObjectDir
    );
    const duration = Date.now() - startTime;
    
    console.log(`[ThumbnailBG] Thumbnail generated in ${duration}ms: ${thumbnailPath}`);

    // Store the stable application path rather than a provider-specific URL.
    const thumbnailUrl = `/objects/uploads/${uploadId}/thumb.webp`;
    
    console.log(`[ThumbnailBG] Saving to DB: ${thumbnailUrl}`);

    // Update database with thumbnail URL
    await db
      .update(images)
      .set({ thumbnailUrl })
      .where(eq(images.id, imageId));

    console.log(`[ThumbnailBG] ✓ Database updated for image ${imageId}`);

  } catch (error) {
    // Log error but don't throw (fire-and-forget pattern)
    console.error(`[ThumbnailBG] ✗ Failed to generate thumbnail for image ${imageId}:`, error);
    console.error(`[ThumbnailBG] Original URL: ${originalUrl}`);
    
    // Gallery will use fallback to originalUrl, so this is not critical
  }
}

/**
 * Extract upload ID from object path
 * Handles different path formats:
 *   /objects/uploads/abc-123/original.jpg → abc-123
 *   /objects/private/user-456/uploads/abc-123/original.jpg → abc-123
 *   /objects/edits/def-456/result.jpg → def-456
 * 
 * @param objectPath - Full object path
 * @returns Upload/edit ID
 */
function extractUploadIdFromPath(objectPath: string): string {
  const parts = objectPath.split('/');
  
  // Find "uploads" segment in path
  const uploadsIndex = parts.indexOf('uploads');
  if (uploadsIndex !== -1 && uploadsIndex + 1 < parts.length) {
    return parts[uploadsIndex + 1];
  }
  
  // Find "edits" segment as fallback
  const editsIndex = parts.indexOf('edits');
  if (editsIndex !== -1 && editsIndex + 1 < parts.length) {
    return parts[editsIndex + 1];
  }
  
  throw new Error(`Cannot extract upload ID from path: ${objectPath}`);
}

/**
 * Generate thumbnails for multiple images in batch
 * Useful for admin endpoint and backfill operations
 * 
 * @param imageRecords - Array of image records with id and originalUrl
 * @returns Statistics about the batch operation
 */
export async function generateThumbnailsBatch(
  imageRecords: Array<{ id: number; originalUrl: string }>
): Promise<{ processed: number; errors: number }> {
  console.log(`[ThumbnailBatch] Starting batch generation for ${imageRecords.length} images`);

  let processed = 0;
  let errors = 0;

  for (const image of imageRecords) {
    try {
      await generateThumbnailInBackground(image.id, image.originalUrl);
      processed++;
    } catch (error) {
      // Error already logged in generateThumbnailInBackground
      errors++;
    }
  }

  console.log(`[ThumbnailBatch] Complete! Processed: ${processed}, Errors: ${errors}`);

  return { processed, errors };
}

/**
 * Generate thumbnail for AI edit result
 * Reuses thumbnail generation logic but updates edits table instead of images
 * 
 * @param editId - Database ID of the edit
 * @param resultUrl - Object path of the AI edit result (e.g., "/objects/uploads/abc-123")
 * @returns Promise that resolves when thumbnail is generated (or fails silently)
 */
export async function generateEditThumbnailInBackground(
  editId: number,
  resultUrl: string
): Promise<void> {
  try {
    console.log(`[EditThumb] Starting thumbnail generation for edit ${editId}`);
    console.log(`[EditThumb] Result URL: ${resultUrl}`);

    // Initialize object storage service
    const objectStorageService = new ObjectStorageService();
    const privateObjectDir = objectStorageService.getPrivateObjectDir();

    console.log(`[EditThumb] Using private directory: ${privateObjectDir}`);

    // Get the result file from object storage.
    const resultFile = await objectStorageService.getObjectEntityFile(resultUrl);
    
    // Extract upload ID from the path
    // AI edits use same path structure as uploads: /objects/uploads/{uploadId}
    const uploadId = extractUploadIdFromPath(resultUrl);
    console.log(`[EditThumb] Extracted upload ID: ${uploadId}`);

    // Generate WebP thumbnail (reuse existing logic)
    const startTime = Date.now();
    const thumbnailPath = await thumbnailGenerator.generateUploadThumbnail(
      resultFile,
      uploadId,
      privateObjectDir
    );
    const duration = Date.now() - startTime;
    
    console.log(`[EditThumb] Thumbnail generated in ${duration}ms: ${thumbnailPath}`);

    // Store the provider-independent application path.
    const thumbnailUrl = `/objects/uploads/${uploadId}/thumb.webp`;
    
    console.log(`[EditThumb] Saving to DB: ${thumbnailUrl}`);

    // Update EDITS table (not images!)
    await db
      .update(edits)
      .set({ thumbnailUrl })
      .where(eq(edits.id, editId));

    console.log(`[EditThumb] ✓ Database updated for edit ${editId}`);

  } catch (error) {
    // Log error but don't throw (fire-and-forget pattern)
    console.error(`[EditThumb] ✗ Failed to generate thumbnail for edit ${editId}:`, error);
    console.error(`[EditThumb] Result URL: ${resultUrl}`);
  }
}
