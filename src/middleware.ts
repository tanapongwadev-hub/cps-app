/**
 * Next.js Middleware - Auth Guard
 * 
 * Handles route protection and authentication at the edge.
 * Uses cookie-based auth token for session management.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  "/(auth)/login",
  "/(auth)/forgot-password",
  "/(auth)/reset-password",
  "/(auth)/select-department",
] as const;

// Route prefixes that are always public
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/public",
] as const;

// Auth cookie name
const AUTH_COOKIE_NAME = "cps-auth-token";

/**
 * Check if a path is a public route
 */
function isPublicRoute(pathname: string): boolean {
  // Check exact matches
  if (PUBLIC_ROUTES.includes(pathname as (typeof PUBLIC_ROUTES)[number])) {
    return true;
  }

  // Check prefix matches
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if the auth token is valid
 * In production, you should verify the JWT here
 */
function hasValidToken(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME);
  return !!token?.value;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without auth check
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token
  const isAuthenticated = hasValidToken(request);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL("/(auth)/login", request.url);
    
    // Preserve the original URL for redirect after login
    loginUrl.searchParams.set("redirect", pathname);
    
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated - allow access
  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 * Matches all routes except static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
