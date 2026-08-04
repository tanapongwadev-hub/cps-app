"use client";

import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import type { Category } from "../api/categories-api";

export function CategoryStatusDialog({ category, onOpenChange, onConfirm, pending }: {
  category: Category | null; onOpenChange: (o: boolean) => void;
  onConfirm: (c: Category) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDeleteDialog
      open={!!category}
      onOpenChange={(o) => !o && onOpenChange(false)}
      itemName={category ? `${category.code} - ${category.nameTh}` : "รายการ"}
      title={category?.isActive ? "ปิดใช้งานหมวดหมู่" : "เปิดใช้งานหมวดหมู่"}
      description={category?.isActive ? "หมวดหมู่นี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "หมวดหมู่นี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmLabel={category?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      loading={pending}
      onConfirm={async () => { if (category) await onConfirm(category); }}
    />
  );
}
