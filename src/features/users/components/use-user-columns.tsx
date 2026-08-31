"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2, KeyRound, ShieldOff, ShieldCheck, Eye, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ActionMenu } from "@/components/tables/action-menu";
import type { useConfirmDialog } from "@/components/forms/confirm-dialog";
import type {
  useUpdateUserStatus,
  useResetPassword,
} from "@/features/users/hooks/use-users";
import type { useRevokeAllSessionsForUser } from "@/features/sessions/hooks/use-sessions";
import type { User } from "@/features/auth/types";
import { formatRelative } from "@/utils/date";
import { getInitials } from "@/utils/format";
import { toUiStatus, statusVariants, statusLabels } from "./user-status";

export function useUserColumns({
  onView,
  onEdit,
  onDelete,
  statusMutation,
  resetMutation,
  revokeAllSessions,
  confirm,
}: {
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  statusMutation: ReturnType<typeof useUpdateUserStatus>;
  resetMutation: ReturnType<typeof useResetPassword>;
  revokeAllSessions: ReturnType<typeof useRevokeAllSessionsForUser>;
  confirm: ReturnType<typeof useConfirmDialog>;
}): ColumnDef<User>[] {
  return React.useMemo(
    () => [
      {
        id: "user",
        header: "ผู้ใช้งาน",
        size: 260,
        cell: ({ row }) => {
          const u = row.original;
          const fullName = `${u.firstName} ${u.lastName}`.trim();
          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={u.avatarUrl} alt={fullName} />
                <AvatarFallback>{getInitials(u.firstName, u.lastName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onView(u);
                  }}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {fullName || u.username}
                </Link>
                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "email",
        header: "อีเมล",
        accessorKey: "email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        id: "telephone",
        header: "เบอร์โทร",
        cell: ({ row }) =>
          row.original.telephone ? (
            <span className="text-sm tabular-nums">{row.original.telephone}</span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: "status",
        header: "สถานะ",
        cell: ({ row }) => {
          const s = toUiStatus(row.original);
          return (
            <div className="flex items-center gap-1">
              <Badge variant={statusVariants[s]}>{statusLabels[s]}</Badge>
              {row.original.isLocked && (
                <Badge variant="warning" className="text-[10px]">ล็อก</Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "lastLogin",
        header: "เข้าสู่ระบบล่าสุด",
        cell: ({ row }) =>
          row.original.lastLoginAt ? (
            <span className="text-xs text-muted-foreground">
              {formatRelative(row.original.lastLoginAt)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const u = row.original;
          const uiStatus = toUiStatus(u);
          return (
            <ActionMenu row={u}
              label={`เมนู ${u.firstName} ${u.lastName}`}
              items={[
                {
                  label: "ดูรายละเอียด",
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onClick: () => onView(u),
                },
                {
                  label: "แก้ไข",
                  icon: <Pencil className="h-3.5 w-3.5" />,
                  onClick: () => onEdit(u),
                },
                {
                  label: uiStatus === "active" ? "ระงับการใช้งาน" : "เปิดใช้งาน",
                  icon:
                    uiStatus === "active" ? (
                      <ShieldOff className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ),
                  onClick: () => {
                    // Real backend uses {isActive: boolean} — send the opposite
                    // of the current status.
                    statusMutation.mutate({
                      id: u.id,
                      isActive: uiStatus !== "active",
                    });
                  },
                },
                {
                  label: "รีเซ็ตรหัสผ่าน",
                  icon: <KeyRound className="h-3.5 w-3.5" />,
                  onClick: () => {
                    confirm.open({
                      title: `รีเซ็ตรหัสผ่านของ ${u.firstName} ${u.lastName}?`,
                      description: "ระบบจะส่งรหัสผ่านใหม่ไปยังอีเมลของผู้ใช้งาน",
                      variant: "warning",
                      confirmText: "ยืนยันรีเซ็ต",
                      onConfirm: async () => {
                        await resetMutation.mutateAsync(u.id);
                      },
                    });
                  },
                },
                {
                  label: "บังคับออกจากระบบทั้งหมด",
                  icon: <LogOut className="h-3.5 w-3.5" />,
                  onClick: () => {
                    confirm.open({
                      title: `บังคับ ${u.firstName} ${u.lastName} ออกจากระบบทุกอุปกรณ์?`,
                      description: (
                        <div className="space-y-1">
                          <p>ทุกเซสชันที่ login อยู่จะถูกยกเลิกทันที</p>
                          <p className="text-xs text-muted-foreground">
                            ผู้ใช้จะต้อง login ใหม่ทุกอุปกรณ์
                          </p>
                        </div>
                      ),
                      variant: "danger",
                      confirmText: "ยืนยันบังคับออก",
                      onConfirm: async () => {
                        await revokeAllSessions.mutateAsync(u.id);
                      },
                    });
                  },
                  disabled: !u.isActive || revokeAllSessions.isPending,
                },
                {
                  label: "ลบ",
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  variant: "danger",
                  onClick: () => onDelete(u.id),
                },
              ]}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusMutation, resetMutation, revokeAllSessions],
  );
}
