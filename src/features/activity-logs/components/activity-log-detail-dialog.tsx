"use client";

/**
 * Activity Log detail dialog
 * Shows the full log entry including previous/new data, error message, etc.
 */
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useActivityLog } from "../hooks/use-activity-logs";
import { formatDateTime } from "@/utils/date";
import { cn } from "@/utils/cn";
import type { ActivityAction } from "@/features/activity-logs/types";

const actionLabel: Record<ActivityAction, string> = {
  create: "สร้าง",
  update: "แก้ไข",
  delete: "ลบ",
  view: "ดู",
  login: "เข้าสู่ระบบ",
  logout: "ออกจากระบบ",
  export: "ส่งออก",
  import: "นำเข้า",
  approve: "อนุมัติ",
  reject: "ปฏิเสธ",
  assign: "มอบหมาย",
  status_change: "เปลี่ยนสถานะ",
  permission_change: "เปลี่ยนสิทธิ์",
};

const actionVariant: Record<
  ActivityAction,
  "success" | "info" | "warning" | "danger" | "default" | "muted"
> = {
  create: "success",
  update: "info",
  delete: "danger",
  view: "default",
  login: "info",
  logout: "muted",
  export: "info",
  import: "info",
  approve: "success",
  reject: "warning",
  assign: "info",
  status_change: "info",
  permission_change: "warning",
};

const statusVariant: Record<"success" | "failure" | "warning", "success" | "danger" | "warning"> = {
  success: "success",
  failure: "danger",
  warning: "warning",
};

const statusLabel: Record<"success" | "failure" | "warning", string> = {
  success: "สำเร็จ",
  failure: "ล้มเหลว",
  warning: "เตือน",
};

interface ActivityLogDetailDialogProps {
  logId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityLogDetailDialog({
  logId,
  open,
  onOpenChange,
}: ActivityLogDetailDialogProps) {
  const { data, isLoading, isError, error } = useActivityLog(logId, open);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>รายละเอียดบันทึกกิจกรรม</DialogTitle>
          <DialogDescription>
            ข้อมูลครบถ้วนของเหตุการณ์ที่บันทึกไว้ในระบบ
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <p className="font-medium">โหลดรายละเอียดไม่สำเร็จ</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : data ? (
          <div className="space-y-4 text-sm">
            {/* Header row: action + status badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={actionVariant[data.action] ?? "default"}>
                {actionLabel[data.action] ?? data.action}
              </Badge>
              <Badge variant="outline">{data.module}</Badge>
              <Badge variant={statusVariant[data.status]}>
                {statusLabel[data.status]}
              </Badge>
            </div>

            <Section title="คำอธิบาย">
              <p className="text-foreground">{data.description || "—"}</p>
            </Section>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Section title="ผู้ใช้งาน">
                <p className="font-medium">{data.userName || "—"}</p>
                {data.userEmail && (
                  <p className="text-xs text-muted-foreground">{data.userEmail}</p>
                )}
              </Section>
              <Section title="เวลา">
                <p className="tabular-nums">{formatDateTime(data.timestamp)}</p>
              </Section>
              <Section title="ทรัพยากร">
                <p>
                  {data.resource}
                  {data.resourceId && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (#{data.resourceId})
                    </span>
                  )}
                </p>
              </Section>
              <Section title="IP Address">
                <code className="text-xs">{data.ipAddress || "—"}</code>
              </Section>
            </div>

            {data.userAgent && (
              <Section title="User Agent">
                <code className="block break-all text-xs text-muted-foreground">
                  {data.userAgent}
                </code>
              </Section>
            )}

            {data.duration != null && (
              <Section title="ระยะเวลา">
                <p className="tabular-nums">{data.duration} ms</p>
              </Section>
            )}

            {data.errorMessage && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3",
                )}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <div className="text-sm">
                  <p className="font-medium text-danger">ข้อความผิดพลาด</p>
                  <p className="mt-1 text-muted-foreground">{data.errorMessage}</p>
                </div>
              </div>
            )}

            {data.previousData != null && (
              <Section title="ข้อมูลก่อนหน้า (Previous)">
                <JsonBlock data={data.previousData} />
              </Section>
            )}

            {data.newData != null && (
              <Section title="ข้อมูลใหม่ (New)">
                <JsonBlock data={data.newData} />
              </Section>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  const text = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);
  return (
    <pre className="max-h-60 overflow-auto rounded-md border bg-muted/30 p-2 text-xs">
      {text}
    </pre>
  );
}
