"use client";

import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type { DeliveryType } from "../api/delivery-types-api";

export function DeliveryTypeStatusDialog({
  type,
  onOpenChange,
  onConfirm,
  pending,
}: {
  type: DeliveryType | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (t: DeliveryType) => Promise<void> | void;
  pending?: boolean;
}) {
  return (
    <ConfirmDialog
      open={!!type}
      onOpenChange={onOpenChange}
      title={type?.isActive ? "ปิดใช้งานประเภทการจัดส่ง" : "เปิดใช้งานประเภทการจัดส่ง"}
      description={
        type?.isActive
          ? "ประเภทการจัดส่งนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)"
          : "ประเภทการจัดส่งนี้จะถูกเปิดใช้งานอีกครั้ง"
      }
      confirmText={type?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      cancelText="ยกเลิก"
      variant="warning"
      loading={pending}
      onConfirm={async () => {
        if (type) await onConfirm(type);
      }}
    />
  );
}
