import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { getModerationQueue, updateModerationStatus } from "@/lib/db";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let sessionUser;
  try {
    sessionUser = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Invalid session." }, { status: 401 });
  }

  if (sessionUser.role !== "Admin" && sessionUser.role !== "Faculty") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    return NextResponse.json({ queue: await getModerationQueue() });
  } catch (error) {
    console.error("Could not load moderation queue.", error);
    return NextResponse.json({ error: "Admin data is temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let sessionUser;
  try {
    sessionUser = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  if (sessionUser.role !== "Admin" && sessionUser.role !== "Faculty") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const id = Number(payload.id);
  const status = String(payload.status ?? "");
  if (!Number.isInteger(id) || id < 1 || !["Approved", "Needs changes"].includes(status)) {
    return NextResponse.json({ error: "Provide a valid moderation action." }, { status: 400 });
  }

  try {
    if (!(await updateModerationStatus(id, status))) {
      return NextResponse.json({ error: "Moderation item not found." }, { status: 404 });
    }

    return NextResponse.json({ queue: await getModerationQueue() });
  } catch (error) {
    console.error("Could not update moderation status.", error);
    return NextResponse.json({ error: "Moderation is temporarily unavailable." }, { status: 503 });
  }
}
