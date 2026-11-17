import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { defaultCourse } from "@/lib/courses";
import { db, getResources } from "@/lib/db";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET() {
  return NextResponse.json({ resources: getResources() });
}

export async function POST(request: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Please log in to upload a resource." }, { status: 401 });
  }

  let sessionUser;
  try {
    sessionUser = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload form was invalid." }, { status: 400 });
  }

  const title = String(form.get("title") ?? "").trim();
  const course = String(form.get("course") ?? defaultCourse).trim();
  const file = form.get("file");

  if (!title || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Add a title and select a non-empty file." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Files must be 10 MB or smaller." }, { status: 413 });
  }

  const extension = path.extname(file.name).toLowerCase();
  if (extension !== ".pdf" && extension !== ".docx") {
    return NextResponse.json({ error: "Only PDF or DOCX files are accepted." }, { status: 400 });
  }

  const storageKey = `${randomUUID()}${extension}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, storageKey), Buffer.from(await file.arrayBuffer()), { flag: "wx" });

  try {
    const result = db
      .prepare(
        `INSERT INTO resources (title, course, session, format, size, uploaded_by, file_name, storage_key)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        title,
        course,
        "2026/2027",
        extension === ".pdf" ? "PDF" : "DOCX",
        `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        sessionUser.role,
        file.name,
        storageKey,
      );

    return NextResponse.json({
      resource: {
        id: Number(result.lastInsertRowid),
        title,
        course,
        session: "2026/2027",
        format: extension === ".pdf" ? "PDF" : "DOCX",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        uploaded_by: sessionUser.role,
        file_name: file.name,
      },
    }, { status: 201 });
  } catch (error) {
    await unlink(path.join(UPLOAD_DIR, storageKey));
    console.error("Could not save uploaded resource metadata.", error);
    return NextResponse.json({ error: "The file could not be saved. Please try again." }, { status: 500 });
  }
}
