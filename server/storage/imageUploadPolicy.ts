import sharp from "sharp";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const FORMAT_CONTENT_TYPES: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function validateImageUpload(contentType?: string, size?: number): void {
  const normalizedType = contentType?.split(";", 1)[0].trim().toLowerCase();
  if (!normalizedType || !ALLOWED_IMAGE_TYPES.has(normalizedType)) {
    throw new Error("Unsupported image type");
  }
  if (!Number.isFinite(size) || !size || size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large");
  }
}

export async function validateImageContents(
  body: Buffer,
  contentType?: string,
): Promise<void> {
  const normalizedType = contentType?.split(";", 1)[0].trim().toLowerCase();
  try {
    const metadata = await sharp(body, { limitInputPixels: 100_000_000 }).metadata();
    if (
      !metadata.format ||
      FORMAT_CONTENT_TYPES[metadata.format] !== normalizedType ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new Error("Unexpected image metadata");
    }
  } catch {
    throw new Error("Invalid image contents");
  }
}
