"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Save, Search, X, Check, Loader2, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField } from "@/components/forms/form-field";
import { FormSection } from "@/components/forms/form-section";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateRole, useUpdateRole } from "../hooks/use-roles";
import { usePermissions } from "@/features/permissions/hooks/use-permissions";
import { usePermission } from "@/hooks/use-permission";
import {
  actionCodesFromSelectedIds,
  groupPermissionsByMenu,
  labelForAction,
  labelForMenu,
  readActionCode,
  selectedPermissionIdsFromActionCodes,
} from "@/utils/permission-utils";
import type { Role } from "@/types/auth";

const schema = z.object({
  code: z
    .string()
    .min(2, "รหัส Role ต้องมีอย่างน้อย 2 ตัวอักษร")
    .max(50)
    .regex(/^[A-Z0-9_]+$/, "ใช้ได้เฉพาะ A-Z, 0-9, _"),
  name: z.string().min(1, "กรุณากรอกชื่อ Role").max(100),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "pending", "archived"]),
  /** เก็บ permission IDs จาก /permissions (catalog ของ backend) */
  selectedPermissionIds: z.array(z.string()),
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

  // ดึง permission catalog จาก backend จริง (GET /permissions)
  const permsQuery = usePermissions({ page: 1, pageSize: 200 });
  const allPerms = permsQuery.data?.items ?? [];
  // group by menu.code — ใช้เรนเดอร์เมทริกซ์
  const groups = React.useMemo(() => groupPermissionsByMenu(allPerms), [allPerms]);
  const isLoadingCatalog = permsQuery.isLoading;
  const catalogError = permsQuery.error as Error | null;

  const roleName = role?.nameTh ?? role?.nameEn ?? role?.name ?? "";
  const roleStatus = role
    ? (role.isActive ?? role.status === "active")
      ? "active"
      : "inactive"
    : "active";

  // initial permission IDs derived from role.actionCodes (coarse model)
  // Recompute when the catalog or role changes
  const initialSelectedIds = React.useMemo(
    () => selectedPermissionIdsFromActionCodes(allPerms, role?.actionCodes),
    [allPerms, role?.actionCodes],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: role?.code ?? "",
      name: roleName,
      description: role?.description ?? "",
      status: roleStatus,
      selectedPermissionIds: initialSelectedIds,
    },
  });

  // Reset form เมื่อ dialog เปิด หรือ role/catalog เปลี่ยน
  React.useEffect(() => {
    if (open) {
      form.reset({
        code: role?.code ?? "",
        name: roleName,
        description: role?.description ?? "",
        status: roleStatus,
        selectedPermissionIds: initialSelectedIds,
      });
      setSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, role, initialSelectedIds]);

  const selected = form.watch("selectedPermissionIds") ?? [];

  const filteredGroups = React.useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups.filter((g) => {
      const menuLabel = labelForMenu(g.menu).toLowerCase();
      const menuCode = g.menu.code.toLowerCase();
      const permMatch = g.perms.some(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          (readActionCode(p.action) ?? "").toLowerCase().includes(q) ||
          labelForAction(readActionCode(p.action)).toLowerCase().includes(q),
      );
      return menuLabel.includes(q) || menuCode.includes(q) || permMatch;
    });
  }, [search, groups]);

  const togglePermission = (id: string) => {
    const current = form.getValues("selectedPermissionIds") ?? [];
    if (current.includes(id)) {
      form.setValue(
        "selectedPermissionIds",
        current.filter((p) => p !== id),
      );
    } else {
      form.setValue("selectedPermissionIds", [...current, id]);
    }
  };

  const toggleGroup = (menuCode: string) => {
    const group = groups.find((g) => g.menu.code === menuCode);
    if (!group) return;
    const current = form.getValues("selectedPermissionIds") ?? [];
    const ids = group.perms.map((p) => p.id);
    const allSelected = ids.every((id) => current.includes(id));
    if (allSelected) {
      form.setValue(
        "selectedPermissionIds",
        current.filter((id) => !ids.includes(id)),
      );
    } else {
      const merged = new Set(current);
      for (const id of ids) merged.add(id);
      form.setValue("selectedPermissionIds", [...merged]);
    }
  };

  const selectAll = () => {
    form.setValue(
      "selectedPermissionIds",
      allPerms.map((p) => p.id),
    );
  };
  const clearAll = () => {
    form.setValue("selectedPermissionIds", []);
  };

  const selectedActionCodes = React.useMemo(
    () => actionCodesFromSelectedIds(allPerms, selected),
    [allPerms, selected],
  );

  const onSubmit = async (values: FormValues) => {
    const actionCodes = actionCodesFromSelectedIds(allPerms, values.selectedPermissionIds);
    if (isEdit && role) {
      const changes: Partial<Role> & { actionCodes?: string[] } = {};
      if (values.code !== role.code) changes.code = values.code;
      if (values.name !== roleName) changes.name = values.name;
      if ((values.description ?? "") !== (role.description ?? ""))
        changes.description = values.description;
      if (values.status !== roleStatus) changes.status = values.status;
      // เปลี่ยนสิทธิ์เมื่อ union ของ action codes ต่างจากเดิม
      const originalCodes = (role.actionCodes ?? []).map((c) => c.toUpperCase()).sort().join(",");
      const newCodes = [...actionCodes].sort().join(",");
      if (originalCodes !== newCodes) changes.actionCodes = actionCodes;
      await update.mutateAsync({ id: role.id, data: changes });
    } else {
      await create.mutateAsync({
        code: values.code,
        name: values.name,
        nameTh: values.name,
        nameEn: values.name,
        description: values.description,
        isActive: values.status === "active",
        actionCodes,
      } as Partial<Role>);
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
            description={
              isLoadingCatalog
                ? "กำลังโหลดแคตตาล็อกสิทธิ์จากระบบ..."
                : catalogError
                  ? "ไม่สามารถโหลดแคตตาล็อกสิทธิ์จากระบบได้"
                  : `เลือกสิทธิ์ที่ Role นี้จะได้รับ (เลือก ${selected.length} จาก ${allPerms.length} สิทธิ์ · action codes: ${selectedActionCodes.length ? selectedActionCodes.join(", ") : "—"})`
            }
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
                  placeholder="ค้นหาเมนู / action / code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-8"
                  disabled={isLoadingCatalog || !!catalogError}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={lockSystemRole || isLoadingCatalog || !!catalogError}
              >
                <Check className="h-3.5 w-3.5" />
                เลือกทั้งหมด
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
                disabled={lockSystemRole || isLoadingCatalog || !!catalogError}
              >
                <X className="h-3.5 w-3.5" />
                ล้างทั้งหมด
              </Button>
            </div>

            <PermissionMatrix
              isLoading={isLoadingCatalog}
              error={catalogError}
              groups={filteredGroups}
              selected={selected}
              disabled={lockSystemRole || isLoadingCatalog || !!catalogError}
              onTogglePermission={togglePermission}
              onToggleGroup={toggleGroup}
            />

            {form.formState.errors.selectedPermissionIds && (
              <p className="text-xs text-danger">
                {form.formState.errors.selectedPermissionIds.message}
              </p>
            )}
          </FormSection>

          <SheetFooter className="px-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              loading={create.isPending || update.isPending}
              disabled={isLoadingCatalog || !!catalogError}
            >
              <Save className="h-4 w-4" />
              {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้าง Role"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FormGrid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

/**
 * Renders the (menu × action) matrix.
 * Each row = one menu (from `/permissions` catalog).
 * Each column = one action (CREATE / READ / UPDATE / DELETE) the menu has.
 * Cells show the per-(menu, action) permission ID checkbox.
 */
function PermissionMatrix({
  isLoading,
  error,
  groups,
  selected,
  disabled,
  onTogglePermission,
  onToggleGroup,
}: {
  isLoading: boolean;
  error: Error | null;
  groups: ReturnType<typeof groupPermissionsByMenu>;
  selected: string[];
  disabled: boolean;
  onTogglePermission: (id: string) => void;
  onToggleGroup: (menuCode: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        กำลังโหลดสิทธิ์จาก /permissions...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle className="h-4 w-4" />
          โหลดแคตตาล็อกสิทธิ์ไม่สำเร็จ
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
      </div>
    );
  }
  if (!groups.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border bg-muted/30 text-sm text-muted-foreground">
        ไม่มีสิทธิ์ในระบบ
      </div>
    );
  }
  return (
    <ScrollArea className="h-96 rounded-md border">
      <div className="p-3 space-y-3">
        {groups.map((group) => {
          const ids = group.perms.map((p) => p.id);
          const allSelected = ids.every((id) => selected.includes(id));
          const someSelected = ids.some((id) => selected.includes(id));
          return (
            <Card key={group.menu.code} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected || (someSelected && "indeterminate")}
                    onCheckedChange={() => onToggleGroup(group.menu.code)}
                    disabled={disabled}
                    id={`group-${group.menu.code}`}
                  />
                  <label
                    htmlFor={`group-${group.menu.code}`}
                    className="text-sm font-semibold cursor-pointer"
                  >
                    {labelForMenu(group.menu)}
                  </label>
                  <Badge variant="muted" className="text-[10px] font-mono">
                    {group.menu.code}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {ids.filter((id) => selected.includes(id)).length}/{ids.length}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-7 sm:grid-cols-3 lg:grid-cols-4">
                {group.perms.map((p) => {
                  const actionCode = readActionCode(p.action);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.includes(p.id)}
                        onCheckedChange={() => onTogglePermission(p.id)}
                        disabled={disabled}
                        id={`perm-${p.id}`}
                      />
                      <span>{labelForAction(actionCode)}</span>
                    </label>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
