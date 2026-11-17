"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type HeaderUser = {
  name: string;
  role: string;
};

const workspaceNavigation = [
  { href: "/dashboard", label: "Overview" },
  { href: "/forum", label: "Forum" },
  { href: "/resources", label: "Resources" },
  { href: "/projects", label: "Projects" },
  { href: "/admin", label: "Administration" },
];

export default function AppHeader({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/session")
      .then(async (response) => {
        if (!response.ok) {
          if (active) {
            setUser(null);
            setSessionLoaded(true);
          }
          return;
        }
        const data = await response.json();
        if (active) {
          setUser(data.user ? { name: data.user.name, role: data.user.role } : null);
          setSessionLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setSessionLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) return;
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/"} aria-label="University of Ibadan Academic Network home" className="shrink-0">
          <Image
            src="/ui-official-logo.jpeg"
            alt="University of Ibadan"
            width={465}
            height={127}
            priority
            className="h-12 w-auto rounded-sm object-contain sm:h-[3.35rem]"
          />
        </Link>

        <nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-0.5 sm:order-none sm:w-auto">
          {user ? (
            <>
              {workspaceNavigation
                .filter((item) => item.href !== "/admin" || user.role === "Faculty" || user.role === "Admin")
                .map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-900"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </>
          ) : (
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                pathname === "/" ? "bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Home
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {sessionLoaded && children}
          {!sessionLoaded ? (
            <span aria-label="Loading account status" className="h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-5 text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                Sign in
              </Link>
              <Link href="/register" className="rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
