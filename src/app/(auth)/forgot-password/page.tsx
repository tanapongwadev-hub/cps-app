"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/form-field";
import { apiClient } from "@/services/api-client";
import { showToast } from "@/lib/toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const forgotSchema = z.object({
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
});
type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotFormValues) => {
    setSubmitting(true);
    try {
      await apiClient.post("/auth/forgot-password", values);
      setDone(true);
      showToast.success("ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อย");
    } catch {
      // Even on error, show generic success to prevent email enumeration
      setDone(true);
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
          <h1 className="text-2xl font-semibold tracking-tight">ลืมรหัสผ่าน</h1>
          <p className="text-sm text-muted-foreground">
            กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปให้
          </p>
        </div>

        {done ? (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อย</strong>
              <br />
              กรุณาตรวจสอบอีเมลของคุณและคลิกลิงก์เพื่อตั้งรหัสผ่านใหม่
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <TextField
              label="อีเมล"
              type="email"
              placeholder="example@company.com"
              leftIcon={<Mail />}
              required
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" className="w-full" loading={submitting}>
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
