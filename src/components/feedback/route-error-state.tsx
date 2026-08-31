"use client";

import { AlertTriangle, FileQuestion, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Error/empty state sized for a single route segment's content area
 * (inside AdminShell's `<main>`), as opposed to `ErrorPage` in
 * `error-page.tsx` which is full-viewport and meant for standalone routes
 * like /404 or /500.
 */
export function RouteErrorState({
  title = "เกิดข้อผิดพลาดในหน้านี้",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center"
      role="alert"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="h-4 w-4" />
          ลองใหม่อีกครั้ง
        </Button>
      )}
    </div>
  );
}

export function RouteNotFoundState({
  title = "ไม่พบข้อมูลที่คุณต้องการ",
  description = "รายการนี้อาจถูกลบ ย้าย หรือไม่เคยมีอยู่",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileQuestion className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
