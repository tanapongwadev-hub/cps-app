"use client";

import { GenericErrorPage } from "@/components/feedback/error-page";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-7xl font-bold text-muted-foreground/30">Oops!</div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">เกิดข้อผิดพลาด</h1>
              <p className="text-sm text-muted-foreground">
                {error.message || "มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง"}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

void GenericErrorPage;
