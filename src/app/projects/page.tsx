"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Project } from "@/lib/mock-data";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [interestedProjectIds, setInterestedProjectIds] = useState<number[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load projects.");
        }
        if (active && Array.isArray(data.projects)) {
          setProjects(
            data.projects.map((project: Record<string, unknown>) => ({
              id: Number(project.id),
              title: String(project.title ?? "Untitled project"),
              summary: String(project.summary ?? ""),
              requiredSkills: Array.isArray(project.requiredSkills)
                ? project.requiredSkills.map(String)
                : [],
              owner: String(project.owner ?? "Student"),
              match: Number(project.match ?? 0),
            })),
          );
        }
      } catch (error) {
        if (active) {
          setProjectsError(error instanceof Error ? error.message : "Could not load projects.");
        }
      } finally {
        if (active) setProjectsLoading(false);
      }
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      [project.title, project.summary, project.owner, ...project.requiredSkills]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [projects, search]);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          requiredSkills: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not post your project.");
        return;
      }

      const project: Project = {
        id: Number(data.project.id),
        title: String(data.project.title),
        summary: String(data.project.summary),
        requiredSkills: data.project.requiredSkills.map(String),
        owner: String(data.project.owner),
        match: Number(data.project.match ?? 0),
      };
      setProjects((previous) => [project, ...previous]);
      setTitle("");
      setSummary("");
      setSkills("");
      setMessage("Your project is live. Interested collaborators can contact you here.");
    } catch {
      setMessage("Could not reach the server. Your project was not saved.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInterest(projectId: number) {
    setMessage("");
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
          <p className="mt-2 text-sm text-slate-600">Share a project, find people with the skills you need, and connect with project owners.</p>
        </div>

        <section aria-labelledby="create-project-heading" className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 id="create-project-heading" className="text-xl font-bold text-slate-950">Post a project</h2>
          <p className="mt-1 text-sm text-slate-600">Describe what you are building and the skills you need. Sign in to publish.</p>
          <form onSubmit={handleCreateProject} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Project title
              <input
                required
                maxLength={120}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Campus events discovery app"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Skills needed
              <input
                required
                value={skills}
                onChange={(event) => setSkills(event.target.value)}
                placeholder="React, UI/UX, research"
                aria-describedby="skills-hint"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
              <span id="skills-hint" className="mt-1 block text-xs font-normal text-slate-500">Separate skills with commas (up to 10).</span>
            </label>
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Project summary
              <textarea
                required
                maxLength={2000}
                rows={3}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="What are you building, and how can collaborators contribute?"
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? "Publishing..." : "Publish project"}
              </button>
            </div>
          </form>
        </section>

        <section aria-labelledby="browse-projects-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="browse-projects-heading" className="text-xl font-bold text-slate-950">Projects looking for collaborators</h2>
              <p className="mt-1 text-sm text-slate-600">Search by project, owner, or skill and express interest to connect.</p>
            </div>
            <label className="w-full text-sm font-semibold text-slate-700 sm:max-w-xs">
              Search projects
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try a skill or project name"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          {projectsLoading ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">Loading projects...</p>
          ) : projectsError ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{projectsError}</p>
          ) : filteredProjects.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              {projects.length === 0 ? "No projects have been posted yet. Be the first to share one." : "No projects match your search."}
            </p>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <article key={project.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">Project</p>
                    <h3 className="mt-2 text-xl font-black">{project.title}</h3>
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-7 text-slate-700">{project.summary}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.requiredSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                    <span className="text-sm text-slate-500">Owner: {project.owner}</span>
                    <button
                      type="button"
                      onClick={() => handleInterest(project.id)}
                      disabled={interestedProjectIds.includes(project.id)}
                      className="shrink-0 rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:cursor-default disabled:bg-emerald-700"
                    >
                      {interestedProjectIds.includes(project.id) ? "Interest sent" : "Express interest"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {message && <p role="status" aria-live="polite" className="mt-5 rounded-xl bg-white p-3 text-sm font-medium text-slate-700">{message}</p>}
      </div>
    </main>
  );
}
