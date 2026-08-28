export type EditorRestoreSource = "url" | "cache";
export type RestoreFailureAction = "discard-stale-cache" | "notify";

export function getRestoreFailureAction(
  source: EditorRestoreSource,
  status: number,
): RestoreFailureAction {
  if (source === "cache" && (status === 403 || status === 404)) {
    return "discard-stale-cache";
  }

  return "notify";
}
