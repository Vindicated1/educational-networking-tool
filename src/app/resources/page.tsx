"use client";

import { FormEvent, useEffect, useState } from "react";
import { courseOptions, defaultCourse } from "@/lib/courses";
import { defaultResources, type Resource } from "@/lib/mock-data";

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>(defaultResources);
  const [selectedCourse, setSelectedCourse] = useState<string>(defaultCourse);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadResources() {
      try {
        const response = await fetch("/api/resources");
        const data = await response.json();
        if (Array.isArray(data.resources)) {
          setResources(
            data.resources.map((resource: Record<string, unknown>) => ({
              id: Number(resource.id ?? Date.now()),
              title: String(resource.title ?? "Untitled resource"),
              course: String(resource.course ?? defaultCourse),
              session: String(resource.session ?? "2026/2027"),
              format: String(resource.format ?? "PDF") as "PDF" | "DOCX",
              size: String(resource.size ?? "1.0 MB"),
              uploadedBy: String(resource.uploaded_by ?? "Student"),
              fileName: resource.file_name ? String(resource.file_name) : undefined,
            })),
          );
        }
      } catch {
        // fallback to mock data
      }
    }

    loadResources();
  }, []);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") || "").trim();
    const file = form.get("file") as File | null;

    if (!title || !file) {
      setMessage("Enter a title and select a file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Files must be 10 MB or smaller.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || (extension !== "pdf" && extension !== "docx")) {
      setMessage("Only PDF or DOCX files are accepted.");
      return;
    }

    try {
      form.set("course", selectedCourse);
      const response = await fetch("/api/resources", {
        method: "POST",
        body: form,
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Upload failed.");
        return;
      }

      setResources((previous) => [
        {
          id: Number(data.resource.id),
          title: data.resource.title,
          course: data.resource.course,
          session: data.resource.session,
          format: data.resource.format,
          size: data.resource.size,
          uploadedBy: data.resource.uploaded_by,
          fileName: data.resource.file_name,
        },
        ...previous,
      ]);
      formElement.reset();
      setMessage("Resource uploaded successfully.");
    } catch {
      setMessage("Could not reach the server. Your file was not uploaded.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Resource library</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Course materials and shared resources</h1>
          <p className="mt-2 text-sm text-slate-600">Find useful materials or share something with your academic community.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black">Upload a study resource</h2>
            <form onSubmit={handleUpload} className="mt-4 space-y-4">
              <select
                name="course"
                value={selectedCourse}
                onChange={(event) => setSelectedCourse(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-700"
              >
                {courseOptions.map((course) => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
              <input
                name="title"
                type="text"
                placeholder="Resource title"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-700"
              />
              <input
                name="file"
                type="file"
                accept=".pdf,.docx"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blue-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
              <button type="submit" className="w-full rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
                Upload resource
              </button>
              <p className="text-xs text-slate-500">PDF or DOCX, up to 10 MB. Sign in to upload.</p>
              {message && <p role="status" className="text-sm font-medium text-blue-800">{message}</p>}
            </form>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <article key={resource.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">{resource.format}</p>
                    <h3 className="mt-2 text-lg font-black">{resource.title}</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                    {resource.course}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                  <span>{resource.session}</span>
                  <span>{resource.size}</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-sm text-slate-500">By {resource.uploadedBy}</span>
                  {resource.fileName ? (
                    <a href={`/api/resources/${resource.id}/download`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                      Download
                    </a>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-500">
                      Sample item
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
