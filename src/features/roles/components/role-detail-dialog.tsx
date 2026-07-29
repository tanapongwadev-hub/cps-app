"use client";

import * as React from "react";
import { Shield, Users, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useRole } from "../hooks/use-roles";
import { formatDate } from "@/utils/date";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "สร้าง",
  READ: "อ่าน",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
};

export function RoleDetailDialog({
  roleId,
  onOpenChange,
}: {
  roleId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const roleQuery = useRole(roleId ?? "");
  const role = roleQuery.data;

  const roleName = role?.nameTh ?? role?.nameEn ?? role?.name ?? "";
  const isActive = role?.isActive ?? role?.status === "active";
  const actionCodes = role?.actionCodes ?? [];
  const permissionCount =
    role?.permissionCount ?? (actionCodes.length || (role?.permissions ?? []).length);

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
          <p className="py-6 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
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
                <div className="flex flex-wrap gap-1.5">
                  {actionCodes.map((code) => (
                    <Badge key={code} variant="outline">
                      {ACTION_LABELS[code] ?? code}
                    </Badge>
                  ))}
                </div>
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
