"use client";

import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type { Material } from "../api/materials-api";

export interface MaterialStatusDialogProps {
  open: boolean;
  material: Material | null;
  action: "deactivate" | "restore";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  pending?: boolean;
}

export function MaterialStatusDialog({
  open,
  material,
  action,
  onOpenChange,
  onConfirm,
  pending = false,
}: MaterialStatusDialogProps) {
  const deactivate = action === "deactivate";
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={deactivate ? "ยืนยันการปิดใช้งานวัสดุ" : "เปิดใช้งานวัสดุอีกครั้ง"}
      confirmText={deactivate ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      cancelText="ยกเลิก"
      variant={deactivate ? "warning" : "info"}
      loading={pending}
      onConfirm={onConfirm}
      description={
        material ? (
          <div className="space-y-3">
            <div className="border-primary bg-muted/40 rounded-md border-l-2 px-3 py-2">
              <code className="text-primary font-mono text-xs font-semibold">{material.code}</code>
              <p className="text-foreground font-medium">{material.name}</p>
            </div>
            <p>
              {deactivate
                ? "รายการนี้จะหยุดแสดงเป็นวัสดุที่ใช้งาน ข้อมูลจะไม่ถูกลบถาวร และสามารถเปิดใช้งานใหม่ได้ภายหลัง"
                : "รายการนี้จะกลับมาใช้งานในรายการวัสดุและพร้อมให้เลือกในกระบวนการที่เกี่ยวข้อง"}
            </p>
          </div>
        ) : undefined
      }
    />
  );
}
