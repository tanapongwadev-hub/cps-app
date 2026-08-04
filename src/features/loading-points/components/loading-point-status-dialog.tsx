"use client";

import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import type { LoadingPoint } from "../api/loading-points-api";

export function LoadingPointStatusDialog({ point, onOpenChange, onConfirm, pending }: {
  point: LoadingPoint | null; onOpenChange: (o: boolean) => void;
  onConfirm: (p: LoadingPoint) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDeleteDialog
      open={!!point}
      onOpenChange={(o) => !o && onOpenChange(false)}
      itemName={point ? `${point.code} - ${point.nameTh}` : "รายการ"}
      title={point?.isActive ? "ปิดใช้งานจุดขนถ่าย" : "เปิดใช้งานจุดขนถ่าย"}
      description={point?.isActive ? "จุดขนถ่ายนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "จุดขนถ่ายนี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmLabel={point?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      loading={pending}
      onConfirm={async () => { if (point) await onConfirm(point); }}
    />
  );
}
