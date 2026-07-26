"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User as UserIcon, Save } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextField, SelectField } from "@/components/forms/form-field";
import { FormSection, FormGrid } from "@/components/forms/form-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/format";
import { createUserSchema, updateUserSchema, type CreateUserFormValues, type UpdateUserFormValues } from "../schemas/user-schema";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { useDepartments } from "@/features/users/hooks/use-departments";
import { useCreateUser, useUpdateUser } from "../hooks/use-users";
import type { User } from "@/types/auth";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();
  const { data: rolesData } = useRoles({ page: 1, pageSize: 100 });
  const { data: deptData } = useDepartments();

  const formCreate = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      departmentId: "",
      roleIds: [],
      status: "active",
    },
  });

  const formUpdate = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      departmentId: user?.departmentId ?? "",
      roleIds: user?.roleIds ?? [],
      status: (user?.status as UpdateUserFormValues["status"]) ?? "active",
    },
  });

  // Reset update form when user changes
  React.useEffect(() => {
    if (isEdit && user) {
      formUpdate.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? "",
        departmentId: user.departmentId ?? "",
        roleIds: user.roleIds,
        status: (user.status as UpdateUserFormValues["status"]) ?? "active",
      });
    }
    if (!isEdit) {
      formCreate.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isEdit, open]);

  const onSubmitCreate = async (values: CreateUserFormValues) => {
    const { confirmPassword: _cp, ...data } = values;
    await create.mutateAsync({
      ...data,
      roleIds: values.roleIds,
    });
    onOpenChange(false);
  };

  const onSubmitUpdate = async (values: UpdateUserFormValues) => {
    if (!user) return;
    await update.mutateAsync({ id: user.id, data: values });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="xl" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            {isEdit ? "แก้ไขข้อมูลผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `แก้ไขข้อมูลของ ${user?.fullName}`
              : "กรอกข้อมูลผู้ใช้งานใหม่เพื่อเพิ่มเข้าสู่ระบบ"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          {isEdit && user && (
            <div className="mb-4 flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <Avatar size="lg">
                <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>
          )}

          {isEdit ? (
            <Tabs defaultValue="general">
              <TabsList className="w-full">
                <TabsTrigger value="general" className="flex-1">ข้อมูลทั่วไป</TabsTrigger>
                <TabsTrigger value="access" className="flex-1">สิทธิ์และแผนก</TabsTrigger>
              </TabsList>

              <form
                onSubmit={formUpdate.handleSubmit(onSubmitUpdate as never)}
                className="mt-4 space-y-6"
                noValidate
              >
                <TabsContent value="general" className="space-y-4 mt-0">
                  <FormSection title="ข้อมูลส่วนตัว">
                    <FormGrid cols={2}>
                      <TextField
                        label="ชื่อ"
                        required
                        error={formUpdate.formState.errors.firstName?.message}
                        {...formUpdate.register("firstName")}
                      />
                      <TextField
                        label="นามสกุล"
                        required
                        error={formUpdate.formState.errors.lastName?.message}
                        {...formUpdate.register("lastName")}
                      />
                    </FormGrid>
                    <FormGrid cols={2}>
                      <TextField
                        label="อีเมล"
                        type="email"
                        required
                        error={formUpdate.formState.errors.email?.message}
                        {...formUpdate.register("email")}
                      />
                      <TextField
                        label="เบอร์โทรศัพท์"
                        type="tel"
                        error={formUpdate.formState.errors.phone?.message}
                        {...formUpdate.register("phone")}
                      />
                    </FormGrid>
                  </FormSection>

                  <FormSection title="สถานะ">
                    <SelectField
                      label="สถานะผู้ใช้งาน"
                      value={formUpdate.watch("status")}
                      onValueChange={(v) =>
                        formUpdate.setValue("status", v as UpdateUserFormValues["status"])
                      }
                      options={[
                        { value: "active", label: "ใช้งาน" },
                        { value: "inactive", label: "ระงับการใช้งาน" },
                        { value: "pending", label: "รอเปิดใช้งาน" },
                      ]}
                    />
                  </FormSection>
                </TabsContent>

                <TabsContent value="access" className="space-y-4 mt-0">
                  <FormSection title="แผนก">
                    <SelectField
                      label="แผนก"
                      value={formUpdate.watch("departmentId") ?? ""}
                      onValueChange={(v) => formUpdate.setValue("departmentId", v)}
                      options={[
                        { value: "", label: "ไม่ระบุ" },
                        ...(deptData?.items?.map((d) => ({ value: d.id, label: d.name })) ?? []),
                      ]}
                    />
                  </FormSection>

                  <FormSection title="บทบาท">
                    <div className="space-y-2">
                      {rolesData?.items.map((role) => (
                        <label
                          key={role.id}
                          className="flex items-start gap-2 rounded-md border bg-card p-3 cursor-pointer hover:bg-accent/30"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                            checked={formUpdate.watch("roleIds")?.includes(role.id) ?? false}
                            onChange={(e) => {
                              const current = formUpdate.getValues("roleIds");
                              if (e.target.checked) {
                                formUpdate.setValue("roleIds", [...current, role.id]);
                              } else {
                                formUpdate.setValue(
                                  "roleIds",
                                  current.filter((id) => id !== role.id),
                                );
                              }
                            }}
                          />
                          <div>
                            <p className="text-sm font-medium">{role.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {role.code} · {(role.permissions ?? []).length} สิทธิ์
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {formUpdate.formState.errors.roleIds && (
                      <p className="text-xs text-danger">{formUpdate.formState.errors.roleIds.message}</p>
                    )}
                  </FormSection>
                </TabsContent>

                <SheetFooter className="px-0">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" loading={update.isPending}>
                    <Save className="h-4 w-4" />
                    บันทึกการเปลี่ยนแปลง
                  </Button>
                </SheetFooter>
              </form>
            </Tabs>
          ) : (
            <form
              onSubmit={formCreate.handleSubmit(onSubmitCreate as never)}
              className="space-y-6"
              noValidate
            >
              <FormSection title="ข้อมูลบัญชี">
                <FormGrid cols={2}>
                  <TextField
                    label="ชื่อผู้ใช้งาน"
                    required
                    error={formCreate.formState.errors.username?.message}
                    description="ใช้สำหรับเข้าสู่ระบบ"
                    {...formCreate.register("username")}
                  />
                  <SelectField
                    label="สถานะ"
                    required
                    value={formCreate.watch("status")}
                    onValueChange={(v) =>
                      formCreate.setValue("status", v as CreateUserFormValues["status"])
                    }
                    options={[
                      { value: "active", label: "ใช้งาน" },
                      { value: "inactive", label: "ระงับการใช้งาน" },
                      { value: "pending", label: "รอเปิดใช้งาน" },
                    ]}
                  />
                </FormGrid>
                <FormGrid cols={2}>
                  <TextField
                    label="รหัสผ่าน"
                    type="password"
                    required
                    error={formCreate.formState.errors.password?.message}
                    description="อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์ใหญ่และตัวเลข"
                    {...formCreate.register("password")}
                  />
                  <TextField
                    label="ยืนยันรหัสผ่าน"
                    type="password"
                    required
                    error={formCreate.formState.errors.confirmPassword?.message}
                    {...formCreate.register("confirmPassword")}
                  />
                </FormGrid>
              </FormSection>

              <FormSection title="ข้อมูลส่วนตัว">
                <FormGrid cols={2}>
                  <TextField
                    label="ชื่อ"
                    required
                    error={formCreate.formState.errors.firstName?.message}
                    {...formCreate.register("firstName")}
                  />
                  <TextField
                    label="นามสกุล"
                    required
                    error={formCreate.formState.errors.lastName?.message}
                    {...formCreate.register("lastName")}
                  />
                </FormGrid>
                <FormGrid cols={2}>
                  <TextField
                    label="อีเมล"
                    type="email"
                    required
                    error={formCreate.formState.errors.email?.message}
                    {...formCreate.register("email")}
                  />
                  <TextField
                    label="เบอร์โทรศัพท์"
                    type="tel"
                    error={formCreate.formState.errors.phone?.message}
                    {...formCreate.register("phone")}
                  />
                </FormGrid>
              </FormSection>

              <FormSection title="สิทธิ์และแผนก">
                <SelectField
                  label="แผนก"
                  value={formCreate.watch("departmentId") ?? ""}
                  onValueChange={(v) => formCreate.setValue("departmentId", v)}
                  options={[
                    { value: "", label: "ไม่ระบุ" },
                    ...(deptData?.items?.map((d) => ({ value: d.id, label: d.name })) ?? []),
                  ]}
                />
                <div>
                  <label className="text-sm font-medium leading-none">
                    บทบาท <span className="text-danger">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">เลือกอย่างน้อย 1 บทบาท</p>
                  <div className="space-y-2">
                    {rolesData?.items.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-start gap-2 rounded-md border bg-card p-3 cursor-pointer hover:bg-accent/30"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-input text-primary"
                          checked={formCreate.watch("roleIds")?.includes(role.id) ?? false}
                          onChange={(e) => {
                            const current = formCreate.getValues("roleIds");
                            if (e.target.checked) {
                              formCreate.setValue("roleIds", [...current, role.id]);
                            } else {
                              formCreate.setValue(
                                "roleIds",
                                current.filter((id) => id !== role.id),
                              );
                            }
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium">{role.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {role.code} · {(role.permissions ?? []).length} สิทธิ์
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {formCreate.formState.errors.roleIds && (
                    <p className="text-xs text-danger mt-1">
                      {formCreate.formState.errors.roleIds.message}
                    </p>
                  )}
                </div>
              </FormSection>

              <SheetFooter className="px-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" loading={create.isPending}>
                  <Save className="h-4 w-4" />
                  สร้างผู้ใช้งาน
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
