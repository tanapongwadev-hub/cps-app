"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

export type KpiTone = "primary" | "success" | "warning" | "info" | "danger";

export const KPI_TONE: Record<KpiTone, { bg: string; ring: string; text: string; bar: string }> = {
  primary: { bg: "bg-primary/10", ring: "ring-primary/20", text: "text-primary", bar: "from-primary/40 to-primary/0" },
  success: { bg: "bg-success/10", ring: "ring-success/20", text: "text-success", bar: "from-success/40 to-success/0" },
  warning: { bg: "bg-warning/10", ring: "ring-warning/20", text: "text-warning", bar: "from-warning/40 to-warning/0" },
  info: { bg: "bg-info/10", ring: "ring-info/20", text: "text-info", bar: "from-info/40 to-info/0" },
  danger: { bg: "bg-danger/10", ring: "ring-danger/20", text: "text-danger", bar: "from-danger/40 to-danger/0" },
};

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

export function KpiCard({
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
