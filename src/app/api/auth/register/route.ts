import { NextResponse } from "next/server";
import { COOKIE_NAME, hashPassword, signToken } from "@/lib/auth";
import { db, getUserByEmail, serializeUser, type DbUser } from "@/lib/db";

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

  if (getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const role = email.endsWith("@ui.edu.ng") && !email.endsWith("@stu.ui.edu.ng") && !email.endsWith("@dlc.ui.edu.ng")
    ? "Faculty"
    : "Student";

  const passwordHash = hashPassword(password);
  const userResult = db
    .prepare(
      `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)`
    )
    .run(fullName, email, passwordHash, role);

  const user: DbUser = {
    id: Number(userResult.lastInsertRowid),
    full_name: fullName,
    email,
    password_hash: passwordHash,
    role,
  };

  const token = signToken({
    userId: Number(userResult.lastInsertRowid),
    email,
    fullName,
    role,
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
