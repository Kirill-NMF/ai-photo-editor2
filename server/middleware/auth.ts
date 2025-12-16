import type { RequestHandler } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    tokenPayload?: string | JwtPayload;
  }
}

export function authenticateJWT(): RequestHandler {
  return (req, res, next) => {
    try {
      const token = req.cookies.auth_token;

      if (!token) {
        return res.status(401).json({ error: "Unauthorized: Missing token" });
      }

      
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        console.error("JWT_SECRET is not configured");
        return res.status(500).json({ error: "Server misconfiguration" });
      }

      const payload = jwt.verify(token, jwtSecret);

      if (!payload || typeof payload !== "object" || !payload.sub) {
        return res.status(401).json({ error: "Unauthorized: Invalid token" });
      }

      req.userId = payload.sub as string;
      req.tokenPayload = payload;

      next();
    } catch (error) {
      console.error("JWT authentication failed:", error);
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };
}