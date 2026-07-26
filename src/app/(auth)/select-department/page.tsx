"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Shield, Check, Star, LogOut } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useSelectDepartment } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";
import { Spinner } from "@/components/ui/spinner";

function SelectDepartmentContent() {
  const router = useRouter();
  const pendingSelection = useAuthStore((s) => s.pendingSelection);
  const logout = useAuthStore((s) => s.logout);
  const setPendingSelection = useAuthStore((s) => s.setPendingSelection);
  const selectDepartment = useSelectDepartment();
  const [selected, setSelected] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pendingSelection) {
      router.replace("/login");
    } else {
      // Pre-select primary
      const primary = pendingSelection.options.find((o) => o.isPrimary);
      if (primary) setSelected(primary.userDepartmentRoleId);
    }
  }, [pendingSelection, router]);

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
    selectDepartment.mutate({
      departmentSelectionToken: pendingSelection.departmentSelectionToken,
      userDepartmentRoleId: selected,
    });
  };

  const handleLogout = () => {
    logout();
    setPendingSelection(null);
    router.push("/login");
  };

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
          <p className="font-medium">{pendingSelection.user.fullName}</p>
          <p className="text-xs text-muted-foreground">{pendingSelection.user.email}</p>
        </div>

        <div className="space-y-2">
          {pendingSelection.options.map((opt) => {
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
                        <p className="font-medium truncate">{opt.department.name}</p>
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

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
          <Button onClick={handleSelect} loading={selectDepartment.isPending} disabled={!selected}>
            เข้าสู่ระบบด้วยบทบาทนี้
          </Button>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function SelectDepartmentPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner size="xl" /></div>}>
      <SelectDepartmentContent />
    </Suspense>
  );
}
