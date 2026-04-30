import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-in-production";

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "90d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
