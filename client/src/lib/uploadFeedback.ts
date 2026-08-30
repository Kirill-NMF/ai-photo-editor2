export const ACCEPTED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

interface UploadFailure {
  phase: "selection" | "transfer" | "registration";
  code?: string;
  status?: number;
  serverError?: string;
}

export function getUploadFailureMessage(failure: UploadFailure): string {
  const code = failure.code?.toUpperCase();
  const serverError = failure.serverError?.toLowerCase();

  if (code === "FILE_TYPE_ERROR" || serverError?.includes("unsupported image type")) {
    return "This photo format is not supported. Choose a JPEG, PNG, or WebP image.";
  }
  if (
    code === "FILE_SIZE_ERROR"
    || failure.status === 413
    || serverError?.includes("too large")
  ) {
    return "This photo is larger than 10MB. Choose a smaller image.";
  }
  if (failure.status === 401) {
    return "Your session expired. Sign in again, then retry the upload.";
  }
  if (failure.status === 507) {
    return "Image storage is temporarily full. Please try again later.";
  }
  if (failure.phase === "registration") {
    return "The photo uploaded, but its image details could not be saved. Choose the photo again.";
  }
  if (failure.phase === "selection") {
    return "This photo cannot be selected. Choose a JPEG, PNG, or WebP image up to 10MB.";
  }
  return "The upload did not finish. Check your connection and try again.";
}
