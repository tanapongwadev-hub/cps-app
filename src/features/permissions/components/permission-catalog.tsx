"use client";

import * as React from "react";
import { Building2, Pencil, Plus, Search, ShieldCheck, ShieldX, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionMenu } from "@/components/tables/action-menu";
import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import { usePermissions, useDeletePermission } from "@/features/permissions/hooks/use-permissions";
import { PermissionFormDialog } from "@/features/permissions/components/permission-form-dialog";
import { DepartmentPermissionDialog } from "@/features/permissions/components/department-permission-dialog";
import { PermissionDepartmentSummary } from "./permission-department-summary";
import { readActionCode } from "@/utils/permission-utils";
import type { Permission } from "@/features/permissions/types";

function PermissionRow({
  permission,
  onEdit,
  onDelete,
  onManageDepartments,
}: {
  permission: Permission;
  onEdit: () => void;
  onDelete: () => void;
  onManageDepartments: () => void;
}) {
  const sep = permission.code.includes(".") ? "." : "_";
  const moduleName = permission.module ?? permission.code.split(sep)[0] ?? "—";
  // Backend shape: { id, code, nameTh, nameEn } — `action` may be a string
  // (legacy) or an action-ref object. Handle both.
  const actionCode = readActionCode(permission.action) ?? readActionCode(permission.actionRef);
  const action = actionCode ?? permission.code.split(sep).slice(1).join(".") ?? "—";
  const menuName =
    permission.menu?.nameTh ?? permission.menu?.nameEn ?? permission.menu?.code ?? "—";
  const isActive = permission.isActive ?? true;

  return (
    <tr className="hover:bg-muted/30 border-b last:border-0">
      <td className="px-3 py-2 font-mono text-xs">{permission.code}</td>
      <td className="text-muted-foreground px-3 py-2 capitalize">{moduleName}</td>
      <td className="px-3 py-2">
        <Badge variant="outline" className="text-[10px]">
          {action}
        </Badge>
      </td>
      <td className="text-muted-foreground px-3 py-2">{menuName}</td>
      <td className="px-3 py-2">
        <PermissionDepartmentSummary departments={permission.departments ?? []} />
      </td>
      <td className="px-3 py-2 text-center">
        {isActive ? (
          <Badge variant="success" className="gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3" />
            เปิด
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <ShieldX className="h-3 w-3" />
            ปิด
          </Badge>
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <ActionMenu row={permission}
          label={`เมนู ${permission.code}`}
          items={[
            {
              label: "กำหนดแผนก",
              icon: <Building2 className="h-3.5 w-3.5" />,
              onClick: onManageDepartments,
            },
            {
              label: "แก้ไข",
              icon: <Pencil className="h-3.5 w-3.5" />,
              onClick: onEdit,
            },
            {
              label: "ลบ",
              icon: <Trash2 className="h-3.5 w-3.5" />,
              variant: "danger",
              onClick: onDelete,
            },
          ]}
        />
      </td>
    </tr>
  );
}

export function PermissionCatalog() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Permission | null>(null);
  const [departmentPermission, setDepartmentPermission] = React.useState<Permission | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const deleteMutation = useDeletePermission();

  React.useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { data, isLoading, isError, error } = usePermissions({
    page: 1,
    pageSize: 100,
    search: debouncedSearch || undefined,
  });

  const items = data?.items ?? [];
  const totalItems = data?.meta.totalItems ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>แคตตาล็อกสิทธิ์ทั้งหมด</CardTitle>
            <CardDescription>
              สิทธิ์ทั้งหมดที่ backend ลงทะเบียนไว้ ({totalItems} รายการ)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative sm:w-64">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหา code, module..."
                aria-label="ค้นหา code, module"
                className="h-8 pl-8 text-sm"
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              เพิ่มสิทธิ์
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : isError ? (
          <div className="border-danger/30 bg-danger/5 text-danger rounded-md border p-4 text-sm">
            <p className="font-medium">โหลดสิทธิ์ไม่สำเร็จ</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            ไม่พบสิทธิ์ที่ตรงกับ &ldquo;{debouncedSearch}&rdquo;
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground border-b text-xs uppercase">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Code</th>
                  <th className="px-3 py-2 text-left font-medium">Module</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                  <th className="px-3 py-2 text-left font-medium">Menu</th>
                  <th className="px-3 py-2 text-left font-medium">แผนกที่ใช้งานได้</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                  <th className="w-12 px-3 py-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <PermissionRow
                    key={p.id}
                    permission={p}
                    onEdit={() => {
                      setEditing(p);
                      setFormOpen(true);
                    }}
                    onDelete={() => setDeletingId(p.id)}
                    onManageDepartments={() => setDepartmentPermission(p)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <PermissionFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        permission={editing}
      />

      <DepartmentPermissionDialog
        open={!!departmentPermission}
        onOpenChange={(open) => {
          if (!open) setDepartmentPermission(null);
        }}
        permission={departmentPermission}
      />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        itemName="สิทธิ์"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingId) {
            await deleteMutation.mutateAsync(deletingId);
            setDeletingId(null);
          }
        }}
        warning="Role ที่อ้างถึงสิทธิ์นี้อาจเสียการเข้าถึงเมนูที่เกี่ยวข้อง"
      />
    </Card>
  );
}
