import type { UpsertUser } from "@shared/schema";

export interface SessionUser {
  claims: {
    sub: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    profile_image_url?: string;
  };
}

declare global {
  namespace Express {
    interface User extends SessionUser {}
  }
}

interface GoogleClaims {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export function mapGoogleClaims(claims: GoogleClaims): {
  user: UpsertUser;
  session: SessionUser;
} {
  if (!claims.sub) {
    throw new Error("Google identity is missing a subject");
  }

  const id = `google:${claims.sub}`;
  const user: UpsertUser = {
    id,
    email: claims.email,
    firstName: claims.given_name,
    lastName: claims.family_name,
    profileImageUrl: claims.picture,
  };

  return {
    user,
    session: {
      claims: {
        sub: id,
        email: claims.email,
        first_name: claims.given_name,
        last_name: claims.family_name,
        profile_image_url: claims.picture,
      },
    },
  };
}
