import { db } from "../db";
import { images } from "../../shared/schema";
import { thumbnailGenerator } from "../thumbnailGenerator";
import { ObjectStorageService } from "../objectStorage";
import { isNull, eq } from "drizzle-orm";

async function backfillThumbnails() {
  console.log('[Backfill] Starting thumbnail generation for existing images...');

  const imagesWithoutThumbnails = await db
    .select()
    .from(images)
    .where(isNull(images.thumbnailUrl))
    .limit(100);

  console.log(`[Backfill] Found ${imagesWithoutThumbnails.length} images without thumbnails`);

  const objectStorageService = new ObjectStorageService();
  const privateObjectDir = objectStorageService.getPrivateObjectDir();

  let successCount = 0;
  let errorCount = 0;

  for (const image of imagesWithoutThumbnails) {
    try {
      console.log(`[Backfill] Processing image ${image.id}...`);

      const originalFile = await objectStorageService.getObjectEntityFile(image.originalUrl);
      
      const uploadId = extractUploadId(image.originalUrl);
      const thumbnailUrl = await thumbnailGenerator.generateUploadThumbnail(
        originalFile,
        uploadId,
        privateObjectDir
      );

      await db
        .update(images)
        .set({ thumbnailUrl })
        .where(eq(images.id, image.id));

      console.log(`[Backfill] ✓ Generated thumbnail for image ${image.id}`);
      successCount++;

    } catch (error) {
      console.error(`[Backfill] ✗ Failed for image ${image.id}:`, error);
      errorCount++;
    }
  }

  console.log(`[Backfill] Complete! Success: ${successCount}, Errors: ${errorCount}`);
}

function extractUploadId(url: string): string {
  const uploadsMatch = url.match(/\/uploads\/([^\/]+)/);
  if (uploadsMatch) {
    return uploadsMatch[1];
  }
  
  const editsMatch = url.match(/\/edits\/([^\/]+)/);
  if (editsMatch) {
    return editsMatch[1];
  }
  
  const uuidMatch = url.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) {
    return uuidMatch[1];
  }
  
  throw new Error(`Invalid upload URL format: ${url}`);
}

if (require.main === module) {
  backfillThumbnails()
    .then(() => {
      console.log('[Backfill] Script finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Backfill] Fatal error:', error);
      process.exit(1);
    });
}

export { backfillThumbnails };
