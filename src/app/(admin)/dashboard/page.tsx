"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Ticket,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Activity,
  TrendingUp,
  Server,
  Database,
  HardDrive,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/stores/auth-store";
import { getInitials } from "@/utils/format";
import { formatRelative, formatBytes } from "@/utils/date";
import { apiClient } from "@/services/api-client";
import { showToast } from "@/lib/toast";
import type { DashboardData } from "@/types/dashboard";
import { cn } from "@/utils/cn";

const kpiIcons = {
  primary: Users,
  success: CheckCircle2,
  warning: Clock,
  info: Ticket,
  danger: AlertCircle,
} as const;

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await apiClient.get<DashboardData>("/dashboard/stats");
      setData(res);
    } catch {
      showToast.error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer>
        <PageHeader
          title={`สวัสดี, ${user?.firstName ?? "ผู้ใช้งาน"} 👋`}
          description="ภาพรวมข้อมูลและกิจกรรมล่าสุดในระบบ"
          breadcrumbs={[{ label: "แดชบอร์ด" }]}
          primaryAction={
            <Button onClick={() => load(true)} loading={refreshing} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">รีเฟรช</span>
            </Button>
          }
          secondaryActions={
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">ส่งออกรายงาน</span>
            </Button>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.kpis.map((kpi) => {
            const Icon = kpiIcons[kpi.color ?? "primary"];
            const isUp = kpi.trend === "up";
            const isDown = kpi.trend === "down";
            return (
              <Card key={kpi.key} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {kpi.label}
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">
                      {kpi.value.toLocaleString("th-TH")}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md",
                      kpi.color === "primary" && "bg-primary/10 text-primary",
                      kpi.color === "success" && "bg-success/10 text-success",
                      kpi.color === "warning" && "bg-warning/10 text-warning",
                      kpi.color === "info" && "bg-info/10 text-info",
                      kpi.color === "danger" && "bg-danger/10 text-danger",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs">
                  {isUp && <ArrowUpRight className="h-3.5 w-3.5 text-success" />}
                  {isDown && <ArrowDownRight className="h-3.5 w-3.5 text-danger" />}
                  <span className={cn("font-medium", isUp && "text-success", isDown && "text-danger")}>
                    {Math.abs(kpi.changePercent).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">เทียบกับช่วงก่อนหน้า</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Trend Chart - 2 cols */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold">แนวโน้มคำขอ 30 วัน</h3>
                <p className="text-xs text-muted-foreground">เปรียบเทียบคำขอที่ได้รับและเสร็จสิ้น</p>
              </div>
              <Badge variant="muted" className="gap-1">
                <TrendingUp className="h-3 w-3" />
                30 วัน
              </Badge>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trendChart[0]?.data ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                    className="text-muted-foreground"
                    stroke="currentColor"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" stroke="currentColor" />
                  <RechartsTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {data.trendChart.map((series, idx) => (
                    <Line
                      key={series.name}
                      type="monotone"
                      dataKey="value"
                      name={series.name}
                      data={series.data}
                      stroke={idx === 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-2))"}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Status Donut */}
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">สถานะคำขอ</h3>
              <p className="text-xs text-muted-foreground">แยกตามสถานะปัจจุบัน</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.statusChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.statusChart.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Category bar + Recent activities + System status */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">คำขอตามหมวดหมู่</h3>
              <p className="text-xs text-muted-foreground">หมวดหมู่ที่มีคำขอมากที่สุด</p>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryChart} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="currentColor" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    stroke="currentColor"
                    width={70}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.categoryChart.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">กิจกรรมล่าสุด</h3>
                <p className="text-xs text-muted-foreground">รายการที่เกิดขึ้นในระบบ</p>
              </div>
              <Link href="/system/activity-logs" className="text-xs font-medium text-primary hover:underline">
                ดูทั้งหมด
              </Link>
            </div>
            <ul className="space-y-3">
              {data.recentActivities.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(a.user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{a.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatRelative(a.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">สถานะระบบ</h3>
              <p className="text-xs text-muted-foreground">ตรวจสอบสถานะบริการ</p>
            </div>
            <ul className="space-y-3">
              <SystemStatusItem
                label="API Server"
                status={data.systemStatus.server}
                icon={<Server className="h-4 w-4" />}
              />
              <SystemStatusItem
                label="Database"
                status={data.systemStatus.database}
                icon={<Database className="h-4 w-4" />}
              />
              <SystemStatusItem
                label="Cache"
                status={data.systemStatus.cache}
                icon={<Activity className="h-4 w-4" />}
              />
              <li className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    พื้นที่จัดเก็บ
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatBytes(data.systemStatus.storage.used * 1024 ** 3)} /{" "}
                    {formatBytes(data.systemStatus.storage.total * 1024 ** 3)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(data.systemStatus.storage.used / data.systemStatus.storage.total) * 100}%`,
                    }}
                  />
                </div>
              </li>
            </ul>
          </Card>
        </div>

        {/* Pending Tasks */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">งานที่รออนุมัติ</h3>
              <p className="text-xs text-muted-foreground">รายการที่ต้องดำเนินการ</p>
            </div>
            <Link href="/operations/approvals">
              <Button variant="outline" size="sm">
                ดูทั้งหมด
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.pendingTasks.map((t) => (
              <div
                key={t.id}
                className="rounded-md border bg-card p-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={t.status === "warning" ? "warning" : "info"}>
                    {t.type === "ticket" ? "คำขอ" : t.type === "user" ? "ผู้ใช้งาน" : "งาน"}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{formatRelative(t.timestamp)}</span>
                </div>
                <p className="text-sm font-medium line-clamp-1">{t.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(t.user)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{t.user}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </PageContainer>
      <PageFooter />
    </>
  );
}

function SystemStatusItem({
  label,
  status,
  icon,
}: {
  label: string;
  status: "online" | "offline" | "maintenance";
  icon: React.ReactNode;
}) {
  const config = {
    online: { variant: "success" as const, label: "ทำงานปกติ", Icon: CheckCircle },
    offline: { variant: "danger" as const, label: "ไม่ทำงาน", Icon: XCircle },
    maintenance: { variant: "warning" as const, label: "ปิดปรับปรุง", Icon: AlertCircle },
  };
  const c = config[status];
  return (
    <li className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      <Badge variant={c.variant} className="gap-1">
        <c.Icon className="h-3 w-3" />
        {c.label}
      </Badge>
    </li>
  );
}
