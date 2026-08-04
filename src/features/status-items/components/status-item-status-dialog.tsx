"use client";

import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type { StatusItem } from "../api/status-items-api";

export function StatusItemStatusDialog({ item, onOpenChange, onConfirm, pending }: {
  item: StatusItem | null; onOpenChange: (open: boolean) => void;
  onConfirm: (s: StatusItem) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDialog
      open={!!item}
      onOpenChange={onOpenChange}
      title={item?.isActive ? "ปิดใช้งานสถานะ" : "เปิดใช้งานสถานะ"}
      description={item?.isActive ? "สถานะนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "สถานะนี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmText={item?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      cancelText="ยกเลิก"
      variant="warning"
      loading={pending}
      onConfirm={async () => { if (item) await onConfirm(item); }}
    />
  );
}
