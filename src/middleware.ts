/**
 * Next.js Middleware - Auth Guard
 * 
 * TEMPORARILY DISABLED FOR DEBUGGING
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TEMPORARILY DISABLED - Allow all routes
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

/**
 * Configure which routes the middleware runs on
 * Matches all routes except static files and Next.js internals
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
