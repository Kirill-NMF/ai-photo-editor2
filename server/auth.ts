import connectPg from "connect-pg-simple";
import type { Express, RequestHandler } from "express";
import session from "express-session";
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";

import { getConfig } from "./config";
import { storage } from "./storage";
import { mapGoogleClaims, type SessionUser } from "./auth/googleIdentity";
import { registerDevelopmentAuth } from "./auth/devAuth";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const GOOGLE_STRATEGY = "google";

export function getSession() {
  const config = getConfig();
  const PgStore = connectPg(session);

  return session({
    name: "photoai.sid",
    secret: config.sessionSecret,
    store: new PgStore({
      conString: config.databaseUrl,
      createTableIfMissing: true,
      ttl: Math.floor(SESSION_TTL_MS / 1000),
      tableName: "sessions",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "lax",
      maxAge: SESSION_TTL_MS,
    },
  });
}

export async function setupAuth(app: Express) {
  const config = getConfig();

  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user: SessionUser, done) => done(null, user));

  registerDevelopmentAuth(app, {
    config,
    upsertUser: (user) => storage.upsertUser(user),
  });

  if (config.google) {
    const oidc = await client.discovery(
      new URL("https://accounts.google.com"),
      config.google.clientId,
      config.google.clientSecret,
    );

    const verify: VerifyFunction = async (tokens, verified) => {
      try {
        const claims = tokens.claims();
        if (!claims) throw new Error("Google did not return identity claims");
        const identity = mapGoogleClaims(claims);
        await storage.upsertUser(identity.user);
        verified(null, identity.session);
      } catch (error) {
        verified(error);
      }
    };

    passport.use(
      GOOGLE_STRATEGY,
      new Strategy(
        {
          name: GOOGLE_STRATEGY,
          config: oidc,
          scope: "openid email profile",
          callbackURL: config.google.redirectUri,
        },
        verify,
      ),
    );
  }

  app.get("/api/auth/google", (req, res, next) => {
    if (!config.google) {
      return res.redirect("/login?error=google_not_configured");
    }
    passport.authenticate(GOOGLE_STRATEGY)(req, res, next);
  });

  app.get("/api/auth/google/callback", (req, res, next) => {
    if (!config.google) {
      return res.redirect("/login?error=google_not_configured");
    }
    passport.authenticate(GOOGLE_STRATEGY, {
      successRedirect: "/editor",
      failureRedirect: "/login?error=google_failed",
    })(req, res, next);
  });

  app.get("/api/login", (_req, res) => res.redirect("/api/auth/google"));

  app.get("/api/logout", (req, res, next) => {
    req.logout((error) => {
      if (error) return next(error);
      req.session.destroy((destroyError) => {
        if (destroyError) return next(destroyError);
        res.clearCookie("photoai.sid");
        res.redirect("/");
      });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const user = req.user as SessionUser | undefined;
  if (!req.isAuthenticated() || !user?.claims?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
