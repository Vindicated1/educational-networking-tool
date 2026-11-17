"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("20234567@stu.ui.edu.ng");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validDomain = /(@stu\.ui\.edu\.ng|@dlc\.ui\.edu\.ng|@ui\.edu\.ng)$/i.test(email.trim());
    if (!validDomain) {
      setError("Use a valid University of Ibadan email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Login failed.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Unable to reach the authentication service.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-35px_rgba(15,35,65,0.3)]">
        <div className="grid md:grid-cols-2">
          <div className="bg-[#102b50] p-8 text-white sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">Secure access</p>
            <h1 className="mt-4 text-3xl font-black">Welcome back.</h1>
            <p className="mt-4 text-sm leading-7 text-blue-50">
              Continue to your academic community, resource library, and project boards with your campus account.
            </p>

            <div className="mt-8 space-y-3 text-sm text-blue-50">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Domain-restricted accounts</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Verified faculty moderation</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">Academic project matching</div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">Log in</h2>
              <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                Home
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">University email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-cyan-500"
                  placeholder="name@ui.edu.ng or name@dlc.ui.edu.ng"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-cyan-500"
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Continue to dashboard
              </button>
            </form>

            <p className="mt-6 text-sm text-slate-600">
              New to the platform?{" "}
              <Link href="/register" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
