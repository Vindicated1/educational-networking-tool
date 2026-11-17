"use client";

import { useEffect, useState } from "react";
import { courseOptions, defaultCourse } from "@/lib/courses";
import { adminAlerts, defaultThreads, type Thread } from "@/lib/mock-data";

export default function ForumPage() {
  const [threads, setThreads] = useState<Thread[]>(defaultThreads);
  const [draft, setDraft] = useState<{ title: string; body: string; course: string }>({
    title: "",
    body: "",
    course: defaultCourse,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadThreads() {
      try {
        const response = await fetch("/api/threads");
        const data = await response.json();
        if (Array.isArray(data.threads)) {
          setThreads(data.threads);
        }
      } catch {
        setMessage("Could not load forum data. Please refresh to try again.");
      }
    }

    loadThreads();
  }, []);

  async function handleCreateThread() {
    if (!draft.title.trim() || !draft.body.trim()) {
      setMessage("Enter a title and message before publishing.");
      return;
    }

    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title.trim(),
          body: draft.body.trim(),
          course: draft.course,
          category: "Question",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Thread could not be published.");
        return;
      }

      setThreads((previous) => [data.thread, ...previous]);
      setMessage("Thread published.");
    } catch {
      setMessage("Could not reach the server. Your thread was not published.");
    }

    setDraft({ title: "", body: "", course: draft.course });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Course forum</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Academic discussion board</h1>
          <p className="mt-2 text-sm text-slate-600">Share questions and insights with your course community.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-black">Start a topic</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => setDraft((previous) => ({ ...previous, title: event.target.value }))}
                  placeholder="Question title"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-700"
                />
                <select
                  value={draft.course}
                  onChange={(event) => setDraft((previous) => ({ ...previous, course: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-700"
                >
                  {courseOptions.map((course) => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                  <option value="General">General</option>
                </select>
              </div>
              <textarea
                value={draft.body}
                onChange={(event) => setDraft((previous) => ({ ...previous, body: event.target.value }))}
                placeholder="Describe the issue or ask for advice..."
                className="mt-3 min-h-28 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-700"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateThread}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Publish thread
                </button>
              </div>
              {message && <p role="status" className="mt-3 text-sm font-medium text-blue-800">{message}</p>}
            </div>

            {threads.map((thread) => (
              <article key={thread.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">
                      {thread.category}
                    </span>
                    <h3 className="mt-3 text-xl font-black">{thread.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{thread.course}</p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700">
                    ▲ {thread.votes}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-700">{thread.body}</p>

                <div className="mt-5 space-y-3">
                  {thread.comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="font-semibold text-slate-800">{comment.author}</span>
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{comment.role}</span>
                        </div>
                        {comment.verified && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{comment.body}</p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Platform status</p>
              <div className="mt-4 space-y-3">
                {adminAlerts.map((alert) => (
                  <div key={alert} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
