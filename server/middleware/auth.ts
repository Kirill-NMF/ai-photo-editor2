import { Request, Response, NextFunction, type RequestHandler } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any; // You can replace any with a more specific user type
  userId?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
    userId?: string;
  }
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    if (decoded && typeof decoded === "object" && "sub" in decoded) {
      req.userId = String(decoded.sub);
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export const authenticateJWT = (): RequestHandler => authMiddleware;