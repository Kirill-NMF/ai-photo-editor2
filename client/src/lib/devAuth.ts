type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export async function isDevelopmentLoginAvailable(
  fetcher: Fetcher = fetch,
): Promise<boolean> {
  try {
    const response = await fetcher("/api/auth/dev/config");
    if (!response.ok) return false;
    const data = await response.json() as { enabled?: unknown };
    return data.enabled === true;
  } catch {
    return false;
  }
}

export async function startDevelopmentLogin(
  fetcher: Fetcher = fetch,
): Promise<string> {
  const response = await fetcher("/api/auth/dev", { method: "POST" });
  if (!response.ok) throw new Error("Development login failed");

  const data = await response.json() as { redirectTo?: unknown };
  return typeof data.redirectTo === "string"
    && data.redirectTo.startsWith("/")
    && !data.redirectTo.startsWith("//")
    ? data.redirectTo
    : "/editor";
}
