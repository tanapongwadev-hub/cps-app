"use client";

import * as React from "react";
import { RouteErrorState } from "@/components/feedback/route-error-state";

/**
 * Catches errors thrown by any page/component under (admin) — excluding
 * AdminLayout/AdminShell itself, which stays mounted so the sidebar/topnav
 * remain usable while this renders in the content area.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error("[admin route error]", error);
  }, [error]);

  return (
    <RouteErrorState
      title="เกิดข้อผิดพลาดในหน้านี้"
      description={error.message || "มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง"}
      onRetry={reset}
    />
  );
}
