"use client";

import { Building2, ShieldCheck as ShieldIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { User } from "@/features/auth/types";
import { useUserAssignments } from "@/features/users/hooks/use-users";
import { formatRelative } from "@/utils/date";
import { getInitials } from "@/utils/format";
import { cn } from "@/utils/cn";
import { toUiStatus, statusVariants, statusLabels } from "./user-status";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function UserAssignmentsList({ userId }: { userId: string }) {
  const { data, isLoading } = useUserAssignments(userId);
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        ผู้ใช้นี้ยังไม่มี assignment (แผนก + บทบาท)
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {data.map((a) => (
        <div
          key={a.id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-md border bg-card p-3",
            !a.isActive && "opacity-60",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="truncate text-sm font-medium">
                {a.department?.nameTh ?? a.department?.name ?? a.departmentId}
              </p>
              <span className="text-xs text-muted-foreground">·</span>
              <ShieldIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="truncate text-sm">
                {a.role?.nameTh ?? a.role?.nameEn ?? a.role?.name ?? a.roleId}
              </p>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              assigned {a.assignedAt ? formatRelative(a.assignedAt) : "-"}
            </p>
          </div>
          {a.isActive ? (
            <Badge variant="success" className="text-[10px]">ใช้งาน</Badge>
          ) : (
            <Badge variant="muted" className="text-[10px]">ระงับ</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

export function UserDetailSheet({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.username;
  const uiStatus = toUiStatus(user);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={user.avatarUrl} alt={fullName} />
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{fullName}</SheetTitle>
              <SheetDescription>@{user.username}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Tabs defaultValue="info">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="info">ข้อมูล</TabsTrigger>
              <TabsTrigger value="assignments">แผนก & บทบาท</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-3 text-sm">
              <DetailRow label="ชื่อ-นามสกุล" value={fullName} />
              <DetailRow label="Username" value={`@${user.username}`} />
              <DetailRow label="อีเมล" value={user.email} />
              <DetailRow label="เบอร์โทรศัพท์" value={user.telephone ?? "-"} />
              <DetailRow
                label="สถานะ"
                value={
                  <div className="flex items-center gap-1">
                    <Badge variant={statusVariants[uiStatus]}>{statusLabels[uiStatus]}</Badge>
                    {user.isLocked && <Badge variant="warning">ล็อก</Badge>}
                  </div>
                }
              />
              <DetailRow
                label="login attempts"
                value={
                  <span className="tabular-nums">
                    {user.failedLoginAttempts ?? 0}
                    {user.lockedUntil && ` (until ${formatRelative(user.lockedUntil)})`}
                  </span>
                }
              />
              <DetailRow
                label="permissionVersion"
                value={<span className="tabular-nums">{user.permissionVersion ?? "-"}</span>}
              />
              <DetailRow
                label="เข้าสู่ระบบล่าสุด"
                value={user.lastLoginAt ? formatRelative(user.lastLoginAt) : "-"}
              />
              <DetailRow
                label="IP ล่าสุด"
                value={user.lastLoginIp ?? "-"}
              />
              <DetailRow label="สร้างเมื่อ" value={formatRelative(user.createdAt)} />
            </TabsContent>

            <TabsContent value="assignments" className="mt-4 text-sm">
              <UserAssignmentsList userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
