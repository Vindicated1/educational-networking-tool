import { NextResponse } from "next/server";
import { assertJwtSecretConfigured, COOKIE_NAME, signToken, verifyPassword } from "@/lib/auth";
import { getUserByEmail, serializeUser } from "@/lib/db";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  let user;
  try {
    assertJwtSecretConfigured();
    user = await getUserByEmail(email);
  } catch (error) {
    console.error("Login service is unavailable.", error);
    return NextResponse.json(
      { error: "Login is temporarily unavailable. Check the server database and JWT configuration." },
      { status: 503 },
    );
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  let token: string;
  try {
    token = signToken({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    });
  } catch (error) {
    console.error("Could not create a login session.", error);
    return NextResponse.json({ error: "Login is temporarily unavailable. Check JWT configuration." }, { status: 503 });
  }

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
