"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { KPI_TONE, type KpiTone } from "./kpi-card";

export function QuickAction({
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
