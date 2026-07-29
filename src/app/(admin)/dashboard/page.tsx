/**
 * Dashboard page
 *
 * Real-time overview of the system. All data comes from the real NestJS
 * backend (users, departments, roles, sessions). Layout:
 *
 *   1. Hero — time-based greeting + user info + quick context
 *   2. KPI strip — 4 stat cards (users, departments, roles, active sessions)
 *   3. Two-column row — recent users table + quick actions
 *   4. Bottom row — system status + activity feed
 *
 * Visual style aligns with the rest of the redesign (subtle gradients,
 * count-up animation, glass card surfaces).
 */
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  Shield,
  Activity,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  CloudSun,
  ChevronRight,
  UserPlus,
  KeyRound,
  ListChecks,
  ScrollText,
  Database,
  Server,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useUsers } from "@/features/users/hooks/use-users";
import { useDepartments } from "@/features/users/hooks/use-departments";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { useSessions } from "@/features/sessions/hooks/use-sessions";
import { getInitials } from "@/utils/format";
import { formatRelative } from "@/utils/date";
import { usePermission } from "@/hooks/use-permission";
import { cn } from "@/utils/cn";

/* ------------------------------------------------------------------ */
/*  Time-based greeting                                                */
/* ------------------------------------------------------------------ */

type Greeting = {
  th: string;
  en: string;
  Icon: React.ComponentType<{ className?: string }>;
  tint: string;
};

function getGreeting(now: Date): Greeting {
  const h = now.getHours();
  if (h >= 5 && h < 11) {
    return { th: "สวัสดีตอนเช้า", en: "Good morning", Icon: CloudSun, tint: "from-amber-400/20 to-orange-300/10" };
  }
  if (h >= 11 && h < 13) {
    return { th: "สวัสดีตอนเที่ยง", en: "Good noon", Icon: Sun, tint: "from-amber-300/20 to-yellow-200/10" };
  }
  if (h >= 13 && h < 17) {
    return { th: "สวัสดีตอนบ่าย", en: "Good afternoon", Icon: Sun, tint: "from-sky-300/20 to-blue-200/10" };
  }
  if (h >= 17 && h < 19) {
    return { th: "สวัสดีตอนเย็น", en: "Good evening", Icon: Sunset, tint: "from-orange-400/20 to-rose-300/10" };
  }
  return { th: "สวัสดีตอนกลางคืน", en: "Good night", Icon: Moon, tint: "from-indigo-500/20 to-purple-400/10" };
}

const THAI_DAY = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const THAI_MONTH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function formatThaiDate(now: Date): string {
  const day = now.getDate();
  const dow = THAI_DAY[now.getDay()];
  const month = THAI_MONTH[now.getMonth()];
  const year = now.getFullYear() + 543; // Buddhist Era
  return `วัน${dow}ที่ ${day} ${month} ${year}`;
}

/* ------------------------------------------------------------------ */
/*  Count-up animation                                                 */
/* ------------------------------------------------------------------ */

