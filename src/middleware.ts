/**
 * Next.js Middleware — Auth Guard
 *
 * First-pass, edge-level gate. It only checks for the presence of the
 * `cps_has_session` cookie set by `stores/auth-store.ts` on login/logout —
 * it does NOT decode or verify a token (the cookie never carries one).
 *
 * This is deliberately a UX/defense-in-depth layer, not the trust boundary:
 *  - The backend re-validates the real bearer token on every API call.
 *  - `AdminShell` (client-side) still redirects to /login if the persisted
 *    session turns out to be invalid/expired once JS loads.
 *
 * Without this middleware, an unauthenticated request could still render the
 * (admin) route's HTML shell before client JS redirects it away. This closes
 * that gap for the common case.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "cps_has_session";

// Routes that must be reachable without a session.
const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/select-department",
  "/403",
  "/404",
  "/500",
  "/unauthorized",
  "/session-expired",
  "/maintenance",
  "/coming-soon",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 * Matches all routes except static files and Next.js internals
 */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
