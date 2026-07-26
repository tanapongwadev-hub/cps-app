"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Save, Mail, Phone, Building2, Shield } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/form-field";
import { FormSection, FormGrid } from "@/components/forms/form-section";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { getInitials } from "@/utils/format";
import { showToast } from "@/lib/toast";
import { formatDateTime } from "@/utils/date";

const profileSchema = z.object({
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  phone: z.string().optional().or(z.literal("")),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "กรุณากรอกรหัสผ่านปัจจุบัน"),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")
      .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่")
      .regex(/[0-9]/, "ต้องมีตัวเลข"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "รหัสผ่านยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (!user) return null;

  return (
    <>
      <PageContainer>
        <PageHeader
          title="โปรไฟล์"
          description="จัดการข้อมูลส่วนตัวและรหัสผ่าน"
          breadcrumbs={[{ label: "หน้าหลัก", href: "/dashboard" }, { label: "โปรไฟล์" }]}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1 h-fit">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar size="xl" className="h-20 w-20">
                <AvatarFallback className="text-lg">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold">{user.fullName}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {(user.roleNames ?? []).map((name) => (
                  <Badge key={name} variant="default">{name}</Badge>
                ))}
              </div>
              <div className="w-full pt-3 border-t space-y-2 text-left text-sm">
                <InfoRow icon={<Mail className="h-3.5 w-3.5" />} label="อีเมล" value={user.email} />
                {user.phone && (
                  <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="โทรศัพท์" value={user.phone} />
                )}
                {user.departmentName && (
                  <InfoRow
                    icon={<Building2 className="h-3.5 w-3.5" />}
                    label="แผนก"
                    value={user.departmentName}
                  />
                )}
                <InfoRow
                  icon={<Shield className="h-3.5 w-3.5" />}
                  label="สิทธิ์"
                  value={`${(user.permissions ?? []).length} รายการ`}
                />
                {user.lastLoginAt && (
                  <InfoRow
                    icon={<User className="h-3.5 w-3.5" />}
                    label="เข้าสู่ระบบล่าสุด"
                    value={formatDateTime(user.lastLoginAt)}
                  />
                )}
              </div>
            </div>
          </Card>

          <div className="lg:col-span-2">
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">ข้อมูลส่วนตัว</TabsTrigger>
                <TabsTrigger value="password">เปลี่ยนรหัสผ่าน</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-4">
                <Card className="p-5">
                  <form
                    onSubmit={profileForm.handleSubmit((data) => {
                      showToast.success("บันทึกข้อมูลเรียบร้อย");
                    })}
                    className="space-y-4"
                  >
                    <FormSection title="ข้อมูลส่วนตัว">
                      <FormGrid cols={2}>
                        <TextField
                          label="ชื่อ"
                          required
                          error={profileForm.formState.errors.firstName?.message}
                          {...profileForm.register("firstName")}
                        />
                        <TextField
                          label="นามสกุล"
                          required
                          error={profileForm.formState.errors.lastName?.message}
                          {...profileForm.register("lastName")}
                        />
                      </FormGrid>
                      <FormGrid cols={2}>
                        <TextField
                          label="อีเมล"
                          type="email"
                          required
                          error={profileForm.formState.errors.email?.message}
                          {...profileForm.register("email")}
                        />
                        <TextField
                          label="เบอร์โทรศัพท์"
                          type="tel"
                          error={profileForm.formState.errors.phone?.message}
                          {...profileForm.register("phone")}
                        />
                      </FormGrid>
                    </FormSection>
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="h-4 w-4" />
                        บันทึก
                      </Button>
                    </div>
                  </form>
                </Card>
              </TabsContent>

              <TabsContent value="password" className="mt-4">
                <Card className="p-5">
                  <form
                    onSubmit={passwordForm.handleSubmit((data) => {
                      showToast.success("เปลี่ยนรหัสผ่านเรียบร้อย");
                      passwordForm.reset();
                    })}
                    className="space-y-4"
                  >
                    <FormSection title="เปลี่ยนรหัสผ่าน">
                      <TextField
                        label="รหัสผ่านปัจจุบัน"
                        type="password"
                        required
                        error={passwordForm.formState.errors.currentPassword?.message}
                        {...passwordForm.register("currentPassword")}
                      />
                      <TextField
                        label="รหัสผ่านใหม่"
                        type="password"
                        required
                        error={passwordForm.formState.errors.newPassword?.message}
                        description="อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์ใหญ่และตัวเลข"
                        {...passwordForm.register("newPassword")}
                      />
                      <TextField
                        label="ยืนยันรหัสผ่านใหม่"
                        type="password"
                        required
                        error={passwordForm.formState.errors.confirmPassword?.message}
                        {...passwordForm.register("confirmPassword")}
                      />
                    </FormSection>
                    <div className="flex justify-end">
                      <Button type="submit">
                        <Save className="h-4 w-4" />
                        เปลี่ยนรหัสผ่าน
                      </Button>
                    </div>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </PageContainer>
      <PageFooter />
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
