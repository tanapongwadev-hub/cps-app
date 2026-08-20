/**
 * Permissions page
 *
 * Two views driven by the real backend:
 *   1) "สิทธิ์ของฉัน" — the effective permissions from the current session
 *   2) "แคตตาล็อกสิทธิ์" — full permission list fetched from GET /permissions
 */
"use client";

import * as React from "react";
import {
  Building2,
  Key,
  Search,
  ShieldCheck,
  ShieldX,
  Loader2,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ActionMenu } from "@/components/tables/action-menu";
import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { usePermission } from "@/hooks/use-permission";
import { usePermissions, useDeletePermission } from "@/features/permissions/hooks/use-permissions";
import { PermissionFormDialog } from "@/features/permissions/components/permission-form-dialog";
import { DepartmentPermissionDialog } from "@/features/permissions/components/department-permission-dialog";
import { PermissionDepartmentSummary } from "./permission-department-summary";
import { cn } from "@/utils/cn";
import { readActionCode } from "@/utils/permission-utils";
import type { Permission } from "@/types/permission";

export default function PermissionsPage() {
  const user = useAuthStore((s) => s.user);
  const superAdmin = usePermission();

  return (
    <PageContainer>
      <PageHeader
        title="จัดการสิทธิ์"
        description="ดูสิทธิ์ที่ใช้งานได้ และแคตตาล็อกสิทธิ์ทั้งหมดในระบบ"
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/dashboard" },
          { label: "ระบบ" },
          { label: "จัดการสิทธิ์" },
        ]}
      />

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            สิทธิ์ของฉัน ({superAdmin.permissions.length})
          </TabsTrigger>
          {superAdmin.isSuperAdmin() && (
            <TabsTrigger value="catalog" className="gap-1.5">
              <Key className="h-3.5 w-3.5" />
              แคตตาล็อกสิทธิ์
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mine" className="mt-4 space-y-4">
          <MyPermissionsCard
            userName={user?.displayName || user?.username}
            isSuperAdmin={superAdmin.isSuperAdmin()}
            permissions={superAdmin.permissions}
          />
        </TabsContent>

        {superAdmin.isSuperAdmin() && (
          <TabsContent value="catalog" className="mt-4">
            <PermissionCatalog />
          </TabsContent>
        )}
      </Tabs>
    </PageContainer>
  );
}

function MyPermissionsCard({
  userName,
  isSuperAdmin,
  permissions,
}: {
  userName?: string;
  isSuperAdmin: boolean;
  permissions: string[];
}) {
  // The session's `permissions[]` is just a flat list of codes — for the
  // "My Permissions" tab we want full details (action, menu, departments).
  // Fetch the catalog from /permissions and filter to items the user
  // actually has, so we can show the same rich metadata the catalog tab
  // shows.
  const { data, isLoading, isError, error } = usePermissions({
    page: 1,
    pageSize: 1000,
  });
  const allItems = data?.items ?? [];

  const myItems = React.useMemo(() => {
    // SUPER_ADMIN has the synthetic "*" / "SUPER_ADMIN" code — show all
    // catalog items.
    const codeSet = new Set(permissions);
    const all = isSuperAdmin ? allItems : allItems.filter((p) => codeSet.has(p.code));
    return [...all].sort((a, b) => a.code.localeCompare(b.code));
  }, [allItems, permissions, isSuperAdmin]);

  // Group by module (split on "." or "_" — backend uses both formats)
  const groups = React.useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of myItems) {
      const sep = p.code.includes(".") ? "." : "_";
      const moduleName = p.module ?? p.code.split(sep)[0] ?? p.code;
      const list = map.get(moduleName) ?? [];
      list.push(p);
      map.set(moduleName, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([moduleName, items]) => ({ module: moduleName, items }));
  }, [myItems]);

  const totalCount = isSuperAdmin ? allItems.length : permissions.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>สิทธิ์ที่ใช้งานได้</CardTitle>
            <CardDescription>
              ผู้ใช้งาน: <span className="text-foreground font-medium">{userName ?? "—"}</span> ·
              ได้รับ {totalCount} สิทธิ์
              <span className="text-muted-foreground/80 ml-1 text-[10px]">
                (จาก GET /permissions)
              </span>
            </CardDescription>
          </div>
          {isSuperAdmin ? (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              SUPER ADMIN
            </Badge>
          ) : (
            <Badge variant="secondary">{totalCount} permissions</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : isError ? (
          <div className="border-danger/30 bg-danger/5 text-danger rounded-md border p-4 text-sm">
            <p className="font-medium">โหลดสิทธิ์ไม่สำเร็จ</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : isSuperAdmin ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-300">
              ผู้ใช้นี้มีสิทธิ์ SUPER ADMIN
            </p>
            <p className="text-muted-foreground mt-1">
              เข้าถึงทุก endpoint และเมนูในระบบได้โดยไม่ต้องตรวจสอบ permission แต่ละตัว —
              แสดงสิทธิ์ทั้งหมด {allItems.length} รายการจากแคตตาล็อก
            </p>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            ไม่มีสิทธิ์ที่ระบุในระบบ (session permissions ไม่ตรงกับแคตตาล็อก)
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.module} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold capitalize">{g.module}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {g.items.length}
                  </Badge>
                </div>
                <ul className="space-y-1.5">
                  {g.items.map((p) => {
                    const actionCode =
                      readActionCode(p.action) ??
                      readActionCode((p as { actionRef?: unknown }).actionRef) ??
                      p.code.split(/[._]/).slice(1).join(".");
                    const menuName = p.menu?.nameTh ?? p.menu?.nameEn ?? p.menu?.code ?? "—";
                    return (
                      <li
                        key={p.id}
                        className="hover:bg-muted/50 flex flex-col gap-0.5 rounded-sm px-1.5 py-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                          <span className="text-foreground/80 truncate font-mono text-xs">
                            {p.code}
                          </span>
                        </div>
                        <div className="text-muted-foreground ml-4 flex flex-wrap items-center gap-1 text-[10px]">
                          <Badge variant="outline" className="px-1 py-0 text-[10px]">
                            {actionCode}
                          </Badge>
                          <span className="truncate">{menuName}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PermissionCatalog() {
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
        <ActionMenu
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

// Helper to keep imports clean
void Loader2;
void cn;
