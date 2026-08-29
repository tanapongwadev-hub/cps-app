"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  useFieldArray,
  useForm,
  FormProvider,
  type UseFieldArrayReturn,
  type UseFormReturn,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, User as UserIcon, Save } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/utils/format";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
} from "../schemas/user-schema";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import {
  useCreateUser,
  useUpdateUser,
  useUserAssignments,
} from "../hooks/use-users";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/features/auth/types";
import { EditUserAssignments } from "./edit-user-assignments";
import { UserMenuAccess } from "./user-menu-access";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

// ---------- Minimal shapes we need from lists ----------

interface Dept {
  id: string;
  name?: string;
  nameTh?: string;
  nameEn?: string;
  code?: string;
}

interface RoleOption {
  id: string;
  name?: string;
  nameTh?: string;
  nameEn?: string;
  code: string;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const router = useRouter();
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();
  const assignmentsQuery = useUserAssignments(isEdit ? user?.id ?? null : null);
  const { data: rolesData, isLoading: rolesLoading } = useRoles({ page: 1, pageSize: 100 });
  const { data: deptData, isLoading: deptsLoading } = useDepartments();

  const formCreate = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      telephone: "",
      assignments: [{ departmentId: "", roleId: "", isPrimary: true }],
    },
  });

  const fa = useFieldArray({ control: formCreate.control, name: "assignments" });

  const formUpdate = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      telephone: user?.telephone ?? "",
      assignments: [],
    },
  });

  // Reset form when user changes
  React.useEffect(() => {
    if (isEdit && user && !assignmentsQuery.isLoading) {
      formUpdate.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        telephone: user.telephone ?? "",
        assignments: (assignmentsQuery.data ?? []).map((assignment) => ({
          id: assignment.id,
          departmentId: assignment.departmentId,
          roleId: assignment.roleId,
          roleScopeType:
            assignment.role?.scopeType === "SYSTEM" ||
            assignment.departmentId === null
              ? "SYSTEM"
              : "DEPARTMENT",
        })),
      });
    }
    if (!isEdit) {
      formCreate.reset({
        username: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        email: "",
        telephone: "",
        assignments: [{ departmentId: "", roleId: "", isPrimary: true }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isEdit, open, assignmentsQuery.data, assignmentsQuery.isLoading]);

  const onSubmitCreate = async (values: CreateUserFormValues) => {
    const { confirmPassword: _cp, telephone, assignments, ...rest } = values;
    void _cp;
    const payload = {
      ...rest,
      telephone: telephone && telephone.length > 0 ? telephone : undefined,
      // Filter out rows where user hasn't picked both fields
      assignments: assignments
        .filter((a) => a.departmentId && a.roleId)
        .map((a) => ({
          departmentId: a.departmentId,
          roleId: a.roleId,
          isPrimary: a.isPrimary ?? false,
        })),
    };
    try {
      await create.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      // toast handled
    }
  };

  const onSubmitUpdate = async (values: UpdateUserFormValues) => {
    if (!user) return;
    const { telephone, assignments, ...rest } = values;
    const payload = {
      ...rest,
      telephone: telephone && telephone.length > 0 ? telephone : undefined,
      assignments: assignments.map(({ roleScopeType: _scope, ...assignment }) => {
        void _scope;
        return assignment;
      }),
    };
    try {
      const editingSelf = useAuthStore.getState().user?.id === user.id;
      const updatedUser = await update.mutateAsync({ id: user.id, data: payload });
      onOpenChange(false);
      if (
        editingSelf &&
        updatedUser.permissionVersion !== user.permissionVersion
      ) {
        useAuthStore.getState().logout();
        router.replace("/login");
      }
    } catch {
      // toast handled
    }
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
              ? `แก้ไขข้อมูลของ ${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
              : "กรอกข้อมูลผู้ใช้งานใหม่เพื่อเพิ่มเข้าสู่ระบบ"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          {isEdit && user && (
            <div className="mb-4 flex items-center gap-3 rounded-md border bg-muted/30 p-3">
              <Avatar size="lg">
                <AvatarImage src={user.avatarUrl} alt={user.fullName ?? user.username} />
                <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
              <div className="ml-auto flex gap-1">
                {user.isActive ? (
                  <Badge variant="success">ใช้งาน</Badge>
                ) : (
                  <Badge variant="muted">ระงับ</Badge>
                )}
                {user.isLocked && <Badge variant="warning">ถูกล็อก</Badge>}
              </div>
            </div>
          )}

          {isEdit ? (
            <Tabs defaultValue="general">
              <TabsList className="w-full">
                <TabsTrigger value="general" className="flex-1">ข้อมูลทั่วไป</TabsTrigger>
                <TabsTrigger value="assignments" className="flex-1">แผนก & บทบาท</TabsTrigger>
                <TabsTrigger value="menu-access" className="flex-1">เมนูที่เข้าถึงได้</TabsTrigger>
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
                        error={formUpdate.formState.errors.telephone?.message}
                        {...formUpdate.register("telephone")}
                      />
                    </FormGrid>
                  </FormSection>
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4 mt-0">
                  <FormSection title="Assignments ปัจจุบัน">
                    {assignmentsQuery.isLoading || rolesLoading || deptsLoading ? (
                      <Skeleton className="h-32" />
                    ) : (
                      <EditUserAssignments
                        form={formUpdate}
                        departments={deptData?.items ?? []}
                        roles={rolesData?.items ?? []}
                        disabled={update.isPending}
                      />
                    )}
                  </FormSection>
                </TabsContent>

                <TabsContent value="menu-access" className="mt-0 space-y-4">
                  <FormSection title="สิทธิ์การเข้าถึงเมนู">
                    <UserMenuAccess userId={user.id} />
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
            <FormProvider {...formCreate}>
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
                    <TextField
                      label="เบอร์โทรศัพท์"
                      type="tel"
                      error={formCreate.formState.errors.telephone?.message}
                      {...formCreate.register("telephone")}
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
                  <TextField
                    label="อีเมล"
                    type="email"
                    required
                    error={formCreate.formState.errors.email?.message}
                    {...formCreate.register("email")}
                  />
                </FormSection>

                <FormSection title="แผนก & บทบาท (ต้องระบุอย่างน้อย 1 รายการ)">
                  <CreateAssignmentsField
                    fa={fa}
                    form={formCreate}
                    depts={(deptData?.items ?? []) as Dept[]}
                    deptsLoading={deptsLoading}
                    roles={(rolesData?.items ?? []) as RoleOption[]}
                    rolesLoading={rolesLoading}
                  />
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
            </FormProvider>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- create-mode assignment field array ----------

function CreateAssignmentsField({
  fa,
  form,
  depts,
  deptsLoading,
  roles,
  rolesLoading,
}: {
  fa: UseFieldArrayReturn<CreateUserFormValues, "assignments", "id">;
  form: UseFormReturn<CreateUserFormValues>;
  depts: Dept[];
  deptsLoading: boolean;
  roles: RoleOption[];
  rolesLoading: boolean;
}) {
  if (deptsLoading || rolesLoading) {
    return <Skeleton className="h-24" />;
  }

  return (
    <div className="space-y-2">
      {fa.fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end rounded-md border bg-card p-3"
        >
          <SelectField
            label={index === 0 ? "แผนก" : undefined}
            value={(form.watch(`assignments.${index}.departmentId` as FieldPath<CreateUserFormValues>) as string) ?? ""}
            onValueChange={(v) =>
              form.setValue(
                `assignments.${index}.departmentId` as FieldPath<CreateUserFormValues>,
                v,
              )
            }
            options={[
              { value: "", label: "เลือกแผนก..." },
              ...depts.map((d) => ({
                value: d.id,
                label: d.nameTh || d.name || d.code || d.id,
              })),
            ]}
          />
          <SelectField
            label={index === 0 ? "บทบาท" : undefined}
            value={(form.watch(`assignments.${index}.roleId` as FieldPath<CreateUserFormValues>) as string) ?? ""}
            onValueChange={(v) =>
              form.setValue(
                `assignments.${index}.roleId` as FieldPath<CreateUserFormValues>,
                v,
              )
            }
            options={[
              { value: "", label: "เลือกบทบาท..." },
              ...roles.map((r) => ({
                value: r.id,
                label: r.nameTh || r.nameEn || r.name || r.code,
              })),
            ]}
          />
          <div className="flex items-center gap-1">
            {index === 0 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  fa.append({ departmentId: "", roleId: "", isPrimary: false })
                }
                title="เพิ่มแผนก/บทบาท"
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fa.remove(index)}
                title="ลบ"
                className="text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
      {form.formState.errors.assignments && (
        <p className="text-xs text-danger">
          {(form.formState.errors.assignments as unknown as { message?: string })?.message ??
            "กรุณากรอกข้อมูลให้ครบถ้วน"}
        </p>
      )}
    </div>
  );
}
