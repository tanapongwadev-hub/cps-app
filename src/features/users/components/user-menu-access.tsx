"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Menu } from "lucide-react";
import { useState } from "react";
import type { UserAccessMenuItem, UserAssignmentAccess } from "../api/users-api";
import { useUserAccessSummary } from "../hooks/use-users";

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
  const [now] = useState(Date.now);
  const expired =
    !!assignment.expiredAt && new Date(assignment.expiredAt).getTime() <= now;
  const available = assignment.isActive && !expired;

  return (
    <section className="rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-medium">
          {assignment.department?.name ?? "ระบบ / ทุกแผนก"}
        </p>
        <Badge variant={available ? "success" : "muted"}>
          {available ? "พร้อมใช้งาน" : "ไม่พร้อมใช้งาน"}
        </Badge>
        {available && <Badge variant="outline">เมนู {assignment.menuCount} รายการ</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{assignment.role.name}</p>

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
