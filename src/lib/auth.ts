import bcrypt from "bcryptjs";
export { assertJwtSecretConfigured, COOKIE_NAME, signToken, verifyToken } from "@/lib/session-token";
export type { SessionUser } from "@/lib/session-token";

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compareSync(password, hash);
}
