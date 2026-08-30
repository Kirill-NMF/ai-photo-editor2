import sharp from "sharp";

type RasterContentType = "image/jpeg" | "image/png" | "image/webp";

export interface NormalizedImageReference {
  body: Buffer;
  contentType: RasterContentType;
}

export interface ImageDisplayDimensions {
  width: number;
  height: number;
}

function normalizeContentType(contentType?: string): RasterContentType {
  const normalized = contentType?.split(";", 1)[0].trim().toLowerCase();
  if (
    normalized !== "image/jpeg"
    && normalized !== "image/png"
    && normalized !== "image/webp"
  ) {
    throw new Error("Unsupported image type");
  }
  return normalized;
}

export async function getImageDisplayDimensions(
  body: Buffer,
): Promise<ImageDisplayDimensions> {
  const metadata = await sharp(body, { limitInputPixels: 100_000_000 }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image contents");
  }

  const orientation = metadata.orientation ?? 1;
  return orientation >= 5 && orientation <= 8
    ? { width: metadata.height, height: metadata.width }
    : { width: metadata.width, height: metadata.height };
}

export async function normalizeImageReference(
  body: Buffer,
  contentType?: string,
): Promise<NormalizedImageReference> {
  const normalizedContentType = normalizeContentType(contentType);
  const metadata = await sharp(body, { limitInputPixels: 100_000_000 }).metadata();
  const orientation = metadata.orientation ?? 1;

  if (orientation === 1) {
    return { body, contentType: normalizedContentType };
  }

  let pipeline = sharp(body, { limitInputPixels: 100_000_000 }).rotate();
  if (normalizedContentType === "image/jpeg") {
    pipeline = pipeline.jpeg({ quality: 92, mozjpeg: true });
  } else if (normalizedContentType === "image/png") {
    pipeline = pipeline.png({ compressionLevel: 9 });
  } else {
    pipeline = pipeline.webp({ quality: 92, effort: 4 });
  }

  return {
    body: await pipeline.toBuffer(),
    contentType: normalizedContentType,
  };
}
