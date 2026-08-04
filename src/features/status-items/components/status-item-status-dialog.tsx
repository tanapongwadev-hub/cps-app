"use client";

import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import type { StatusItem } from "../api/status-items-api";

export function StatusItemStatusDialog({ item, onOpenChange, onConfirm, pending }: {
  item: StatusItem | null; onOpenChange: (o: boolean) => void;
  onConfirm: (s: StatusItem) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDeleteDialog
      open={!!item}
      onOpenChange={(o) => !o && onOpenChange(false)}
      itemName={item ? `${item.code} - ${item.nameTh}` : "รายการ"}
      title={item?.isActive ? "ปิดใช้งานสถานะ" : "เปิดใช้งานสถานะ"}
      description={item?.isActive ? "สถานะนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "สถานะนี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmLabel={item?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      loading={pending}
      onConfirm={async () => { if (item) await onConfirm(item); }}
    />
  );
}
