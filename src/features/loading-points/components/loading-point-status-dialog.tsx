"use client";

import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type { LoadingPoint } from "../api/loading-points-api";

export function LoadingPointStatusDialog({ point, onOpenChange, onConfirm, pending }: {
  point: LoadingPoint | null; onOpenChange: (open: boolean) => void;
  onConfirm: (p: LoadingPoint) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDialog
      open={!!point}
      onOpenChange={onOpenChange}
      title={point?.isActive ? "ปิดใช้งานจุดขนถ่าย" : "เปิดใช้งานจุดขนถ่าย"}
      description={point?.isActive ? "จุดขนถ่ายนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "จุดขนถ่ายนี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmText={point?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      cancelText="ยกเลิก"
      variant="warning"
      loading={pending}
      onConfirm={async () => { if (point) await onConfirm(point); }}
    />
  );
}
