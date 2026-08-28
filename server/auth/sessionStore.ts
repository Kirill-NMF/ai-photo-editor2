import type { AppConfig } from "../config";

export function shouldUseMemorySessionStore(config: AppConfig): boolean {
  return config.nodeEnv === "development" && config.devAuthEnabled;
}
