import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { createThread, getThreads } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ threads: await getThreads() });
  } catch (error) {
    console.error("Could not load forum threads.", error);
    return NextResponse.json({ error: "Forum data is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let sessionUser;
  try {
    sessionUser = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const title = String(payload.title ?? "").trim();
  const course = String(payload.course ?? "").trim();
  const category = String(payload.category ?? "Question").trim();
  const body = String(payload.body ?? "").trim();

  if (!title || !course || !body) {
    return NextResponse.json({ error: "Title, course, and body are required." }, { status: 400 });
  }
  if (title.length > 200 || body.length > 10000) {
    return NextResponse.json({ error: "Title must be 200 characters or fewer and body must be 10,000 characters or fewer." }, { status: 400 });
  }
  if (category !== "Question" && category !== "Discussion") {
    return NextResponse.json({ error: "Choose Question or Discussion for the category." }, { status: 400 });
  }

  try {
    const thread = await createThread({
      title,
      course,
      category,
      author: sessionUser.fullName,
      body,
    });
    return NextResponse.json({ thread });
  } catch (error) {
    console.error("Could not create forum thread.", error);
    return NextResponse.json({ error: "The thread could not be saved right now." }, { status: 503 });
  }
}
