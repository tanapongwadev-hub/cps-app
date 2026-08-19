"use client";

import * as React from "react";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, Sparkles } from "lucide-react";
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
      // Use window.location for hard redirect to ensure navigation works
      window.location.href = redirect;
    }
  }, [isAuthenticated, searchParams]);

  // If 2-step is required, redirect to select-department
  React.useEffect(() => {
    if (pendingSelection) {
      // Use window.location for hard redirect to ensure navigation works
      window.location.href = "/select-department";
    }
  }, [pendingSelection]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      // Stash the username on `window` so the /select-department page can
      // show a "logged in as @username" hint when the 2-step response
      // doesn't include the full User object.
      if (typeof window !== "undefined") {
        (window as { __lastLoginUsername?: string }).__lastLoginUsername = values.username;
      }
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

  // If the login just kicked off the 2-step flow, also push the username
  // into the pendingSelection so the /select-department page can show a
  // "logged in as @username" hint (the 2-step response itself doesn't
  // include the full User object on the real backend).
  React.useEffect(() => {
    if (pendingSelection && !pendingSelection.user && typeof window !== "undefined") {
      const lastUsername = (window as { __lastLoginUsername?: string }).__lastLoginUsername;
      if (lastUsername) {
        const synthetic = {
          id: "",
          username: lastUsername,
          email: "",
          firstName: lastUsername,
          lastName: "",
          fullName: lastUsername,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as const;
        useAuthStore.getState().setPendingSelection({
          ...pendingSelection,
          user: synthetic,
        });
      }
    }
  }, [pendingSelection]);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.2fr_1fr]">
      {/* Left side - Branding */}
      <div className="relative hidden overflow-hidden bg-[#0a1628] lg:flex lg:flex-col lg:justify-between p-10 text-white">
        <Image
          src="/cps-factory-background.png"
          alt="CPS Factory Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/95 via-[#0d2242]/85 to-[#123258]/80" />

        <div className="relative z-10 flex items-center gap-4">
          <Image
            src="/cci_logo.png"
            alt="CCI Logo"
            width={72}
            height={72}
            className="h-16 w-16 object-contain"
          />
          <div>
            <p className="text-2xl font-bold tracking-wide">CPS</p>
            <p className="text-xs text-slate-300">Production Management System</p>
          </div>
        </div>

        <div className="relative z-10 space-y-5 max-w-lg">
          <h2 className="text-4xl font-bold leading-tight xl:text-5xl">
            Access Control
            <br />
            Portal
          </h2>
          <p className="text-sm text-slate-300">
            Secure role-based workspace for your operational team.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            System ready
          </div>
        </div>

        <div className="relative z-10 text-[10px] font-medium tracking-[0.2em] text-slate-400">
          AUTHENTICATED ACCESS / CPS
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center bg-[#f7f9fb] p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-primary">
              CPS / ACCESS CONTROL
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500">
              Sign in to continue to your workspace.
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
              label="Username"
              placeholder="Enter your username"
              autoComplete="username"
              required
              error={errors.username?.message}
              className="rounded-lg border border-slate-300 bg-white shadow-sm focus-visible:border-primary"
              {...register("username")}
            />
            <TextField
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              error={errors.password?.message}
              className="rounded-lg border border-slate-300 bg-white shadow-sm focus-visible:border-primary"
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
              className="w-full rounded-lg"
              size="lg"
              loading={login.isPending}
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>

            <p className="text-center text-[11px] text-slate-400">
              Your session is protected with secure, httpOnly cookies.
            </p>
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

          <p className="text-center text-xs text-slate-400">
            © 2024 CPS ·{" "}
            <Link href="/maintenance" className="hover:underline">
              สถานะระบบ
            </Link>
          </p>
        </div>
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
