import type { UpsertUser } from "@shared/schema";

import type { SessionUser } from "./googleIdentity";

const DEVELOPMENT_USER_ID = "dev:local";

export function createDevelopmentIdentity(): {
  user: UpsertUser;
  session: SessionUser;
} {
  return {
    user: {
      id: DEVELOPMENT_USER_ID,
      email: "developer@local.invalid",
      firstName: "Local",
      lastName: "Developer",
      isAdmin: false,
    },
    session: {
      claims: {
        sub: DEVELOPMENT_USER_ID,
        email: "developer@local.invalid",
        first_name: "Local",
        last_name: "Developer",
      },
    },
  };
}

export function isAllowedDevelopmentOrigin(
  requestOrigin: string | undefined,
  configuredBaseUrl: string,
): boolean {
  if (!requestOrigin) return false;

  try {
    return new URL(requestOrigin).origin === new URL(configuredBaseUrl).origin;
  } catch {
    return false;
  }
}
