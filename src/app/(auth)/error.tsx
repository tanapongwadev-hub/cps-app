"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorPage } from "@/components/feedback/error-page";

/**
 * Catches errors thrown by any page under (auth) — login, forgot/reset
 * password, select-department. AuthLayout has no chrome to preserve, so
 * this uses the full-viewport error page.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[auth route error]", error);
  }, [error]);

  return (
    <ErrorPage
      title="เกิดข้อผิดพลาด"
      description={error.message || "มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง"}
      icon={<AlertTriangle className="h-8 w-8" />}
      showHomeButton={false}
      showBackButton={false}
      action={
        <Button onClick={reset}>
          ลองใหม่อีกครั้ง
        </Button>
      }
    />
  );
}
