import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { db, getThreads } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Please log in to interact with threads." }, { status: 401 });
  }

  let user;
  try {
    user = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const { id } = await params;
  const threadId = Number(id);
  if (!Number.isInteger(threadId) || threadId < 1) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const thread = db.prepare("SELECT id FROM threads WHERE id = ?").get(threadId);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const action = String(payload.action ?? "");

  if (action === "upvote") {
    db.prepare("UPDATE threads SET votes = votes + 1 WHERE id = ?").run(threadId);
  } else if (action === "reply") {
    const body = String(payload.body ?? "").trim();
    if (!body) {
      return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });
    }

    db.prepare(
      "INSERT INTO comments (thread_id, author, role, body) VALUES (?, ?, ?, ?)",
    ).run(threadId, user.fullName, user.role, body);
  } else if (action === "verify") {
    if (user.role !== "Faculty" && user.role !== "Admin") {
      return NextResponse.json({ error: "Only faculty and admins can verify answers." }, { status: 403 });
    }

    const commentId = Number(payload.commentId);
    const result = db
      .prepare("UPDATE comments SET verified = 1 WHERE id = ? AND thread_id = ?")
      .run(commentId, threadId);
    if (result.changes === 0) {
      return NextResponse.json({ error: "Reply not found." }, { status: 404 });
    }
  } else {
    return NextResponse.json({ error: "Unknown thread action." }, { status: 400 });
  }

  const updatedThread = getThreads().find((item) => item.id === threadId);
  return NextResponse.json({ thread: updatedThread });
}
