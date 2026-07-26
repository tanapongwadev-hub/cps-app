/**
 * Permissions page
 *
 * Two views driven by the real backend:
 *   1) "สิทธิ์ของฉัน" — the effective permissions from the current session
 *   2) "แคตตาล็อกสิทธิ์" — full permission list fetched from GET /permissions
 */
"use client";

import * as React from "react";
import { Key, Search, ShieldCheck, ShieldX, Loader2 } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { usePermission } from "@/hooks/use-permission";
import { usePermissions } from "@/features/permissions/hooks/use-permissions";
import { cn } from "@/utils/cn";
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
          <TabsTrigger value="catalog" className="gap-1.5">
            <Key className="h-3.5 w-3.5" />
            แคตตาล็อกสิทธิ์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4 space-y-4">
          <MyPermissionsCard
            userName={user?.displayName || user?.username}
            isSuperAdmin={superAdmin.isSuperAdmin()}
            permissions={superAdmin.permissions}
          />
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <PermissionCatalog />
        </TabsContent>
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
  // Group by module (split on "." or "_" — backend uses both formats)
  const groups = React.useMemo(() => {
    const map = new Map<string, string[]>();
    for (const code of permissions) {
      if (code === "*" || code === "SUPER_ADMIN") continue;
      const sep = code.includes(".") ? "." : "_";
      const moduleName = code.split(sep)[0] ?? code;
      const list = map.get(moduleName) ?? [];
      list.push(code);
      map.set(moduleName, list);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([moduleName, codes]) => ({ module: moduleName, codes: codes.sort() }));
  }, [permissions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>สิทธิ์ที่ใช้งานได้</CardTitle>
            <CardDescription>
              ผู้ใช้งาน: <span className="font-medium text-foreground">{userName ?? "—"}</span>{" "}
              · ได้รับ {permissions.length} สิทธิ์
            </CardDescription>
          </div>
          {isSuperAdmin ? (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              SUPER ADMIN
            </Badge>
          ) : (
            <Badge variant="secondary">{permissions.length} permissions</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSuperAdmin ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
            <p className="font-medium text-emerald-700 dark:text-emerald-300">
              ผู้ใช้นี้มีสิทธิ์ SUPER ADMIN
            </p>
            <p className="mt-1 text-muted-foreground">
              เข้าถึงทุก endpoint และเมนูในระบบได้โดยไม่ต้องตรวจสอบ permission แต่ละตัว
            </p>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">ไม่มีสิทธิ์ที่ระบุ</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <div key={g.module} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold capitalize">{g.module}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {g.codes.length}
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {g.codes.map((code) => (
                    <li
                      key={code}
                      className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
                    >
                      <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-600" />
                      <span className="truncate">{code}</span>
                    </li>
                  ))}
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
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา code, module..."
              className="h-8 pl-8 text-sm"
            />
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
          <div className="rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <p className="font-medium">โหลดสิทธิ์ไม่สำเร็จ</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            ไม่พบสิทธิ์ที่ตรงกับ &ldquo;{debouncedSearch}&rdquo;
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Code</th>
                  <th className="px-3 py-2 text-left font-medium">Module</th>
                  <th className="px-3 py-2 text-left font-medium">Action</th>
                  <th className="px-3 py-2 text-left font-medium">Menu</th>
                  <th className="px-3 py-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <PermissionRow key={p.id} permission={p} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PermissionRow({ permission }: { permission: Permission }) {
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
    <tr className="border-b last:border-0 hover:bg-muted/30">
      <td className="px-3 py-2 font-mono text-xs">{permission.code}</td>
      <td className="px-3 py-2 capitalize text-muted-foreground">{moduleName}</td>
      <td className="px-3 py-2">
        <Badge variant="outline" className="text-[10px]">
          {action}
        </Badge>
      </td>
      <td className="px-3 py-2 text-muted-foreground">{menuName}</td>
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
    </tr>
  );
}

/** Safely extract a string from a value that may be a string, a {code, ...} ref, or anything else. */
function readActionCode(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "code" in value && typeof value.code === "string") {
    return value.code;
  }
  return null;
}

// Helper to keep imports clean
void Loader2;
void cn;
