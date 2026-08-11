"use client";

import * as React from "react";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type { RejectReason } from "../api/reject-reasons-api";

export interface RejectReasonStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: RejectReason | null;
  onConfirm: () => void;
  pending?: boolean;
}

export function RejectReasonStatusDialog({
  open,
  onOpenChange,
  reason,
  onConfirm,
  pending,
}: RejectReasonStatusDialogProps) {
  if (!reason) return null;

  const isDeactivating = reason.isActive;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isDeactivating ? "ปิดใช้งานเหตุผลการปฏิเสธ" : "เปิดใช้งานเหตุผลการปฏิเสธ"}
      description={
        isDeactivating
          ? `ต้องการปิดใช้งาน "${reason.nameTh}" หรือไม่?`
          : `ต้องการเปิดใช้งาน "${reason.nameTh}" หรือไม่?`
      }
      confirmText={isDeactivating ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      variant={isDeactivating ? "danger" : "info"}
      loading={pending}
      onConfirm={onConfirm}
    />
  );
}
