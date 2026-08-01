"use client";

import * as React from "react";
import { Shield, Users, KeyRound, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRole } from "../hooks/use-roles";
import { usePermissions } from "@/features/permissions/hooks/use-permissions";
import {
  labelForAction,
  readActionCode,
} from "@/utils/permission-utils";
import { formatDate } from "@/utils/date";

export function RoleDetailDialog({
  roleId,
  onOpenChange,
}: {
  roleId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const roleQuery = useRole(roleId ?? "");
  const role = roleQuery.data;

  // ดึง permission catalog จาก /permissions เพื่อ enrich actionCodes
  // → แสดงเมนูที่ action นั้นครอบคลุม (เช่น READ → 6 เมนูที่มี READ)
  const permsQuery = usePermissions({ page: 1, pageSize: 200 });
  const allPerms = permsQuery.data?.items ?? [];

  const roleName = role?.nameTh ?? role?.nameEn ?? role?.name ?? "";
  const isActive = role?.isActive ?? role?.status === "active";
  const actionCodes = role?.actionCodes ?? [];
  const permissionCount =
    role?.permissionCount ?? (actionCodes.length || (role?.permissions ?? []).length);

  // group permissions in catalog by action code → map: action -> menu names
  const actionToMenus = React.useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const p of allPerms) {
      const ac = readActionCode(p.action);
      if (!ac) continue;
      const upper = ac.toUpperCase();
      if (!m.has(upper)) m.set(upper, new Set());
      const menuName = p.menu?.nameTh ?? p.menu?.nameEn ?? p.menu?.code;
      if (menuName) m.get(upper)!.add(menuName);
    }
    return m;
  }, [allPerms]);

  return (
    <Dialog open={!!roleId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            รายละเอียด Role
          </DialogTitle>
          <DialogDescription>ข้อมูลบทบาทและสิทธิ์การใช้งาน</DialogDescription>
        </DialogHeader>

        {roleQuery.isLoading && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
            กำลังโหลด...
          </p>
        )}
        {roleQuery.isError && (
          <p className="py-6 text-center text-sm text-danger">ไม่สามารถโหลดข้อมูลได้</p>
        )}

        {role && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{roleName}</p>
                <p className="text-xs text-muted-foreground">{role.code}</p>
              </div>
              <div className="ml-auto flex gap-1.5">
                {role.isSystem && <Badge variant="info">System</Badge>}
                <Badge variant={isActive ? "success" : "muted"}>
                  {isActive ? "ใช้งาน" : "ระงับ"}
                </Badge>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">ชื่อ (EN)</dt>
              <dd className="truncate">{role.nameEn ?? "-"}</dd>
              <dt className="text-muted-foreground">ขอบเขต</dt>
              <dd>{role.scopeType ?? "-"}</dd>
              <dt className="text-muted-foreground">คำอธิบาย</dt>
              <dd className="col-span-1 truncate">{role.description || "-"}</dd>
              <dt className="text-muted-foreground">อัปเดตล่าสุด</dt>
              <dd>{role.updatedAt ? formatDate(role.updatedAt) : "-"}</dd>
            </dl>

            <div className="flex items-center gap-4 rounded-md border p-3 text-sm">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <strong className="tabular-nums">{permissionCount}</strong> สิทธิ์
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <strong className="tabular-nums">{role.userCount ?? 0}</strong> ผู้ใช้งาน
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">สิทธิ์การใช้งาน</p>
              {actionCodes.length > 0 ? (
                permsQuery.isLoading ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    กำลังโหลดเมนูที่ครอบคลุม...
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {actionCodes.map((code) => (
                        <Badge key={code} variant="outline">
                          {labelForAction(code)}
                        </Badge>
                      ))}
                    </div>
                    {/* แสดงชื่อเมนูที่ action นี้ครอบคลุม (จาก /permissions catalog) */}
                    {actionToMenus.size > 0 && (
                      <ul className="space-y-1 rounded-md border bg-muted/30 p-2.5 text-xs">
                        {actionCodes.map((code) => {
                          const upper = code.toUpperCase();
                          const menus = actionToMenus.get(upper);
                          if (!menus || menus.size === 0) return null;
                          return (
                            <li key={code} className="flex flex-col gap-0.5">
                              <span className="font-medium text-foreground/90">
                                {labelForAction(code)} ({menus.size} เมนู)
                              </span>
                              <span className="text-muted-foreground">
                                {[...menus].slice(0, 6).join(" · ")}
                                {menus.size > 6 ? ` · +${menus.size - 6}` : ""}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )
              ) : (role.permissions ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {(role.permissions ?? []).map((code) => (
                    <Badge key={code} variant="outline">
                      {code}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ยังไม่มีสิทธิ์ที่กำหนด</p>
              )}
              {permsQuery.isError && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  โหลดรายชื่อเมนูไม่สำเร็จ — แสดงเฉพาะ action codes
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
