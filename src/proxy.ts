import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/session-token";

const workspacePaths = ["/dashboard", "/forum", "/resources", "/projects", "/admin"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isWorkspacePage = workspacePaths.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let user;
  if (token) {
    try {
      user = verifyToken(token);
    } catch {
      user = undefined;
    }
  }

  if (isWorkspacePage && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    pathname === "/admin" &&
    user &&
    user.role !== "Faculty" &&
    user.role !== "Admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((pathname === "/login" || pathname === "/register") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/forum/:path*",
    "/resources/:path*",
    "/projects/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
