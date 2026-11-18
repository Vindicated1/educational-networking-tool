import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { addProjectInterest, createProject, getProjects, projectExists } from "@/lib/db";

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

  const payload: unknown = await request.json().catch(() => ({}));
  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json({ error: "Provide valid project details." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  if (body.projectId === undefined) {
    const title = String(body.title ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const skills = Array.isArray(body.requiredSkills)
      ? body.requiredSkills.map((skill) => String(skill).trim()).filter(Boolean)
      : [];
    const uniqueSkills = [...new Map(skills.map((skill) => [skill.toLowerCase(), skill])).values()];

    if (!title || !summary || uniqueSkills.length === 0) {
      return NextResponse.json({ error: "Title, summary, and at least one required skill are required." }, { status: 400 });
    }
    if (title.length > 120 || summary.length > 2000 || uniqueSkills.length > 10 || uniqueSkills.some((skill) => skill.length > 40)) {
      return NextResponse.json({ error: "Use a title up to 120 characters, a summary up to 2,000 characters, and up to 10 skills of 40 characters each." }, { status: 400 });
    }

    try {
      const project = await createProject({
        title,
        summary,
        required_skills: JSON.stringify(uniqueSkills),
        owner: user.fullName,
      });
      return NextResponse.json({
        project: {
          ...project,
          requiredSkills: uniqueSkills,
        },
      }, { status: 201 });
    } catch (error) {
      console.error("Could not create project.", error);
      return NextResponse.json({ error: "The project could not be saved right now." }, { status: 503 });
    }
  }

  const projectId = Number(body.projectId);
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
