"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Key, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField } from "@/components/forms/form-field";
import {
  useCreatePermission,
  useUpdatePermission,
  usePermissionOptions,
} from "../hooks/use-permissions";
import type { Permission } from "@/types/permission";

const schema = z.object({
  menuId: z.string().min(1, "กรุณาเลือกเมนู"),
  actionId: z.string().min(1, "กรุณาเลือก action"),
  code: z.string().min(2, "กรุณากรอก code").max(100),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function PermissionFormDialog({
  open,
  onOpenChange,
  permission,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission | null;
}) {
  const isEdit = !!permission;
  const create = useCreatePermission();
  const update = useUpdatePermission();
  const optionsQuery = usePermissionOptions(open);

  const menus = optionsQuery.data?.menus ?? [];
  const actions = optionsQuery.data?.actions ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      menuId: "",
      actionId: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        menuId: permission?.menu?.id ? String(permission.menu.id) : "",
        actionId:
          permission?.action && typeof permission.action === "object"
            ? String(permission.action.id)
            : "",
        code: permission?.code ?? "",
        description: permission?.description ?? "",
        isActive: permission?.isActive ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, permission]);

  // Auto-generate code จาก menu + action ตอนสร้างใหม่ (ถ้ายังไม่ได้แก้ code เอง)
  const menuId = form.watch("menuId");
  const actionId = form.watch("actionId");
  React.useEffect(() => {
    if (isEdit || form.formState.dirtyFields.code) return;
    const menu = menus.find((m) => String(m.id) === String(menuId));
    const action = actions.find((a) => String(a.id) === String(actionId));
    if (menu && action) {
      form.setValue("code", `${menu.code}.${action.code.toLowerCase()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, actionId, menus, actions, isEdit]);

  const onSubmit = async (values: FormValues) => {
    if (isEdit && permission) {
      await update.mutateAsync({ id: permission.id, data: values as Partial<Permission> });
    } else {
      await create.mutateAsync(values as Partial<Permission>);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            {isEdit ? `แก้ไขสิทธิ์: ${permission?.code}` : "สร้างสิทธิ์ใหม่"}
          </DialogTitle>
          <DialogDescription>
            กำหนดเมนูและ action ที่สิทธิ์นี้ครอบคลุม
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="เมนู"
              required
              value={form.watch("menuId")}
              onValueChange={(v) => form.setValue("menuId", v, { shouldDirty: true })}
              options={menus.map((m) => ({
                value: String(m.id),
                label: m.nameTh ?? m.nameEn ?? m.code,
              }))}
              placeholder="เลือกเมนู"
              error={form.formState.errors.menuId?.message}
            />
            <SelectField
              label="Action"
              required
              value={form.watch("actionId")}
              onValueChange={(v) => form.setValue("actionId", v, { shouldDirty: true })}
              options={actions.map((a) => ({
                value: String(a.id),
                label: `${a.nameTh ?? a.code} (${a.code})`,
              }))}
              placeholder="เลือก action"
              error={form.formState.errors.actionId?.message}
            />
          </div>

          <TextField
            label="Code"
            required
            placeholder="เช่น user.view"
            error={form.formState.errors.code?.message}
            {...form.register("code")}
          />

          <TextAreaField
            label="คำอธิบาย"
            optional
            rows={2}
            {...form.register("description")}
          />

          <SelectField
            label="สถานะ"
            value={form.watch("isActive") ? "active" : "inactive"}
            onValueChange={(v) => form.setValue("isActive", v === "active")}
            options={[
              { value: "active", label: "เปิดใช้งาน" },
              { value: "inactive", label: "ปิดใช้งาน" },
            ]}
          />

          <DialogFooter className="px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              <Save className="h-4 w-4" />
              {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างสิทธิ์"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
