"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import type { UserAccessMenuItem, UserAssignmentAccess } from "../api/users-api";
import { useUserAccessSummary } from "../hooks/use-users";

const MAX_TIMEOUT_DELAY_MS = 2_147_483_647;

export function UserMenuAccess({ userId }: { userId: string }) {
  const { data, isLoading, isError, refetch } = useUserAccessSummary(userId);

  if (isLoading) return <MenuAccessSkeleton />;
  if (isError) return <MenuAccessError onRetry={() => void refetch()} />;
  if (!data?.assignments.length) return <MenuAccessEmpty />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        อ้างอิงจาก Assignment ที่บันทึกไว้ล่าสุด
      </p>
      {data.assignments.map((assignment) => (
        <AssignmentAccessCard key={assignment.assignmentId} assignment={assignment} />
      ))}
    </div>
  );
}

function MenuAccessSkeleton() {
  return (
    <div className="space-y-3" data-testid="menu-access-skeleton">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function MenuAccessError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert variant="danger" className="flex items-center justify-between gap-3">
      <AlertDescription>ไม่สามารถโหลดเมนูที่เข้าถึงได้</AlertDescription>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        ลองใหม่
      </Button>
    </Alert>
  );
}

function MenuAccessEmpty() {
  return (
    <Alert variant="info">
      <AlertDescription>ไม่มี Assignment ที่ยังบันทึกไว้</AlertDescription>
    </Alert>
  );
}

function AssignmentAccessCard({ assignment }: { assignment: UserAssignmentAccess }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!assignment.expiredAt) return;

    const expiresAt = new Date(assignment.expiredAt).getTime();
    if (!Number.isFinite(expiresAt)) return;

    let timeout: number | undefined;
    const scheduleExpiryRefresh = () => {
      const remaining = expiresAt - Date.now();
      if (remaining <= 0) {
        setNow(Date.now());
        return;
      }

      timeout = window.setTimeout(
        scheduleExpiryRefresh,
        Math.min(remaining, MAX_TIMEOUT_DELAY_MS),
      );
    };
    scheduleExpiryRefresh();

    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [assignment.expiredAt]);

  const expired =
    !!assignment.expiredAt && new Date(assignment.expiredAt).getTime() <= now;
  const status = !assignment.isActive ? "inactive" : expired ? "expired" : "active";
  const available = status === "active";
  const statusContent = {
    active: { badge: "พร้อมใช้งาน", variant: "success" as const, explanation: null },
    inactive: {
      badge: "ปิดใช้งาน",
      variant: "muted" as const,
      explanation: "Assignment นี้ถูกปิดใช้งาน จึงไม่มีสิทธิ์เข้าถึงเมนู",
    },
    expired: {
      badge: "หมดอายุ",
      variant: "warning" as const,
      explanation: "Assignment นี้หมดอายุแล้ว จึงไม่มีสิทธิ์เข้าถึงเมนู",
    },
  }[status];

  return (
    <section className="rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {assignment.department?.name ?? "ระดับระบบ / ทุกแผนก"}
        </p>
        <Badge variant={statusContent.variant}>{statusContent.badge}</Badge>
        {available && <Badge variant="outline">เมนู {assignment.menuCount} รายการ</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{assignment.role.name}</p>

      {statusContent.explanation && (
        <p className="mt-3 text-sm text-muted-foreground">{statusContent.explanation}</p>
      )}

      {available &&
        (assignment.menus.length ? (
          <div className="mt-3 border-t pt-2">
            <MenuRows items={assignment.menus} />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">ไม่มีเมนูที่เข้าถึงได้</p>
        ))}
    </section>
  );
}

function MenuRows({
  items,
  depth = 0,
}: {
  items: UserAccessMenuItem[];
  depth?: number;
}) {
  return items.map((item) => (
    <div key={item.id}>
      <div
        className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <Menu className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{item.name || item.nameEn}</span>
        {item.path && (
          <code className="ml-auto truncate text-[11px] text-muted-foreground">
            {item.path}
          </code>
        )}
      </div>
      {!!item.children?.length && <MenuRows items={item.children} depth={depth + 1} />}
    </div>
  ));
}
