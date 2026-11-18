"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const defaultForm = {
  fullName: "",
  email: "",
  password: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = form.email.trim();

    if (!/(@stu\.ui\.edu\.ng|@dlc\.ui\.edu\.ng|@ui\.edu\.ng)$/i.test(email)) {
      setError("Use an @stu.ui.edu.ng, @dlc.ui.edu.ng, or @ui.edu.ng email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to create your account right now.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-35px_rgba(15,35,65,0.3)]">
        <div className="grid md:grid-cols-2">
          <div className="bg-blue-900 p-8 text-white sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-200">Join the network</p>
            <h1 className="mt-4 text-3xl font-black">Create your campus profile.</h1>
            <p className="mt-4 text-sm leading-7 text-blue-50">
              Register with your university email to unlock course communities, verified peer support, and project opportunities.
            </p>

            <div className="mt-8 grid gap-3 text-sm text-blue-50">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Role-based access for students and faculty</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Restricted to UI email domains</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Secure academic collaboration space</div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Register</h2>
              <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                Home
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Full name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(event) => setForm((previous) => ({ ...previous, fullName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">University email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  minLength={8}
                  required
                  value={form.password}
                  onChange={(event) => setForm((previous) => ({ ...previous, password: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-cyan-500"
                />
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Create account
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
