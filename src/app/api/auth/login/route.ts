import { NextResponse } from "next/server";
import { COOKIE_NAME, signToken, verifyPassword } from "@/lib/auth";
import { getUserByEmail, serializeUser } from "@/lib/db";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  });

  const response = NextResponse.json({ user: serializeUser(user) });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
