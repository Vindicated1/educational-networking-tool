import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import {
  addComment,
  getThreads,
  incrementThreadVotes,
  threadExists,
  verifyComment,
} from "@/lib/db";

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

  const payload = await request.json().catch(() => ({}));
  const action = String(payload.action ?? "");

  if (!["upvote", "reply", "verify"].includes(action)) {
    return NextResponse.json({ error: "Unknown thread action." }, { status: 400 });
  }

  const body = String(payload.body ?? "").trim();
  if (action === "reply" && !body) {
    return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });
  }
  if (action === "verify" && user.role !== "Faculty" && user.role !== "Admin") {
    return NextResponse.json({ error: "Only faculty and admins can verify answers." }, { status: 403 });
  }

  try {
    if (!(await threadExists(threadId))) {
      return NextResponse.json({ error: "Thread not found." }, { status: 404 });
    }

    if (action === "upvote") {
      await incrementThreadVotes(threadId);
    } else if (action === "reply") {
      await addComment({
        thread_id: threadId,
        author: user.fullName,
        role: user.role,
        body,
      });
    } else {
      const commentId = Number(payload.commentId);
      if (!Number.isInteger(commentId) || !(await verifyComment(threadId, commentId))) {
        return NextResponse.json({ error: "Reply not found." }, { status: 404 });
      }
    }

    const updatedThread = (await getThreads()).find((item) => item.id === threadId);
    return NextResponse.json({ thread: updatedThread });
  } catch (error) {
    console.error("Could not update forum thread.", error);
    return NextResponse.json({ error: "The thread action could not be saved right now." }, { status: 503 });
  }
}
