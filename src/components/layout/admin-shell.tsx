"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useAuthMe } from "@/features/auth/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { useRecentPaths } from "@/hooks/use-recent-paths";
import { cn } from "@/utils/cn";
import { isMockMode } from "@/config/env";

interface AdminShellProps {
  children: React.ReactNode;
  /** When true, skips auth check (for public demo routes) */
  noAuthCheck?: boolean;
}

export function AdminShell({ children, noAuthCheck }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const accessControl = useAuthStore((s) => s.accessControl);
  const needsDepartmentSelection = useAuthStore((s) => s.needsDepartmentSelection);
  const setSession = useAuthStore((s) => s.setSession);
  const [hydrated, setHydrated] = React.useState(false);

  // Track visited paths → drives the sidebar's "RECENT" section.
  useRecentPaths();

  // โหลด accessControl (menus + permissions) จาก /auth/me เมื่อ authenticated
  // (must subscribe to accessToken reactively so the query runs after localStorage
  // hydration finishes populating the token)
  const { data: meData, isLoading: meLoading } = useAuthMe(
    isAuthenticated && hasToken && !needsDepartmentSelection,
  );

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  // Sync accessControl จาก /auth/me เข้า store
  // Sync เมื่อ:
  //   - ยังไม่มี accessControl (first load หรือ seeded-only session) → ต้อง hydrate
  //   - มี assignment เปลี่ยน (currentUdrId !== nextUdrId)
  // สำคัญ: superadmin ไม่มี userDepartmentRoleId (ทั้งสองข้างเป็น null)
  //   ดังนั้นต้องเช็ค accessControl เป็นหลัก ไม่ใช้แค่ !== เพราะ null !== null = false
  React.useEffect(() => {
    if (!meData) return;
    const currentUdrId = accessControl?.userDepartmentRoleId ?? null;
    const nextUdrId = meData.accessControl.userDepartmentRoleId ?? null;
    const needsSync = !accessControl || currentUdrId !== nextUdrId;
    if (!needsSync) return;
    const existing = useAuthStore.getState();
    setSession({
      user: meData.user,
      currentDepartmentRole: meData.currentDepartmentRole,
      accessControl: meData.accessControl,
      accessToken: existing.accessToken ?? "",
      refreshToken: existing.refreshToken ?? "",
      expiresAt: existing.expiresAt ?? Date.now() + 3600 * 1000,
    });
  }, [meData, accessControl, setSession]);

  // Route guard
  React.useEffect(() => {
    if (!hydrated || noAuthCheck) return;
    if (!isAuthenticated) {
      // If the user was previously logged in (now expired), send them to
      // /session-expired so the page can show a friendly message + login CTA.
      // Otherwise treat it as a fresh login.
      const wasLoggedIn = !!useAuthStore.getState().user;
      const search = new URLSearchParams({ redirect: pathname }).toString();
      router.replace(wasLoggedIn ? `/session-expired?${search}` : `/login?${search}`);
      return;
    }
    // Post-login gate: if the user has more than one department and hasn't
    // picked one yet, force them to /select-department.
    if (needsDepartmentSelection && pathname !== "/select-department") {
      router.replace("/select-department");
    }
  }, [hydrated, isAuthenticated, noAuthCheck, pathname, router, needsDepartmentSelection]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!noAuthCheck && !isAuthenticated) {
    return null;
  }

  // Gate the entire admin shell until the user has chosen a (dept, role)
  // context. The /select-department page is rendered separately by the
  // auth layout, so this is purely a UI gate for the protected routes.
  if (!noAuthCheck && needsDepartmentSelection && pathname !== "/select-department") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">กำลังเปลี่ยนเส้นทางไปเลือกแผนก...</p>
        </div>
      </div>
    );
  }

  // ถ้ายังโหลด accessControl ไม่เสร็จ (เฉพาะตอน authenticated)
  if (isAuthenticated && meLoading && !accessControl) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="h-6 w-6 mx-auto animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูลสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen gap-2 overflow-hidden bg-slate-100 p-2 sm:gap-3 sm:p-3 md:gap-4 md:p-4 dark:bg-slate-900">
      <Sidebar />
      <div
        className={cn(
          "flex h-full flex-1 flex-col gap-3 sm:gap-4 md:gap-5 transition-[padding] duration-300",
        )}
      >
        <TopNav />
        <main className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-background shadow-sm">
          <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {children}
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

// Helper for non-mock mode
void isMockMode;
