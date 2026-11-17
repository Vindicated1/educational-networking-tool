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

  try {
    assertJwtSecretConfigured();
  } catch (error) {
    console.error("JWT_SECRET is not configured for login.", error);
    return NextResponse.json(
      { error: "JWT_SECRET is missing from the Vercel environment for this deployment. Add it and redeploy." },
      { status: 503 },
    );
  }

  let user;
  try {
    user = await getUserByEmail(email);
  } catch (error) {
    console.error("Supabase user lookup failed during login.", error);
    return NextResponse.json(
      { error: "Could not read the Supabase users table. Check the Supabase URL/key and run the database migration." },
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
    return NextResponse.json({ error: "JWT_SECRET could not sign the login session. Check the Vercel environment and redeploy." }, { status: 503 });
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
