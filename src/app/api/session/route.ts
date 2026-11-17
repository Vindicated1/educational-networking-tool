import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { db, serializeUser } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  try {
    const sessionUser = verifyToken(token);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(sessionUser.userId) as
      | {
          id: number;
          full_name: string;
          email: string;
          password_hash: string;
          role: "Student" | "Faculty" | "Admin";
        }
      | undefined;

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: serializeUser(user) });
  } catch {
    return NextResponse.json({ user: null });
  }
}
