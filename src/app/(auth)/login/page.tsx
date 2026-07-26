"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, ShieldCheck, KeyRound, Sparkles, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextField } from "@/components/forms/form-field";
import { useAuthStore } from "@/stores/auth-store";
import { showToast } from "@/lib/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isMockMode } from "@/config/env";
import { useLogin } from "@/features/auth/hooks/use-auth";

const loginSchema = z.object({
  username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้งาน"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const pendingSelection = useAuthStore((s) => s.pendingSelection);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: isMockMode ? "admin" : "",
      password: isMockMode ? "admin" : "",
      remember: true,
    },
  });

  React.useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get("redirect") ?? "/dashboard";
      router.replace(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  // If 2-step is required, redirect to select-department
  React.useEffect(() => {
    if (pendingSelection) {
      router.push("/select-department");
    }
  }, [pendingSelection, router]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      // `remember` is a UI-only concern (mock flows). The real NestJS backend
      // does not accept it in /auth/login (returns 400 VALIDATION_ERROR), so we
      // strip it before sending.
      const { remember: _remember, ...payload } = values;
      void _remember;
      await login.mutateAsync(payload);
    } catch (err) {
      const message = err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
      showToast.error("เข้าสู่ระบบไม่สำเร็จ", message);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-base font-bold">A</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
            <p className="text-sm text-muted-foreground">
              กรอกชื่อผู้ใช้งานและรหัสผ่านเพื่อเข้าสู่ระบบ
            </p>
          </div>

          {login.isError && (
            <Alert variant="danger">
              <AlertDescription>
                {login.error instanceof Error ? login.error.message : "เข้าสู่ระบบไม่สำเร็จ"}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <TextField
              label="ชื่อผู้ใช้งาน / อีเมล"
              placeholder="admin"
              autoComplete="username"
              required
              error={errors.username?.message}
              {...register("username")}
            />
            <TextField
              label="รหัสผ่าน"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={watch("remember") ?? false}
                  onCheckedChange={(v) => setValue("remember", !!v)}
                />
                จำฉันไว้ในระบบ
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={login.isPending}
            >
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </Button>
          </form>

          {isMockMode && (
            <Alert variant="info">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>โหมดตัวอย่าง (Mock Mode)</strong>
                <br />
                <div className="mt-2 space-y-1.5 text-xs">
                  <div>
                    <code>admin / admin</code> → SUPER_ADMIN + ADMIN (2 แผนก → ต้องเลือก)
                  </div>
                  <div>
                    <code>manager / admin</code> → MANAGER + STAFF (2 แผนก → ต้องเลือก)
                  </div>
                  <div>
                    <code>staff / admin</code> → STAFF แผนกเดียว (เข้าได้เลย)
                  </div>
                  <div>
                    <code>somchai / admin</code> → ADMIN (เข้าได้เลย)
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-center text-xs text-muted-foreground">
            © 2024 Admin Template ·{" "}
            <Link href="/maintenance" className="hover:underline">
              สถานะระบบ
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding + Available Menus Preview */}
      <div className="relative hidden bg-sidebar lg:flex lg:flex-col lg:justify-between p-10 text-sidebar-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-sidebar-accent opacity-90" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <span>A</span>
            </div>
            <span>Admin Template</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            ระบบจัดการองค์กร
            <br />
            ที่ทันสมัยและปลอดภัย
          </h2>
          <p className="text-sidebar-muted-foreground">
            ออกแบบมาเพื่อรองรับการใช้งานในระดับองค์กร พร้อมระบบจัดการสิทธิ์ ผู้ใช้งาน และการดำเนินงาน
            ครบวงจร
          </p>

          <div className="space-y-3">
            <FeatureItem
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Role-Based Access Control"
              description="ควบคุมสิทธิ์ตามบทบาทและหน้าที่ พร้อมรองรับหลายแผนก"
            />
            <FeatureItem
              icon={<Building2 className="h-5 w-5" />}
              title="Multi-Department Support"
              description="ผู้ใช้งาน 1 คนสามารถมีหลายแผนก/บทบาท สลับได้ตามต้องการ"
            />
            <FeatureItem
              icon={<KeyRound className="h-5 w-5" />}
              title="ปลอดภัยด้วย JWT + Refresh Token"
              description="2-step login, Session management, 401 auto-refresh"
            />
            <FeatureItem
              icon={<Users className="h-5 w-5" />}
              title="เมนูแสดงตามสิทธิ์จริง"
              description="Sidebar แสดงเฉพาะเมนูที่ user มีสิทธิ์เข้าถึง"
            />
          </div>
        </div>

        <div className="relative z-10 text-xs text-sidebar-muted-foreground">v1.0.0</div>
      </div>
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-sidebar-border bg-sidebar-accent/30 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sidebar-primary/10 text-sidebar-primary">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-sidebar-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" />}>
      <LoginContent />
    </Suspense>
  );
}
