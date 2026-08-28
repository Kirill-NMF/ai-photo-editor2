import type { Express } from "express";
import type { UpsertUser } from "@shared/schema";

import type { AppConfig } from "../config";
import {
  createDevelopmentIdentity,
  isAllowedDevelopmentOrigin,
} from "./devIdentity";

interface DevelopmentAuthDependencies {
  config: AppConfig;
  upsertUser: (user: UpsertUser) => Promise<unknown>;
}

function isDevelopmentAuthAvailable(config: AppConfig): boolean {
  return config.devAuthEnabled
    && config.nodeEnv === "development"
    && ["127.0.0.1", "localhost", "::1"].includes(config.host);
}

function getDevelopmentBaseUrl(config: AppConfig): string {
  if (config.publicBaseUrl) return config.publicBaseUrl;
  const host = config.host === "::1" ? "[::1]" : config.host;
  return `http://${host}:${config.port}`;
}

export function registerDevelopmentAuth(
  app: Express,
  { config, upsertUser }: DevelopmentAuthDependencies,
): void {
  app.get("/api/auth/dev/config", (_req, res) => {
    if (!isDevelopmentAuthAvailable(config)) return res.sendStatus(404);
    return res.json({ enabled: true });
  });

  app.post("/api/auth/dev", async (req, res, next) => {
    if (!isDevelopmentAuthAvailable(config)) return res.sendStatus(404);
    if (!isAllowedDevelopmentOrigin(req.get("origin"), getDevelopmentBaseUrl(config))) {
      return res.status(403).json({ message: "Invalid request origin" });
    }

    try {
      const identity = createDevelopmentIdentity();
      await upsertUser(identity.user);
      req.login(identity.session, (error) => {
        if (error) return next(error);
        return res.json({ redirectTo: "/editor" });
      });
    } catch (error) {
      next(error);
    }
  });
}
