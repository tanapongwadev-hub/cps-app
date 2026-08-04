"use client";

import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import type { MaterialModel } from "../api/material-models-api";

export function MaterialModelStatusDialog({
  model,
  onOpenChange,
  onConfirm,
  pending,
}: {
  model: MaterialModel | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (m: MaterialModel) => Promise<void> | void;
  pending?: boolean;
}) {
  return (
    <ConfirmDeleteDialog
      open={!!model}
      onOpenChange={(o) => !o && onOpenChange(false)}
      itemName={model ? `${model.code} - ${model.nameTh}` : "รายการ"}
      title={model?.isActive ? "ปิดใช้งานรุ่นวัสดุ" : "เปิดใช้งานรุ่นวัสดุ"}
      description={
        model?.isActive
          ? "รุ่นวัสดุนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)"
          : "รุ่นวัสดุนี้จะถูกเปิดใช้งานอีกครั้ง"
      }
      confirmLabel={model?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      loading={pending}
      onConfirm={async () => {
        if (model) await onConfirm(model);
      }}
    />
  );
}
