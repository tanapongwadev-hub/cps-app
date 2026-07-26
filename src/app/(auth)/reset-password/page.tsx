"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/form-field";
import { apiClient } from "@/services/api-client";
import { showToast } from "@/lib/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
      .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
      .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "รหัสผ่านยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await apiClient.post("/auth/reset-password", { token, ...values });
      setDone(true);
      showToast.success("รีเซ็ตรหัสผ่านเรียบร้อย");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      showToast.error("ไม่สามารถรีเซ็ตรหัสผ่านได้", "ลิงก์อาจหมดอายุ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          กลับไปหน้าเข้าสู่ระบบ
        </Link>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-sm text-muted-foreground">
            กรอกรหัสผ่านใหม่ที่คุณต้องการใช้งาน
          </p>
        </div>

        {done ? (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>รีเซ็ตรหัสผ่านเรียบร้อย</strong>
              <br />
              กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <TextField
              label="รหัสผ่านใหม่"
              type="password"
              leftIcon={<KeyRound />}
              required
              error={errors.password?.message}
              description="อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์ใหญ่และตัวเลข"
              {...register("password")}
            />
            <TextField
              label="ยืนยันรหัสผ่านใหม่"
              type="password"
              leftIcon={<KeyRound />}
              required
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />
            <Button type="submit" className="w-full" loading={submitting}>
              บันทึกรหัสผ่านใหม่
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
