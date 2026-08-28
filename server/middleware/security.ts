import type { Express } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";

import { getConfig } from "../config";

export function configureSecurity(app: Express): void {
  const config = getConfig();
  const s3Origin = config.s3 ? new URL(config.s3.endpoint).origin : undefined;

  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://telegram.org"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", ...(s3Origin ? [s3Origin] : [])],
        frameSrc: ["'self'", "https://oauth.telegram.org", "https://telegram.org"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: config.nodeEnv === "production" ? [] : null,
      },
    },
    crossOriginResourcePolicy: { policy: "same-origin" },
  }));

  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
  app.use("/api/auth", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
  app.use("/api/objects/upload", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }));
}