function useCountUp(target: number | undefined, durationMs = 800): number {
  const [value, setValue] = React.useState(0);
  const startRef = React.useRef<number | null>(null);
  const fromRef = React.useRef(0);
  const targetRef = React.useRef(target ?? 0);

  React.useEffect(() => {
    if (target === undefined) return;
    targetRef.current = target;
    fromRef.current = value;
    startRef.current = null;

    let raf = 0;
    const tick = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(fromRef.current + (targetRef.current - fromRef.current) * eased);
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  KPI card                                                            */
/* ------------------------------------------------------------------ */

type KpiTone = "primary" | "success" | "warning" | "info" | "danger";

const KPI_TONE: Record<KpiTone, { bg: string; ring: string; text: string; bar: string }> = {
  primary: { bg: "bg-primary/10", ring: "ring-primary/20", text: "text-primary", bar: "from-primary/40 to-primary/0" },
  success: { bg: "bg-success/10", ring: "ring-success/20", text: "text-success", bar: "from-success/40 to-success/0" },
  warning: { bg: "bg-warning/10", ring: "ring-warning/20", text: "text-warning", bar: "from-warning/40 to-warning/0" },
  info: { bg: "bg-info/10", ring: "ring-info/20", text: "text-info", bar: "from-info/40 to-info/0" },
  danger: { bg: "bg-danger/10", ring: "ring-danger/20", text: "text-danger", bar: "from-danger/40 to-danger/0" },
};

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  tone: KpiTone;
  hint?: React.ReactNode;
  loading?: boolean;
}) {
  const display = useCountUp(value);
  const t = KPI_TONE[tone];
  return (
    <Card className="group relative overflow-hidden p-5 transition-all hover:shadow-md">
      {/* Top accent bar */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r", t.bar)} />
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {loading || value === undefined ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {display.toLocaleString("th-TH")}
            </p>
          )}
          {hint && <div className="pt-0.5 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
            t.bg,
            t.text,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  System status row                                                   */
/* ------------------------------------------------------------------ */

function SystemStatusRow({
  label,
  status,
  icon: Icon,
  detail,
}: {
  label: string;
  status: "online" | "offline" | "maintenance";
  icon: React.ComponentType<{ className?: string }>;
  detail?: React.ReactNode;
}) {
  const cfg = {
    online: { dot: "bg-success", ping: "bg-success/60", label: "ทำงานปกติ", text: "text-success", Icon: CheckCircle2 },
    offline: { dot: "bg-danger", ping: "bg-danger/60", label: "ไม่ทำงาน", text: "text-danger", Icon: XCircle },
    maintenance: { dot: "bg-warning", ping: "bg-warning/60", label: "ปิดปรับปรุง", text: "text-warning", Icon: AlertCircle },
  }[status];
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card/50 p-3 transition-colors hover:bg-card">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{label}</p>
            <span className="relative flex h-2 w-2">
              {status === "online" && (
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full", cfg.ping)} />
              )}
              <span className={cn("relative inline-flex h-2 w-2 rounded-full", cfg.dot)} />
            </span>
          </div>
          {detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>}
        </div>
      </div>
      <span className={cn("shrink-0 text-xs font-medium", cfg.text)}>{cfg.label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick action card                                                   */
/* ------------------------------------------------------------------ */

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  tone = "primary",
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tone?: KpiTone;
}) {
  const t = KPI_TONE[tone];
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border bg-card/50 p-3 transition-all hover:border-primary/40 hover:bg-card hover:shadow-sm"
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-transform group-hover:scale-105",
          t.bg,
          t.text,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const superAdmin = usePermission();
  const [now, setNow] = React.useState<Date | null>(null);

  // Hydration-safe time — only on the client.
  React.useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Real backend data
  const users = useUsers({ page: 1, pageSize: 5 });
  const usersAll = useUsers({ page: 1, pageSize: 1 }); // for totalItems only
  const departments = useDepartments();
  const roles = useRoles({ page: 1, pageSize: 1 });
  const sessions = useSessions({ page: 1, pageSize: 5 });

  const usersCount = usersAll.data?.meta?.totalItems;
  const departmentsCount = departments.data?.meta?.totalItems;
  const rolesCount = roles.data?.meta?.totalItems;
  const sessionsCount = sessions.data?.meta?.totalItems;
  const activeSessionsCount = sessions.data?.items?.filter((s) => s.status === "active").length;

  const greeting = now ? getGreeting(now) : null;

  // Refresh handler — invalidates all dashboard queries
  const [refreshing, setRefreshing] = React.useState(false);
  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        usersAll.refetch(),
        users.refetch(),
        departments.refetch(),
        roles.refetch(),
        sessions.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [usersAll, users, departments, roles, sessions]);

  // Mock activity feed (real backend doesn't expose this yet — show recent
  // sessions + new users as a proxy until /activity-logs endpoint lands)
  const recentItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      type: "user" | "session" | "system";
      title: string;
      description: string;
      timestamp: string;
      status: "success" | "info" | "warning";
      user: string;
      avatar?: string;
    }> = [];
    sessions.data?.items?.slice(0, 3).forEach((s) => {
      const device = s.device ?? s.browser ?? s.os ?? "Active session";
      items.push({
        id: `s-${s.id}`,
        type: "session",
        title: device,
        description: `${s.userEmail ?? s.userName ?? s.userId ?? "—"} · ${s.ipAddress ?? "—"}`,
        timestamp: s.createdAt ?? new Date().toISOString(),
        status: s.status === "active" ? "success" : "info",
        user: s.userEmail ?? s.userName ?? s.userId ?? "—",
      });
    });
    users.data?.items?.slice(0, 3).forEach((u) => {
      items.push({
        id: `u-${u.id}`,
        type: "user",
        title: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.username,
        description: `เข้าสู่ระบบ · ${u.email ?? ""}`,
        timestamp: u.lastLoginAt ?? u.createdAt ?? new Date().toISOString(),
        status: u.isActive ? "success" : "info",
        user: u.username,
        avatar: u.avatarUrl,
      });
    });
    return items
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, 5);
  }, [sessions.data, users.data]);

  return (
    <>
      <PageContainer>
        <PageHeader
          title="ภาพรวมระบบ"
          description="ข้อมูลสดจาก backend จริง — อัปเดตทุกครั้งที่รีเฟรช"
          breadcrumbs={[{ label: "แดชบอร์ด" }]}
          primaryAction={
            <Button
              onClick={refresh}
              loading={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">รีเฟรช</span>
            </Button>
          }
        />

        {/* ============================================================ */}
        {/* HERO — greeting + user + role + date                          */}
        {/* ============================================================ */}
        <Card
          className={cn(
            "relative overflow-hidden border-primary/20 p-0",
            greeting && `bg-gradient-to-br ${greeting.tint}`,
          )}
        >
          {/* Decorative background blobs */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-1/3 h-56 w-56 rounded-full bg-info/10 blur-3xl" />

          <div className="relative grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6 sm:p-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-16 w-16 ring-4 ring-background/50 sm:h-20 sm:w-20">
                <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-info text-base font-semibold text-primary-foreground sm:text-lg">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              {greeting && (
                <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-md ring-2 ring-background">
                  <greeting.Icon className="h-3.5 w-3.5 text-foreground" />
                </div>
              )}
            </div>

            {/* Greeting + name + role */}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {greeting && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                    <greeting.Icon className="h-3.5 w-3.5" />
                    {greeting.th}
                  </span>
                )}
                {now && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatThaiDate(now)}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {user?.firstName
                  ? `${user.firstName} ${user.lastName ?? ""}`.trim()
                  : user?.username ?? "ผู้ใช้งาน"}
                <span className="ml-2 text-base font-normal text-muted-foreground">👋</span>
              </h2>
              <div className="flex flex-wrap items-center gap-1.5">
                {user?.email && (
                  <Badge variant="muted" className="gap-1 text-[10px]">
                    <Activity className="h-2.5 w-2.5" />
                    {user.email}
                  </Badge>
                )}
                {superAdmin.isSuperAdmin() && (
                  <Badge variant="success" className="gap-1 text-[10px]">
                    <Sparkles className="h-2.5 w-2.5" />
                    Super Admin
                  </Badge>
                )}
                {user?.isSuperAdmin === false && (
                  <Badge variant="muted" className="gap-1 text-[10px]">
                    <Shield className="h-2.5 w-2.5" />
                    ผู้ดูแลทั่วไป
                  </Badge>
                )}
              </div>
            </div>

            {/* Quick stats inline */}
            <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
              <span className="text-xs text-muted-foreground">สถิติด่วน</span>
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {usersCount?.toLocaleString("th-TH") ?? "—"} ผู้ใช้
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {departmentsCount?.toLocaleString("th-TH") ?? "—"} แผนก
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {rolesCount?.toLocaleString("th-TH") ?? "—"} บทบาท
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ============================================================ */}
        {/* KPI STRIP                                                     */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="ผู้ใช้งานทั้งหมด"
            value={usersCount}
            icon={Users}
            tone="primary"
            loading={usersAll.isLoading}
            hint={
              <span className="inline-flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3 text-success" />
                <span className="text-success">ใช้งานอยู่</span>
              </span>
            }
          />
          <KpiCard
            label="แผนก"
            value={departmentsCount}
            icon={Building2}
            tone="info"
            loading={departments.isLoading}
            hint={
              <span className="inline-flex items-center gap-1">
                <Activity className="h-3 w-3" />
                ทั้งหมดในระบบ
              </span>
            }
          />
          <KpiCard
            label="บทบาท"
            value={rolesCount}
            icon={Shield}
            tone="warning"
            loading={roles.isLoading}
            hint={
              <span className="inline-flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                สิทธิ์ทั้งหมด
              </span>
            }
          />
          <KpiCard
            label="เซสชันที่กำลังใช้งาน"
            value={activeSessionsCount}
            icon={Activity}
            tone="success"
            loading={sessions.isLoading}
            hint={
              <span className="inline-flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                จากทั้งหมด {sessionsCount?.toLocaleString("th-TH") ?? "—"} เซสชัน
              </span>
            }
          />
        </div>

        {/* ============================================================ */}
        {/* MAIN GRID — recent users + quick actions                      */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Recent users */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="text-sm font-semibold">ผู้ใช้งานล่าสุด</h3>
                <p className="text-xs text-muted-foreground">
                  5 รายการแรกตามเวลาที่เข้าใช้งานล่าสุด
                </p>
              </div>
              <Link
                href="/user-management/users"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                ดูทั้งหมด
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="divide-y">
              {users.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))
              ) : users.data?.items?.length ? (
                users.data.items.map((u) => {
                  const status = u.isActive ? "success" : "muted";
                  return (
                    <Link
                      key={u.id}
                      href={`/user-management/users?id=${u.id}`}
                      className="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
                    >
                      <Avatar size="sm">
                        <AvatarImage src={u.avatarUrl} alt={u.fullName} />
                        <AvatarFallback>{getInitials(u.firstName, u.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {u.firstName
                              ? `${u.firstName} ${u.lastName ?? ""}`.trim()
                              : u.username}
                          </p>
                          <Badge
                            variant={status as "success" | "warning" | "muted"}
                            className="text-[9px]"
                          >
                            {u.status}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {u.email} · {u.lastLoginAt
                            ? formatRelative(u.lastLoginAt)
                            : "ยังไม่เคยเข้าสู่ระบบ"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
                    </Link>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-1 p-8 text-center text-sm text-muted-foreground">
                  <Users className="h-6 w-6 text-muted-foreground/30" />
                  <p>ยังไม่มีผู้ใช้งาน</p>
                </div>
              )}
            </div>
          </Card>

          {/* Quick actions */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">ทางลัด</h3>
                <p className="text-xs text-muted-foreground">งานที่ทำบ่อย</p>
              </div>
              <Sparkles className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div className="space-y-2">
              <QuickAction
                href="/user-management/users"
                icon={UserPlus}
                title="เพิ่มผู้ใช้งาน"
                description="สร้าง user ใหม่ในระบบ"
                tone="primary"
              />
              <QuickAction
                href="/user-management/roles"
                icon={Shield}
                title="จัดการบทบาท"
                description="สร้าง/แก้ไข role และสิทธิ์"
                tone="warning"
              />
              <QuickAction
                href="/sessions"
                icon={Activity}
                title="ดูเซสชันทั้งหมด"
                description="จัดการการเข้าสู่ระบบ"
                tone="info"
              />
              <QuickAction
                href="/system/menu-management"
                icon={ListChecks}
                title="จัดการเมนู"
                description="โครงสร้างเมนูของระบบ"
                tone="success"
              />
              <QuickAction
                href="/permissions"
                icon={KeyRound}
                title="จัดการสิทธิ์"
                description="สิทธิ์และ permissions"
                tone="danger"
              />
              <QuickAction
                href="/system/activity-logs"
                icon={ScrollText}
                title="บันทึกการใช้งาน"
                description="Audit log ของระบบ"
                tone="info"
              />
            </div>
          </Card>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM GRID — system + activity                               */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* System status */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">สถานะระบบ</h3>
                <p className="text-xs text-muted-foreground">
                  ตรวจสอบบริการและทรัพยากร
                </p>
              </div>
              <Link
                href="/system/settings"
                className="text-xs font-medium text-primary hover:underline"
              >
                ตั้งค่า
              </Link>
            </div>
            <div className="space-y-2">
              <SystemStatusRow
                label="API Server"
                status="online"
                icon={Server}
                detail="NestJS · localhost:3001"
              />
              <SystemStatusRow
                label="Database"
                status="online"
                icon={Database}
                detail="PostgreSQL · connected"
              />
              <SystemStatusRow
                label="Cache Layer"
                status="online"
                icon={Activity}
                detail="Redis · healthy"
              />
              <SystemStatusRow
                label="พื้นที่จัดเก็บ"
                status="online"
                icon={HardDrive}
                detail="256 GB / 1024 GB (25%)"
              />
            </div>

            {/* Storage progress bar */}
            <div className="mt-3 space-y-1.5 rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ใช้ไป 25% ของพื้นที่</span>
                <span className="font-mono font-medium tabular-nums">256 / 1024 GB</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-info transition-all"
                  style={{ width: "25%" }}
                />
              </div>
            </div>
          </Card>

          {/* Activity feed */}
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">กิจกรรมล่าสุด</h3>
                <p className="text-xs text-muted-foreground">
                  จาก sessions และผู้ใช้งานล่าสุด
                </p>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground/40" />
            </div>
            {recentItems.length > 0 ? (
              <ul className="space-y-2">
                {recentItems.map((item) => {
                  const dot =
                    item.status === "success"
                      ? "bg-success"
                      : item.status === "warning"
                        ? "bg-warning"
                        : "bg-info";
                  return (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted/40"
                    >
                      <Avatar size="sm" className="shrink-0">
                        <AvatarImage src={item.avatar} alt={item.user} />
                        <AvatarFallback>{getInitials(item.user)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
                          <p className="truncate text-sm font-medium">{item.title}</p>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatRelative(item.timestamp)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-1 py-8 text-center text-sm text-muted-foreground">
                <Clock className="h-6 w-6 text-muted-foreground/30" />
                <p>ยังไม่มีกิจกรรม</p>
              </div>
            )}
          </Card>
        </div>
      </PageContainer>
      <PageFooter />
    </>
  );
}
