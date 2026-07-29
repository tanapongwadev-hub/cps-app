"use client";

import * as React from "react";
import {
  useFieldArray,
  useForm,
  FormProvider,
  type UseFieldArrayReturn,
  type UseFormReturn,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  User as UserIcon,
  Save,
  Building2,
  ShieldCheck,
} from "lucide-react";
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
  addUserAssignmentSchema,
  type CreateUserFormValues,
  type UpdateUserFormValues,
  type AddUserAssignmentValues,
} from "../schemas/user-schema";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { useDepartments } from "@/features/users/hooks/use-departments";
import {
  useCreateUser,
  useUpdateUser,
  useUserAssignments,
  useAddUserAssignment,
} from "../hooks/use-users";
import { showToast } from "@/lib/toast";
import type { User } from "@/types/auth";

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
  const isEdit = !!user;
  const create = useCreateUser();
  const update = useUpdateUser();
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
    },
  });

  // Reset form when user changes
  React.useEffect(() => {
    if (isEdit && user) {
      formUpdate.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        telephone: user.telephone ?? "",
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
  }, [user, isEdit, open]);

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
    const { telephone, ...rest } = values;
    const payload = {
      ...rest,
      telephone: telephone && telephone.length > 0 ? telephone : undefined,
    };
    try {
      await update.mutateAsync({ id: user.id, data: payload });
      onOpenChange(false);
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
                  <AssignmentsTab userId={user.id} />
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

// ---------- update-mode assignments tab ----------

function AssignmentsTab({ userId }: { userId: string }) {
  const { data: assignments, isLoading } = useUserAssignments(userId);
  const { data: deptData } = useDepartments();
  const { data: rolesData } = useRoles({ page: 1, pageSize: 100 });
  const addAssignment = useAddUserAssignment();
  const [draft, setDraft] = React.useState<AddUserAssignmentValues>({
    departmentId: "",
    roleId: "",
  });

  const handleAdd = async () => {
    const parsed = addUserAssignmentSchema.safeParse(draft);
    if (!parsed.success) {
      showToast.error("ข้อมูลไม่ครบ", parsed.error.issues[0]?.message ?? "");
      return;
    }
    try {
      await addAssignment.mutateAsync({ userId, payload: parsed.data });
      setDraft({ departmentId: "", roleId: "" });
    } catch {
      // toast handled
    }
  };

  return (
    <div className="space-y-4">
      <FormSection title="Assignments ปัจจุบัน">
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : (assignments ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">ยังไม่มี assignment</p>
        ) : (
          <div className="space-y-2">
            {(assignments ?? []).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-md border bg-card p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium">
                    {a.department?.nameTh ?? a.department?.name ?? a.departmentId}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">
                    {a.role?.nameTh ?? a.role?.nameEn ?? a.role?.name ?? a.roleId}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.isActive ? (
                    <Badge variant="success" className="text-[10px]">ใช้งาน</Badge>
                  ) : (
                    <Badge variant="muted" className="text-[10px]">ระงับ</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title="เพิ่ม Assignment">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <SelectField
            label="แผนก"
            value={draft.departmentId}
            onValueChange={(v) => setDraft({ ...draft, departmentId: v })}
            options={[
              { value: "", label: "เลือกแผนก..." },
              ...(deptData?.items ?? []).map((d) => ({
                value: d.id,
                label: d.nameTh || d.name || d.code || d.id,
              })),
            ]}
          />
          <SelectField
            label="บทบาท"
            value={draft.roleId}
            onValueChange={(v) => setDraft({ ...draft, roleId: v })}
            options={[
              { value: "", label: "เลือกบทบาท..." },
              ...(rolesData?.items ?? []).map((r) => ({
                value: r.id,
                label: r.nameTh || r.nameEn || r.name || r.code,
              })),
            ]}
          />
          <Button type="button" onClick={handleAdd} loading={addAssignment.isPending}>
            <Plus className="h-4 w-4" />
            เพิ่ม
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          การลบ assignment ทำได้โดยลบผู้ใช้แล้วสร้างใหม่ (API ยังไม่รองรับ DELETE /users/:id/assignments/:id)
        </p>
      </FormSection>
    </div>
  );
}
