"use client";

import { useEffect, useState } from "react";
import { calculateMatchScore, defaultProjects, type Project } from "@/lib/mock-data";

const userSkills = ["Python", "UI/UX", "Research", "Next.js"];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [message, setMessage] = useState("");
  const [interestedProjectIds, setInterestedProjectIds] = useState<number[]>([]);

  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        if (Array.isArray(data.projects)) {
          setProjects(
            data.projects.map((project: Record<string, unknown>) => ({
              id: Number(project.id ?? Date.now()),
              title: String(project.title ?? "Untitled project"),
              summary: String(project.summary ?? ""),
              requiredSkills: Array.isArray(project.requiredSkills)
                ? project.requiredSkills.map(String)
                : JSON.parse(String(project.required_skills ?? "[]")),
              owner: String(project.owner ?? "Student"),
              match: Number(project.match ?? 0),
            })),
          );
        }
      } catch {
        // fallback to mock data
      }
    }

    loadProjects();
  }, []);

  async function handleInterest(projectId: number) {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not register your interest.");
        return;
      }

      setInterestedProjectIds((previous) => previous.includes(projectId) ? previous : [...previous, projectId]);
      setMessage("Your interest has been sent to the project owner.");
    } catch {
      setMessage("Could not reach the server. Your interest was not saved.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-0 py-0 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Project board</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Find your next collaborator</h1>
          <p className="mt-2 text-sm text-slate-600">Explore student-led projects and connect around shared skills and interests.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const match = calculateMatchScore(userSkills, project.requiredSkills);

            return (
              <article key={project.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">Project</p>
                    <h2 className="mt-2 text-xl font-black">{project.title}</h2>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-900">
                    {match}%
                  </span>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-700">{project.summary}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {project.requiredSkills.map((skill) => (
                    <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm text-slate-500">Owner: {project.owner}</span>
                  <button
                    type="button"
                    onClick={() => handleInterest(project.id)}
                    disabled={interestedProjectIds.includes(project.id)}
                    className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-default disabled:bg-emerald-700"
                  >
                    {interestedProjectIds.includes(project.id) ? "Interest sent" : "Express interest"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {message && <p role="status" className="mt-5 rounded-xl bg-white p-3 text-sm font-medium text-slate-700">{message}</p>}
      </div>
    </main>
  );
}
