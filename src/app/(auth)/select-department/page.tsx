"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Shield, Check, Star, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useSelectDepartment, useSwitchDepartment } from "@/features/auth/hooks/use-auth";
import { useUserAssignments } from "@/features/users/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/utils/cn";
import type { DepartmentRoleOption, UserAssignment } from "@/features/auth/types";

/**
 * Two flows land on this page:
 *
 *   1) `mode: "select"` — Spec 2-step login (mock-only). Backend returned a
 *      `departmentSelectionToken`; we POST `/auth/select-department` with
 *      the chosen `userDepartmentRoleId` to receive the real session.
 *
 *   2) `mode: "switch"` — Real 1-step login where the user has >1
 *      department. We already have a valid session; we fetch
 *      `/users/:userId/assignments` and POST `/auth/switch-department`
 *      with the chosen `userDepartmentRoleId` to update the active
 *      (department, role) context.
 */
function SelectDepartmentContent() {
  const router = useRouter();
  const pendingSelection = useAuthStore((s) => s.pendingSelection);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const setPendingSelection = useAuthStore((s) => s.setPendingSelection);
  const selectDepartment = useSelectDepartment();
  const switchDepartment = useSwitchDepartment();
  const [selected, setSelected] = React.useState<string | null>(null);

  // ---- Data loading ----
  // For the "switch" flow we need the user's assignments to render options.
  // For the "select" flow the options are already in pendingSelection.
  const userId = pendingSelection?.user?.id;
  const assignmentsQuery = useUserAssignments(
    pendingSelection?.mode === "switch" && userId ? userId : null,
  );

  // Derive the options for whichever flow we're in.
  const options: DepartmentRoleOption[] = React.useMemo(() => {
    if (!pendingSelection) return [];
    if (pendingSelection.mode === "select") {
      return pendingSelection.options ?? [];
    }
    // mode === "switch" — convert UserAssignment[] into DepartmentRoleOption[]
    return (assignmentsQuery.data ?? [])
      .filter(
        (
          assignment,
        ): assignment is UserAssignment & { departmentId: string } =>
          assignment.departmentId !== null,
      )
      .map((a) => ({
        userDepartmentRoleId: a.id,
        department: {
          id: a.department?.id ?? a.departmentId,
          code: a.department?.code ?? "",
          name:
            a.department?.nameTh ??
            a.department?.nameEn ??
            a.department?.name ??
            a.departmentId,
        },
        role: {
          id: a.role?.id ?? a.roleId,
          code: a.role?.code ?? "",
          name:
            a.role?.nameTh ??
            a.role?.nameEn ??
            a.role?.name ??
            a.roleId,
        },
        isPrimary: false,
      }));
  }, [pendingSelection, assignmentsQuery.data]);

  // Safe access to user — may be undefined in the real 2-step flow
  const safeUser = pendingSelection?.user;

  const loadingOptions =
    pendingSelection?.mode === "switch" && assignmentsQuery.isLoading;

  // Redirect to /login if no pending selection and not authenticated
  React.useEffect(() => {
    if (!pendingSelection) {
      // If user is already authenticated and doesn't need to pick a dept
      // (e.g. they refreshed the page), send them home.
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
      return;
    }
    // Pre-select the first option once we have it
    if (options.length > 0 && !selected) {
      // Prefer the option that's marked primary; otherwise the first one.
      const primary = options.find((o) => o.isPrimary);
      setSelected(primary?.userDepartmentRoleId ?? options[0]?.userDepartmentRoleId ?? null);
    }
  }, [pendingSelection, options, selected, isAuthenticated, router]);

  if (!pendingSelection) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const handleSelect = () => {
    if (!selected) {
      showToast.warning("กรุณาเลือกแผนก/บทบาท");
      return;
    }
    if (pendingSelection.mode === "select") {
      // 2-step flow: send the temp token + chosen assignment
      selectDepartment.mutate({
        departmentSelectionToken: pendingSelection.departmentSelectionToken ?? "",
        userDepartmentRoleId: selected,
      });
    } else {
      // 1-step post-login flow: we already have a session; just switch
      switchDepartment.mutate({ userDepartmentRoleId: selected });
    }
  };

  const handleLogout = () => {
    logout();
    setPendingSelection(null);
    router.push("/login");
  };

  const isPending = selectDepartment.isPending || switchDepartment.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-2xl space-y-6">
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLogout();
          }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          กลับไปเข้าสู่ระบบใหม่
        </Link>

        <div className="space-y-2 text-center">
          <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-base font-bold">A</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">เลือกแผนกและบทบาท</h1>
          <p className="text-sm text-muted-foreground">
            คุณมีหลายแผนก/บทบาทในระบบ กรุณาเลือกแผนกที่ต้องการเข้าใช้งาน
          </p>
        </div>

        <div className="rounded-md border bg-card p-3 text-sm">
          <p className="text-muted-foreground">เข้าสู่ระบบในชื่อ</p>
          {safeUser ? (
            <>
              <p className="font-medium">
                {safeUser.firstName} {safeUser.lastName}
              </p>
              <p className="text-xs text-muted-foreground">
                {safeUser.email}
              </p>
              {safeUser.departments && safeUser.departments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground">แผนกทั้งหมด:</span>
                  {safeUser.departments.map((d) => (
                    <Badge key={d.id} variant="outline" className="text-[10px]">
                      {d.name}
                    </Badge>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              (ไม่มีข้อมูลผู้ใช้ — กรุณาเลือกแผนก/บทบาทด้านล่าง)
            </p>
          )}
        </div>

        {loadingOptions ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-md border bg-muted/30 animate-pulse"
              />
            ))}
          </div>
        ) : options.length === 0 ? (
          <div className="rounded-md border bg-danger/5 p-4 text-sm text-danger">
            ไม่พบแผนก/บทบาทที่ผูกกับบัญชีนี้ — กรุณาติดต่อผู้ดูแลระบบ
          </div>
        ) : (
          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = selected === opt.userDepartmentRoleId;
              return (
                <Card
                  key={opt.userDepartmentRoleId}
                  className={cn(
                    "p-4 cursor-pointer transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "hover:border-primary/50",
                  )}
                  onClick={() => setSelected(opt.userDepartmentRoleId)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">
                            {opt.department.nameTh ?? opt.department.nameEn ?? opt.department.code}
                          </p>
                          {opt.isPrimary && (
                            <Badge variant="info" className="gap-1 text-[10px]">
                              <Star className="h-2.5 w-2.5" />
                              หลัก
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {opt.department.code} · {opt.role.name}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">บทบาท:</span>
                    <Badge variant="outline" className="text-[10px]">
                      {opt.role.code}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
          <Button
            onClick={handleSelect}
            loading={isPending}
            disabled={!selected || options.length === 0}
          >
            เข้าสู่ระบบด้วยบทบาทนี้
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SelectDepartmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <SelectDepartmentContent />
    </Suspense>
  );
}
