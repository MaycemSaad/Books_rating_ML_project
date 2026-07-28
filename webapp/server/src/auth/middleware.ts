import type { NextFunction, Request, Response } from "express";
import { verifyToken, type TokenPayload } from "./jwt.js";

export interface AuthedRequest extends Request {
  user?: TokenPayload;
}

/** Rejects the request when no valid bearer token is present. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const user = readUser(req);
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.user = user;
  next();
}

/** Attaches the user when a token is present but never blocks the request. */
export function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  req.user = readUser(req) ?? undefined;
  next();
}

function readUser(req: Request): TokenPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(header.slice(7));
  } catch {
    return null;
  }
}
