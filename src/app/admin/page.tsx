"use client";

import { useEffect, useState } from "react";

type ModerationItem = {
  id: number;
  type: string;
  title: string;
  owner: string;
  urgency: string;
  status: string;
};

export default function AdminPage() {
  const [queue, setQueue] = useState<ModerationItem[]>([]);
  const [message, setMessage] = useState("Loading moderation queue...");

  useEffect(() => {
    async function loadQueue() {
      try {
        const response = await fetch("/api/admin");
        const data = await response.json();
        if (!response.ok) {
          setMessage(data.error ?? "Could not load the moderation queue.");
          return;
        }
        setQueue(data.queue);
        setMessage("");
      } catch {
        setMessage("Could not reach the server. Please try again.");
      }
    }

    loadQueue();
  }, []);

  async function handleAction(id: number, nextStatus: string) {
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Could not save this moderation action.");
        return;
      }
      setQueue(data.queue);
      setMessage("Moderation action saved.");
    } catch {
      setMessage("Could not reach the server. The action was not saved.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-800">Administration</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Moderation and governance</h1>
          <p className="mt-2 text-sm text-slate-600">Review flagged activity and support a trusted academic community.</p>
        </div>
        <section className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            ["Pending review", "12"],
            ["Verified faculty", "32"],
            ["Flagged posts", "3"],
            ["Storage health", "98.1%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
              <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-black">Moderation queue</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-900">
                {queue.length} items
              </span>
            </div>

            <div className="space-y-4">
              {queue.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
                        {item.type}
                      </span>
                      <h3 className="mt-2 text-lg font-black">{item.title}</h3>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                      {item.urgency}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                    <span>Owner: {item.owner}</span>
                    <span>Status: {item.status}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, "Approved")}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, "Needs changes")}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Request changes
                    </button>
                  </div>
                </div>
              ))}
              {queue.length === 0 && message && (
                <p role="status" className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{message}</p>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Faculty oversight</p>
              <div className="mt-4 space-y-3">
                {[
                  "9 reports reviewed this week",
                  "4 policy reminders sent",
                  "2 membership appeals pending",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Quick actions</p>
              <div className="mt-4 space-y-2">
                {[
                  "Verify faculty accounts",
                  "Review flagged posts",
                  "Monitor resource uploads",
                ].map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
        {message && queue.length > 0 && <p role="status" className="mt-4 text-sm font-medium text-slate-700">{message}</p>}
      </div>
    </main>
  );
}
