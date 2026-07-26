/**
 * useRecentPaths — auto-record the current pathname into the sidebar's
 * recents list. Mount this once near the top of the admin layout.
 *
 * Behaviour:
 *   - On every pathname change, calls `recordVisit(pathname)` from the sidebar
 *     store. The store handles dedup + length capping.
 *   - Skips "/" and paths that start with "_next" (Next.js internals).
 *   - Runs on the client only (no-op on SSR).
 */
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/stores/sidebar-store";

export function useRecentPaths(): void {
  const pathname = usePathname();
  const recordVisit = useSidebarStore((s) => s.recordVisit);

  useEffect(() => {
    if (!pathname || pathname === "/") return;
    if (pathname.startsWith("/_next")) return;
    recordVisit(pathname);
  }, [pathname, recordVisit]);
}
