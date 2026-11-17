import { NextResponse } from "next/server";
import { assertJwtSecretConfigured, COOKIE_NAME, hashPassword, signToken } from "@/lib/auth";
import { createUser, getUserByEmail, serializeUser } from "@/lib/db";

const emailPattern = /(@stu\.ui\.edu\.ng|@dlc\.ui\.edu\.ng|@ui\.edu\.ng)$/i;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  const fullName = String(payload.fullName ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: "Please provide a name, email, and password." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  if (!emailPattern.test(email)) {
    return NextResponse.json({ error: "Use an @stu.ui.edu.ng, @dlc.ui.edu.ng, or @ui.edu.ng email address." }, { status: 400 });
  }

  const role = email.endsWith("@ui.edu.ng") && !email.endsWith("@stu.ui.edu.ng") && !email.endsWith("@dlc.ui.edu.ng")
    ? "Faculty"
    : "Student";

  try {
    assertJwtSecretConfigured();
  } catch (error) {
    console.error("JWT_SECRET is not configured for registration.", error);
    return NextResponse.json(
      { error: "JWT_SECRET is missing from the Vercel environment for this deployment. Add it and redeploy." },
      { status: 503 },
    );
  }

  let existingUser;
  try {
    existingUser = await getUserByEmail(email);
  } catch (error) {
    console.error("Supabase user lookup failed during registration.", error);
    return NextResponse.json(
      { error: "Could not read the Supabase users table. Check the Supabase URL/key and run the database migration." },
      { status: 503 },
    );
  }
  if (existingUser) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  let user;
  try {
    user = await createUser({
      full_name: fullName,
      email,
      password_hash: hashPassword(password),
      role,
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    console.error("Could not insert the new Supabase user.", error);
    return NextResponse.json(
      { error: "Could not create the account in Supabase. Check the users table, service-role key, and database migration." },
      { status: 503 },
    );
  }

  let token: string;
  try {
    token = signToken({ userId: user.id, email, fullName, role });
  } catch (error) {
    console.error("Could not create a registration session.", error);
    return NextResponse.json(
      { error: "JWT_SECRET could not sign the new account session. Check the Vercel environment and redeploy." },
      { status: 503 },
    );
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
