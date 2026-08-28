const MAX_PENDING_UPLOADS = 10;

export function rememberPendingUpload(
  pending: string[] | undefined,
  objectPath: string,
): string[] {
  return [...(pending ?? []).filter((path) => path !== objectPath), objectPath]
    .slice(-MAX_PENDING_UPLOADS);
}

export function consumePendingUpload(
  pending: string[] | undefined,
  objectPath: string,
): string[] | null {
  if (!pending?.includes(objectPath)) return null;
  return pending.filter((path) => path !== objectPath);
}
