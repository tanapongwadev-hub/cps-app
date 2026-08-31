"use client";

import * as React from "react";
import { RouteErrorState } from "@/components/feedback/route-error-state";

/**
 * Isolates errors to the materials section (receiving/disbursement/reports)
 * so a crash here doesn't also tear down unrelated (admin) routes' state.
 */
export default function MaterialsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[materials route error]", error);
  }, [error]);

  return (
    <RouteErrorState
      title="เกิดข้อผิดพลาดในหน้าจัดการวัสดุ"
      description={error.message || "ไม่สามารถโหลดหรือประมวลผลข้อมูลวัสดุได้ กรุณาลองใหม่อีกครั้ง"}
      onRetry={reset}
    />
  );
}
