"use client";

import * as React from "react";
import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import type { Unit } from "../api/units-api";

export interface UnitStatusDialogProps {
  unit: Unit | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (unit: Unit) => Promise<void> | void;
  pending?: boolean;
}

export function UnitStatusDialog({
  unit,
  onOpenChange,
  onConfirm,
  pending,
}: UnitStatusDialogProps) {
  return (
    <ConfirmDeleteDialog
      open={!!unit}
      onOpenChange={(o) => !o && onOpenChange(false)}
      itemName={unit ? `${unit.code} - ${unit.nameTh}` : "รายการ"}
      title={unit?.isActive ? "ปิดใช้งานหน่วยนับ" : "เปิดใช้งานหน่วยนับ"}
      description={
        unit?.isActive
          ? "หน่วยนับนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร) สามารถเปิดใช้งานกลับได้ภายหลัง"
          : "หน่วยนับนี้จะถูกเปิดใช้งานอีกครั้ง"
      }
      confirmLabel={unit?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      loading={pending}
      onConfirm={async () => {
        if (unit) {
          await onConfirm(unit);
        }
      }}
    />
  );
}
