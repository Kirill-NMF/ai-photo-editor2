function validateUploadKey(key: string): string {
  const segments = key.split("/");
  if (
    segments[0] !== "uploads" ||
    segments.length < 2 ||
    segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("\\"))
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

export function keyFromUploadUrl(rawUrl: string, endpoint: string, bucket: string): string {
  const url = new URL(rawUrl);
  const endpointUrl = new URL(endpoint);
  if (url.protocol !== endpointUrl.protocol) {
    throw new Error("Upload URL uses an unexpected protocol");
  }

  const pathStyleHost = url.host === endpointUrl.host;
  const virtualHost = url.host === `${bucket}.${endpointUrl.host}`;
  let key: string;

  if (pathStyleHost) {
    const prefix = `/${bucket}/`;
    if (!url.pathname.startsWith(prefix)) throw new Error("Unexpected S3 bucket");
    key = url.pathname.slice(prefix.length);
  } else if (virtualHost) {
    key = url.pathname.slice(1);
  } else {
    throw new Error("Upload URL uses an unexpected host");
  }

  return validateUploadKey(decodeURIComponent(key));
}
