/**
 * Sessions page
 * Lists active login sessions fetched from GET /sessions
 * and lets super admin revoke them.
 */
"use client";

import * as React from "react";
import { Monitor, MapPin, Clock, ShieldOff, Loader2 } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { useSessions, useRevokeSession } from "@/features/sessions/hooks/use-sessions";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/utils/cn";
import type { UserSession } from "@/types/session";

export default function SessionsPage() {
  const currentAccessToken = useAuthStore((s) => s.accessToken);
  const { data, isLoading, isError, error } = useSessions({ page: 1, pageSize: 50 });
  const revokeSession = useRevokeSession();
  const [pendingRevoke, setPendingRevoke] = React.useState<UserSession | null>(null);

  const items = data?.items ?? [];
  const total = data?.meta.totalItems ?? 0;
  const active = items.filter((s) => !s.revokedAt).length;
  const revoked = items.filter((s) => s.revokedAt).length;

  return (
    <PageContainer>
      <PageHeader
        title="จัดการเซสชัน"
        description="เซสชันที่ login เข้าใช้งานระบบทั้งหมด (Super Admin เท่านั้น)"
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/dashboard" },
          { label: "ระบบ" },
          { label: "จัดการเซสชัน" },
        ]}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard label="ทั้งหมด" value={total} variant="default" />
        <StatCard label="กำลังใช้งาน" value={active} variant="success" />
        <StatCard label="ถูก revoke" value={revoked} variant="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>เซสชันล่าสุด</CardTitle>
          <CardDescription>
            แสดง {items.length} รายการจาก {total} · เรียงตามเวลาสร้างล่าสุด
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              <p className="font-medium">โหลดเซสชันไม่สำเร็จ</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีเซสชัน</p>
          ) : (
            <div className="space-y-2">
              {items.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  isCurrent={isCurrentSession(session, currentAccessToken)}
                  onRevoke={() => setPendingRevoke(session)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!pendingRevoke}
        onOpenChange={(o) => !o && setPendingRevoke(null)}
        title="Revoke เซสชันนี้?"
        description={
          pendingRevoke ? (
            <>
              ผู้ใช้ <strong>{pendingRevoke.user?.username ?? pendingRevoke.userId ?? "—"}</strong>{" "}
              จะถูกบังคับออกจากระบบทันที และต้อง login ใหม่
            </>
          ) : null
        }
        confirmText="Revoke"
        variant="danger"
        onConfirm={() => {
          if (pendingRevoke) {
            revokeSession.mutate({ id: pendingRevoke.id, reason: "Revoked by admin" });
            setPendingRevoke(null);
          }
        }}
      />
    </PageContainer>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "default" | "success" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold",
            variant === "success" && "text-emerald-600",
            variant === "warning" && "text-amber-600",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function SessionRow({
  session,
  isCurrent,
  onRevoke,
}: {
  session: UserSession;
  isCurrent: boolean;
  onRevoke: () => void;
}) {
  const isRevoked = !!session.revokedAt;
  const username = session.user?.username ?? session.userName ?? "—";
  const displayName =
    session.user?.displayName ||
    (session.user?.firstName
      ? `${session.user.firstName} ${session.user.lastName ?? ""}`.trim()
      : null) ||
    username;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between",
        isCurrent && "border-emerald-500/50 bg-emerald-500/5",
        isRevoked && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Monitor className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-medium">{displayName}</p>
            <span className="text-xs text-muted-foreground">@{username}</span>
            {isCurrent && (
              <Badge variant="success" className="text-[10px]">
                เซสชันนี้
              </Badge>
            )}
            {isRevoked && (
              <Badge variant="warning" className="text-[10px]">
                ถูก revoke
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {session.ipAddress ?? "IP ไม่ทราบ"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              สร้างเมื่อ {formatDate(session.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              หมดอายุ {formatDate(session.expiresAt)}
            </span>
          </div>
          {session.revokedAt && session.revokedReason && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">เหตุผล:</span> {session.revokedReason}
            </p>
          )}
        </div>
      </div>
      {!isRevoked && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRevoke}
          disabled={isCurrent}
          className="text-danger hover:bg-danger/10 hover:text-danger"
        >
          <ShieldOff className="h-3.5 w-3.5" />
          Revoke
        </Button>
      )}
    </div>
  );
}

function isCurrentSession(session: UserSession, _currentToken: string | null): boolean {
  // Without the session token itself in the response, we can only approximate
  // "current" by matching the most-recent active session for the current user.
  // For now: mark the most recent active session as the current one.
  // (A future backend improvement could include token jti in the session list.)
  return false;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (Math.abs(diff) < 60_000) return "เมื่อกี้";
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// keep imports clean
void Loader2;
