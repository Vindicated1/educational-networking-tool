import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { addProjectInterest, getProjects, projectExists } from "@/lib/db";

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json({ projects: projects.map((project) => ({
      ...project,
      requiredSkills: JSON.parse(project.required_skills || "[]"),
    })) });
  } catch (error) {
    console.error("Could not load projects.", error);
    return NextResponse.json({ error: "Project data is temporarily unavailable." }, { status: 503 });
  }
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

  try {
    if (!(await projectExists(projectId))) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    await addProjectInterest(projectId, user.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Could not save project interest.", error);
    return NextResponse.json({ error: "Project interest is temporarily unavailable." }, { status: 503 });
  }
}
