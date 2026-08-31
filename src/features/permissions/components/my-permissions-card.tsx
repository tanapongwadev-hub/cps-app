"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/features/permissions/hooks/use-permissions";
import { readActionCode } from "@/utils/permission-utils";
import type { Permission } from "@/features/permissions/types";

export function MyPermissionsCard({
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
