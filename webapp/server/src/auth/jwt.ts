import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  const options = { expiresIn: config.jwtExpiresIn } as SignOptions;
  return jwt.sign(payload, config.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
