"use client";

import * as React from "react";
import { RouteErrorState } from "@/components/feedback/route-error-state";

/**
 * Isolates errors to the tickets section so a crash while loading/mutating
 * a ticket doesn't tear down unrelated (admin) routes' state.
 */
export default function TicketsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[tickets route error]", error);
  }, [error]);

  return (
    <RouteErrorState
      title="เกิดข้อผิดพลาดในหน้าคำขอ (Ticket)"
      description={error.message || "ไม่สามารถโหลดหรือประมวลผลคำขอนี้ได้ กรุณาลองใหม่อีกครั้ง"}
      onRetry={reset}
    />
  );
}
