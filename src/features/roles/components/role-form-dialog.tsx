"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Save, Search, X, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { PERMISSION_GROUPS } from "@/constants/permissions";
import { useCreateRole, useUpdateRole } from "../hooks/use-roles";
import { usePermission } from "@/hooks/use-permission";
import { showToast } from "@/lib/toast";
import type { Role } from "@/types/auth";

/** map action code ของ backend กลับเป็น permission codes ของฟอร์ม (เช็คทุก module ที่มี action นั้น) */
const ACTION_TO_PERMISSION_KEY: Record<string, string> = {
  READ: "view",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
};

function permissionsFromActionCodes(actionCodes?: string[]): string[] {
  if (!actionCodes?.length) return [];
  const keys = new Set(
    actionCodes.map((c) => ACTION_TO_PERMISSION_KEY[c]).filter(Boolean),
  );
  return PERMISSION_GROUPS.flatMap((g) =>
    g.permissions.filter((p) => keys.has(p.key)).map((p) => p.code),
  );
}

const schema = z.object({
  code: z
    .string()
    .min(2, "รหัส Role ต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "ใช้ได้เฉพาะ A-Z, 0-9, _"),
  name: z.string().min(1, "กรุณากรอกชื่อ Role").max(100),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "pending", "archived"]),
  permissions: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}) {
  const isEdit = !!role;
  const create = useCreateRole();
  const update = useUpdateRole();
  const { isSuperAdmin } = usePermission();
  // SUPER_ADMIN มี full access — แก้ไข System Role ได้ ไม่ถูก lock
  const lockSystemRole = isEdit && !!role?.isSystem && !isSuperAdmin();
  const [search, setSearch] = React.useState("");

  const roleName = role?.nameTh ?? role?.nameEn ?? role?.name ?? "";
  const roleStatus = role
    ? (role.isActive ?? role.status === "active")
      ? "active"
      : "inactive"
    : "active";
  const rolePermissions =
    role?.permissions?.length
      ? role.permissions
      : permissionsFromActionCodes(role?.actionCodes);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: role?.code ?? "",
      name: roleName,
      description: role?.description ?? "",
      status: roleStatus,
      permissions: rolePermissions,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        code: role?.code ?? "",
        name: roleName,
        description: role?.description ?? "",
        status: roleStatus,
        permissions: rolePermissions,
      });
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role]);

  const permissions = form.watch("permissions") ?? [];

  const filteredGroups = React.useMemo(() => {
    if (!search.trim()) return PERMISSION_GROUPS;
    const q = search.toLowerCase();
    return PERMISSION_GROUPS.filter(
      (g) =>
        g.module.toLowerCase().includes(q) ||
        g.label.toLowerCase().includes(q) ||
        g.permissions.some((p) => p.label.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
    );
  }, [search]);

  const togglePermission = (code: string) => {
    const current = form.getValues("permissions") ?? [];
    if (current.includes(code)) {
      form.setValue(
        "permissions",
        current.filter((p) => p !== code),
      );
    } else {
      form.setValue("permissions", [...current, code]);
    }
  };

  const toggleGroup = (module: string) => {
    const group = PERMISSION_GROUPS.find((g) => g.module === module);
    if (!group) return;
    const current = form.getValues("permissions") ?? [];
    const allSelected = group.permissions.every((p) => current.includes(p.code));
    if (allSelected) {
      form.setValue(
        "permissions",
        current.filter((p) => !group.permissions.some((gp) => gp.code === p)),
      );
    } else {
      const merged = [...current];
      for (const p of group.permissions) {
        if (!merged.includes(p.code)) merged.push(p.code);
      }
      form.setValue("permissions", merged);
    }
  };

  const selectAll = () => {
    const all = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.code));
    form.setValue("permissions", all);
  };
  const clearAll = () => {
    form.setValue("permissions", []);
  };

  const onSubmit = async (values: FormValues) => {
    if (isEdit && role) {
      // ส่งเฉพาะ field ที่เปลี่ยนจริง — กัน validation error จาก field ที่ backend ไม่รับ
      const changes: Partial<Role> = {};
      if (values.code !== role.code) changes.code = values.code;
      if (values.name !== roleName) changes.name = values.name;
      if ((values.description ?? "") !== (role.description ?? ""))
        changes.description = values.description;
      if (values.status !== roleStatus) changes.status = values.status;
      changes.permissions = values.permissions;
      await update.mutateAsync({ id: role.id, data: changes });
    } else {
      await create.mutateAsync(values as Partial<Role>);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="full" className="w-full sm:max-w-3xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {isEdit ? `แก้ไข Role: ${roleName}` : "สร้าง Role ใหม่"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? "แก้ไขข้อมูล Role และกำหนดสิทธิ์การใช้งาน"
              : "สร้าง Role ใหม่และกำหนดสิทธิ์การใช้งาน"}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit as never)}
          className="mt-6 flex-1 overflow-y-auto pr-1 space-y-6"
          noValidate
        >
          <FormSection title="ข้อมูลทั่วไป">
            <FormGrid2>
              <TextField
                label="รหัส Role"
                required
                description="ใช้ตัวพิมพ์ใหญ่และ _ เท่านั้น"
                error={form.formState.errors.code?.message}
                disabled={lockSystemRole}
                {...form.register("code")}
              />
              <TextField
                label="ชื่อ Role"
                required
                error={form.formState.errors.name?.message}
                {...form.register("name")}
              />
            </FormGrid2>
            <TextAreaField
              label="คำอธิบาย"
              optional
              rows={2}
              {...form.register("description")}
            />
            <SelectField
              label="สถานะ"
              value={form.watch("status")}
              onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
              options={[
                { value: "active", label: "ใช้งาน" },
                { value: "inactive", label: "ระงับการใช้งาน" },
              ]}
            />
          </FormSection>

          <FormSection
            title="สิทธิ์การใช้งาน"
            description={`เลือกสิทธิ์ที่ Role นี้จะได้รับ (เลือกแล้ว ${permissions.length} สิทธิ์)`}
          >
            {lockSystemRole && (
              <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                ⚠️ นี่คือ System Role ไม่สามารถแก้ไขสิทธิ์ได้
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาสิทธิ์..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={lockSystemRole}
              >
                <Check className="h-3.5 w-3.5" />
                เลือกทั้งหมด
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={lockSystemRole}
              >
                <X className="h-3.5 w-3.5" />
                ล้างทั้งหมด
              </Button>
            </div>

            <ScrollArea className="h-96 rounded-md border">
              <div className="p-3 space-y-3">
                {filteredGroups.map((group) => {
                  const allSelected = group.permissions.every((p) => permissions.includes(p.code));
                  const someSelected = group.permissions.some((p) => permissions.includes(p.code));
                  return (
                    <Card key={group.module} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={allSelected || (someSelected && "indeterminate")}
                            onCheckedChange={() => toggleGroup(group.module)}
                            disabled={lockSystemRole}
                            id={`group-${group.module}`}
                          />
                          <label
                            htmlFor={`group-${group.module}`}
                            className="text-sm font-semibold cursor-pointer"
                          >
                            {group.label}
                          </label>
                          <Badge variant="muted" className="text-[10px]">
                            {group.permissions.length} สิทธิ์
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-7 sm:grid-cols-3 lg:grid-cols-4">
                        {group.permissions.map((p) => (
                          <label
                            key={p.code}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={permissions.includes(p.code)}
                              onCheckedChange={() => togglePermission(p.code)}
                              disabled={lockSystemRole}
                              id={p.code}
                            />
                            <span>{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>

            {form.formState.errors.permissions && (
              <p className="text-xs text-danger">{form.formState.errors.permissions.message}</p>
            )}
          </FormSection>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              <Save className="h-4 w-4" />
              {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้าง Role"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );

  void CheckboxField;
  void FormGrid2;
}

function FormGrid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
