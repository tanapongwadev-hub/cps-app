"use client";

import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type { Category } from "../api/categories-api";

export function CategoryStatusDialog({ category, onOpenChange, onConfirm, pending }: {
  category: Category | null; onOpenChange: (open: boolean) => void;
  onConfirm: (c: Category) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDialog
      open={!!category}
      onOpenChange={onOpenChange}
      title={category?.isActive ? "ปิดใช้งานหมวดหมู่" : "เปิดใช้งานหมวดหมู่"}
      description={category?.isActive ? "หมวดหมู่นี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "หมวดหมู่นี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmText={category?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      cancelText="ยกเลิก"
      variant="warning"
      loading={pending}
      onConfirm={async () => { if (category) await onConfirm(category); }}
    />
  );
}
