import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getUserById, serializeUser } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  let sessionUser;
  try {
    sessionUser = verifyToken(token);
  } catch {
    return NextResponse.json({ user: null });
  }

  try {
    const user = await getUserById(sessionUser.userId);
    return NextResponse.json({ user: user ? serializeUser(user) : null });
  } catch (error) {
    console.error("Could not load the current user session.", error);
    return NextResponse.json({ error: "Session service is temporarily unavailable." }, { status: 503 });
  }
}
