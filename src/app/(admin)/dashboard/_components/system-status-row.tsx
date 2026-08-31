"use client";

import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export function SystemStatusRow({
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
