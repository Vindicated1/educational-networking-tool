import jwt, { type JwtPayload } from "jsonwebtoken";

export type SessionUser = {
  userId: number;
  email: string;
  fullName: string;
  role: "Student" | "Faculty" | "Admin";
};

export const COOKIE_NAME = "ui_auth";

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be configured in production.");
  }
  return "local-development-only-secret";
}

export function assertJwtSecretConfigured() {
  getJwtSecret();
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser {
  const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;

  return {
    userId: Number(payload.userId ?? payload.sub ?? 0),
    email: String(payload.email ?? ""),
    fullName: String(payload.fullName ?? ""),
    role: String(payload.role ?? "Student") as SessionUser["role"],
  };
}
