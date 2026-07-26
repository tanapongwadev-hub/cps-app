"use client";

/**
 * Coming Soon page
 * Used as a placeholder for menu items the backend has but the frontend
 * hasn't built yet. Reads the menu code from `?feature=CODE` and shows it.
 */
import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get("feature");
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
            <Construction className="h-6 w-6" />
          </div>
          <CardTitle>หน้านี้กำลังอยู่ระหว่างพัฒนา</CardTitle>
          <CardDescription>
            ระบบได้รับสิทธิ์เข้าถึงเมนูนี้แล้ว แต่ยังไม่มีหน้าจัดการในขณะนี้
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {feature && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Menu code: </span>
              <code className="font-mono text-foreground">{feature}</code>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            ติดต่อทีม frontend เพื่อสร้างหน้าจัดการสำหรับเมนูนี้
          </p>
          <div className="flex justify-center gap-2">
            <Button asChild variant="default">
              <Link href="/dashboard">กลับไปแดชบอร์ด</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <React.Suspense fallback={null}>
      <ComingSoonContent />
    </React.Suspense>
  );
}
