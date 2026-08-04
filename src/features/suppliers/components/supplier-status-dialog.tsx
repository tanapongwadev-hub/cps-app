"use client";

import * as React from "react";
import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import type { Supplier } from "../api/suppliers-api";

export interface SupplierStatusDialogProps {
  supplier: Supplier | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (supplier: Supplier) => Promise<void> | void;
  pending?: boolean;
}

export function SupplierStatusDialog({
  supplier,
  onOpenChange,
  onConfirm,
  pending,
}: SupplierStatusDialogProps) {
  return (
    <ConfirmDeleteDialog
      open={!!supplier}
      onOpenChange={(o) => !o && onOpenChange(false)}
      itemName={supplier ? `${supplier.code} - ${supplier.nameTh}` : "รายการ"}
      title={supplier?.isActive ? "ปิดใช้งานผู้จัดจำหน่าย" : "เปิดใช้งานผู้จัดจำหน่าย"}
      description={
        supplier?.isActive
          ? "ผู้จัดจำหน่ายนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร) สามารถเปิดใช้งานกลับได้ภายหลัง"
          : "ผู้จัดจำหน่ายนี้จะถูกเปิดใช้งานอีกครั้ง"
      }
      confirmLabel={supplier?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      loading={pending}
      onConfirm={async () => {
        if (supplier) {
          await onConfirm(supplier);
        }
      }}
    />
  );
}
