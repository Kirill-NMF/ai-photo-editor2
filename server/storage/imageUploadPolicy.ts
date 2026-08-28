const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImageUpload(contentType?: string, size?: number): void {
  const normalizedType = contentType?.split(";", 1)[0].trim().toLowerCase();
  if (!normalizedType || !ALLOWED_IMAGE_TYPES.has(normalizedType)) {
    throw new Error("Unsupported image type");
  }
  if (!Number.isFinite(size) || !size || size > MAX_IMAGE_BYTES) {
    throw new Error("Image is too large");
  }
}
