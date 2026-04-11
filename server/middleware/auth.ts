import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie("token");
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function checkAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token;

  if (token) {
    try {
      jwt.verify(token, JWT_SECRET);
      req.isAuthenticated = true;
    } catch {
      res.clearCookie("token");
      req.isAuthenticated = false;
    }
  } else {
    req.isAuthenticated = false;
  }

  next();
}
