import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AuthUser = {
  sub: string;
  email: string;
  roles?: string[];
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
    (req as Request & { user?: unknown }).user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRoles(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: AuthUser }).user;
    const roles = user?.roles ?? [];
    const hasRole = roles.some((role) => allowedRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ message: "Permission denied" });
      return;
    }

    next();
  };
}
