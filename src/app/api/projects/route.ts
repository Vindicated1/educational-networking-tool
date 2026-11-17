import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { db, getProjects } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ projects: getProjects().map((project) => ({
    ...project,
    requiredSkills: JSON.parse(project.required_skills || "[]"),
  })) });
}

export async function POST(request: Request) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Please log in to express project interest." }, { status: 401 });
  }

  let user;
  try {
    user = verifyToken(token);
  } catch {
    return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const projectId = Number(payload.projectId);
  if (!Number.isInteger(projectId) || projectId < 1) {
    return NextResponse.json({ error: "Select a valid project." }, { status: 400 });
  }

  const projectExists = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId);
  if (!projectExists) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  db.prepare("INSERT OR IGNORE INTO project_interests (project_id, user_id) VALUES (?, ?)").run(projectId, user.userId);
  return NextResponse.json({ success: true });
}
