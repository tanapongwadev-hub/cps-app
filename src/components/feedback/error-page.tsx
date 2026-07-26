"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertTriangle, ShieldX, Clock, Wrench, FileQuestion, ServerCrash, Lock } from "lucide-react";

interface ErrorPageProps {
  code?: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  showHomeButton?: boolean;
  showBackButton?: boolean;
}

export function ErrorPage({
  code,
  title,
  description,
  icon,
  action,
  showHomeButton = true,
  showBackButton = true,
}: ErrorPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        {code && (
          <div className="text-7xl font-bold text-muted-foreground/30 tabular-nums">{code}</div>
        )}
        {icon && (
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {icon}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center justify-center gap-2">
          {showBackButton && (
            <Button variant="outline" onClick={() => typeof window !== "undefined" && window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              ย้อนกลับ
            </Button>
          )}
          {action}
          {showHomeButton && (
            <Button asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4" />
                กลับหน้าหลัก
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <ErrorPage
      code="404"
      title="ไม่พบหน้าที่คุณต้องการ"
      description="หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่เคยมีอยู่"
      icon={<FileQuestion className="h-8 w-8" />}
    />
  );
}

export function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="ไม่มีสิทธิ์เข้าถึง"
      description="คุณไม่มีสิทธิ์เข้าถึงหน้านี้ กรุณาติดต่อผู้ดูแลระบบหากต้องการสิทธิ์"
      icon={<ShieldX className="h-8 w-8" />}
    />
  );
}

export function UnauthorizedPage() {
  return (
    <ErrorPage
      title="กรุณาเข้าสู่ระบบ"
      description="คุณจำเป็นต้องเข้าสู่ระบบก่อนเข้าถึงหน้านี้"
      icon={<Lock className="h-8 w-8" />}
      showHomeButton={false}
      action={
        <Button asChild>
          <Link href="/login">เข้าสู่ระบบ</Link>
        </Button>
      }
    />
  );
}

export function SessionExpiredPage() {
  return (
    <ErrorPage
      title="เซสชันหมดอายุ"
      description="เซสชันของคุณหมดอายุแล้ว กรุณาเข้าสู่ระบบอีกครั้ง"
      icon={<Clock className="h-8 w-8" />}
      showHomeButton={false}
      action={
        <Button asChild>
          <Link href="/login">เข้าสู่ระบบอีกครั้ง</Link>
        </Button>
      }
    />
  );
}

export function MaintenancePage() {
  return (
    <ErrorPage
      title="ระบบอยู่ระหว่างปรับปรุง"
      description="ระบบกำลังอยู่ในช่วงปรับปรุง กรุณากลับมาใหม่ในภายหลัง"
      icon={<Wrench className="h-8 w-8" />}
      showHomeButton={false}
      action={
        <Button variant="outline" onClick={() => typeof window !== "undefined" && window.location.reload()}>
          ลองใหม่อีกครั้ง
        </Button>
      }
    />
  );
}

export function ServerErrorPage() {
  return (
    <ErrorPage
      code="500"
      title="เซิร์ฟเวอร์ขัดข้อง"
      description="เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ"
      icon={<ServerCrash className="h-8 w-8" />}
    />
  );
}

export function GenericErrorPage() {
  return (
    <ErrorPage
      title="เกิดข้อผิดพลาด"
      description="มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง"
      icon={<AlertTriangle className="h-8 w-8" />}
    />
  );
}
