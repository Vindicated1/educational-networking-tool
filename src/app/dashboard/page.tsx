"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { courseOptions, defaultCourse } from "@/lib/courses";
import { adminAlerts, defaultResources, defaultThreads, type Resource, type Role, type Thread } from "@/lib/mock-data";

type CurrentUser = { name: string; email: string; role: Role };

export default function DashboardPage() {
  const [threads, setThreads] = useState<Thread[]>(defaultThreads);
  const [resources, setResources] = useState<Resource[]>(defaultResources);
  const [selectedCourse, setSelectedCourse] = useState<string>(defaultCourse);
  const [registerMessage, setRegisterMessage] = useState("Viewing public demo data. Log in to make changes.");
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [threadDraft, setThreadDraft] = useState<{
    title: string;
    body: string;
    course: string;
    category: "Discussion" | "Question";
  }>({
    title: "",
    body: "",
    course: defaultCourse,
    category: "Question" as "Discussion" | "Question",
  });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const sessionResponse = await fetch("/api/session");
        const sessionData = await sessionResponse.json();
        if (sessionData.user) {
          setCurrentUser({
            name: sessionData.user.name,
            email: sessionData.user.email,
            role: sessionData.user.role,
          });
          setRegisterMessage(`Signed in as ${sessionData.user.name}.`);
        }
      } catch {
        // ignore session issues and continue with seeded demo data
      }

      try {
        const threadResponse = await fetch("/api/threads");
        const threadData = await threadResponse.json();
        if (Array.isArray(threadData.threads)) {
          setThreads(threadData.threads);
        }
      } catch {
        // ignore thread fetch issues and continue with fallback data
      }

      try {
        const resourceResponse = await fetch("/api/resources");
        const resourceData = await resourceResponse.json();
        if (Array.isArray(resourceData.resources)) {
          setResources(
            resourceData.resources.map((resource: Record<string, unknown>) => ({
              id: Number(resource.id ?? Date.now()),
              title: String(resource.title ?? "Untitled"),
              course: String(resource.course ?? defaultCourse),
              session: String(resource.session ?? "2026/2027"),
              format: (String(resource.format ?? "PDF") as "PDF" | "DOCX"),
              size: String(resource.size ?? "1.0 MB"),
              uploadedBy: String(resource.uploaded_by ?? "Student"),
              fileName: resource.file_name ? String(resource.file_name) : undefined,
            })),
          );
        }
      } catch {
        // ignore resource fetch issues and continue with fallback data
      }
    }

    loadSession();
  }, []);

  const visibleThreads = useMemo(
    () =>
      threads.filter((thread) =>
        selectedCourse === "All Courses" ? true : thread.course === selectedCourse || thread.course === "General",
      ),
    [selectedCourse, threads],
  );
  const verifiedAnswerCount = threads.reduce(
    (total, thread) => total + thread.comments.filter((comment) => comment.verified).length,
    0,
  );

  async function updateThread(threadId: number, action: string, payload: Record<string, unknown> = {}) {
    try {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRegisterMessage(data.error ?? "Thread action failed.");
        return false;
      }

      setThreads((previous) =>
        previous.map((thread) => thread.id === threadId ? data.thread : thread),
      );
      return true;
    } catch {
      setRegisterMessage("Could not reach the server. Your change was not saved.");
      return false;
    }
  }

  function handleUpvote(threadId: number) {
    void updateThread(threadId, "upvote");
  }

  function handleVerify(threadId: number, commentId: number) {
    void updateThread(threadId, "verify", { commentId });
  }

  async function handleReply(threadId: number) {
    const body = (replyDrafts[threadId] ?? "").trim();
    if (!body) return;

    if (await updateThread(threadId, "reply", { body })) {
      setReplyDrafts((previous) => ({ ...previous, [threadId]: "" }));
    }
  }

  async function handleCreateThread(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = threadDraft.title.trim();
    const body = threadDraft.body.trim();

    if (!title || !body) {
      setRegisterMessage("Please provide both a title and a message.");
      return;
    }

    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          course: threadDraft.course,
          category: threadDraft.category,
          body,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setRegisterMessage(data.error ?? "Thread creation failed.");
        return;
      }

      setThreads((previous) => [data.thread, ...previous]);
      setThreadDraft({ title: "", body: "", course: threadDraft.course, category: "Question" });
      setSelectedCourse(threadDraft.course);
      setRegisterMessage("Thread created successfully.");
    } catch {
      setRegisterMessage("Could not reach the server. Your thread was not published.");
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") || "").trim();
    const file = form.get("file") as File | null;

    if (!title || !file) {
      setRegisterMessage("Please add a title and file before uploading.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || (extension !== "pdf" && extension !== "docx")) {
      setRegisterMessage("Only PDF or DOCX files are accepted.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setRegisterMessage("Files must be 10 MB or smaller.");
      return;
    }

    try {
      form.set("course", selectedCourse === "All Courses" ? defaultCourse : selectedCourse);
      const response = await fetch("/api/resources", { method: "POST", body: form });

      const data = await response.json();
      if (!response.ok) {
        setRegisterMessage(data.error ?? "Upload failed.");
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

      setRegisterMessage(`Resource uploaded: ${title}`);
      formElement.reset();
    } catch {
      setRegisterMessage("Could not reach the server. Your file was not uploaded.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <section className="space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-[#102b50] p-7 text-white shadow-lg shadow-blue-950/10 sm:p-9">
            <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border-[28px] border-white/5" />
            <p className="relative text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Academic collaboration hub</p>
            <h2 className="relative mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
              A stronger academic community starts here.
            </h2>
            <p className="relative mt-3 max-w-xl text-sm leading-6 text-blue-100">Ask questions, share what you know, and discover new ways to collaborate.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Verified answers", value: verifiedAnswerCount },
              { label: "Course conversations", value: threads.length },
              { label: "Shared resources", value: resources.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-semibold text-slate-950">{stat.value}</div>
                <div className="mt-1 text-sm text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
                <h3 className="text-xl font-semibold text-slate-950">Academic community hub</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {(["All Courses", ...courseOptions, "General"] as const).map((course) => (
                  <button
                    key={course}
                    type="button"
                    onClick={() => setSelectedCourse(course)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                      selectedCourse === course ? "bg-blue-50 text-blue-900" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {course}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <form onSubmit={handleCreateThread} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-lg font-bold">Start a thread</h4>
                  <select
                    value={threadDraft.course}
                    onChange={(event) => setThreadDraft((previous) => ({ ...previous, course: event.target.value }))}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    {([...courseOptions, "General"] as const).map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
                  <input
                    type="text"
                    value={threadDraft.title}
                    onChange={(event) => setThreadDraft((previous) => ({ ...previous, title: event.target.value }))}
                    placeholder="Thread title"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-700"
                  />
                  <select
                    value={threadDraft.category}
                    onChange={(event) =>
                      setThreadDraft((previous) => ({
                        ...previous,
                        category: event.target.value as "Discussion" | "Question",
                      }))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-700"
                  >
                    <option value="Question">Question</option>
                    <option value="Discussion">Discussion</option>
                  </select>
                </div>

                <textarea
                  value={threadDraft.body}
                  onChange={(event) => setThreadDraft((previous) => ({ ...previous, body: event.target.value }))}
                  placeholder="What do you need help with?"
                  className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-700"
                />

                <div className="mt-3 flex justify-end">
                  <button type="submit" className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800">
                    Publish thread
                  </button>
                </div>
              </form>

              {visibleThreads.map((thread) => (
                <article key={thread.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">
                        {thread.category}
                      </span>
                      <h4 className="mt-3 text-xl font-bold">{thread.title}</h4>
                      <p className="mt-2 text-sm text-slate-600">{thread.course}</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                      <span>▲</span>
                      <span>{thread.votes}</span>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-700">{thread.body}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="text-sm font-medium text-slate-500">Posted by {thread.author}</span>
                    <button
                      type="button"
                      onClick={() => handleUpvote(thread.id)}
                      className="rounded-lg bg-blue-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                    >
                      Upvote
                    </button>
                  </div>

                  <div className="mt-5 space-y-3 rounded-xl bg-white p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Replies</p>
                    {thread.comments.map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                        {((currentUser?.role === "Faculty" || currentUser?.role === "Admin") && !comment.verified) && (
                          <button
                            type="button"
                            onClick={() => handleVerify(thread.id, comment.id)}
                            className="mt-3 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark as verified answer
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={replyDrafts[thread.id] ?? ""}
                      onChange={(event) =>
                        setReplyDrafts((previous) => ({ ...previous, [thread.id]: event.target.value }))
                      }
                      placeholder="Write a reply"
                      className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => handleReply(thread.id)}
                      className="rounded-full bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                      Reply
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Profile</p>
            <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
              {currentUser ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300">{currentUser.role}</p>
                      <h4 className="mt-1 text-lg font-bold">{currentUser.name}</h4>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-lg font-black text-slate-950">
                      {currentUser.name.slice(0, 1).toUpperCase()}
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-300">{currentUser.email}</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-300">You are viewing the public demo. Sign in to post, reply, vote, or upload resources.</p>
                  <Link href="/login" className="mt-3 inline-block rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-slate-950">
                    Log in
                  </Link>
                </>
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-blue-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">Project fit</p>
              <div className="mt-3 flex items-end justify-between">
                <span className="text-3xl font-black text-blue-950">92%</span>
                <span className="text-sm text-blue-800">Match score</span>
              </div>
              <p className="mt-2 text-sm text-blue-900">
                Strong overlap with research, UI/UX, and Python skills.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Quick actions</p>
            <div className="mt-4 space-y-3">
              <form onSubmit={handleUpload} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  name="title"
                  type="text"
                  placeholder="Resource title"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-700"
                />
                <input
                  name="file"
                  type="file"
                  accept=".pdf,.docx"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blue-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                />
                <button type="submit" className="mt-3 w-full rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                  Upload resource
                </button>
              </form>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Status</p>
            <div className="mt-4 space-y-3">
              {adminAlerts.map((alert) => (
                <div key={alert} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  {alert}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Recent uploads</p>
              <div className="mt-2 space-y-2">
                {resources.slice(0, 3).map((resource) => (
                  <div key={resource.id} className="text-sm text-slate-700">• {resource.title}</div>
                ))}
              </div>
            </div>
            {registerMessage && <p className="mt-4 text-sm font-medium text-emerald-700">{registerMessage}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
