function validateUploadKey(key: string): string {
  const segments = key.split("/");
  if (
    segments[0] !== "uploads" ||
    segments.length < 2 ||
    segments.some(
      (segment) =>
        segment === "." ||
        segment === ".." ||
        !/^[a-zA-Z0-9._-]+$/.test(segment),
    )
  ) {
    throw new Error("Invalid object key");
  }
  return key;
}

export function objectPathFromKey(key: string): string {
  return `/objects/${validateUploadKey(key)}`;
}

export function keyFromObjectPath(objectPath: string): string {
  if (!objectPath.startsWith("/objects/")) {
    throw new Error("Invalid object path");
  }
  return validateUploadKey(objectPath.slice("/objects/".length));
}

export function keyFromUploadUrl(rawUrl: string, expectedOrigin: string): string {
  const url = new URL(rawUrl);
  const origin = new URL(expectedOrigin);
  if (url.origin !== origin.origin || url.search || url.hash) {
    throw new Error("Upload URL uses an unexpected origin");
  }

  if (!url.pathname.startsWith("/objects/")) throw new Error("Invalid upload URL");
  return keyFromObjectPath(url.pathname);
}
