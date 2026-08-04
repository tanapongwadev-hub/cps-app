"use client";

import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type { Organization } from "../api/organizations-api";

export function OrganizationStatusDialog({ organization, onOpenChange, onConfirm, pending }: {
  organization: Organization | null; onOpenChange: (open: boolean) => void;
  onConfirm: (o: Organization) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDialog
      open={!!organization}
      onOpenChange={onOpenChange}
      title={organization?.isActive ? "ปิดใช้งานองค์กร" : "เปิดใช้งานองค์กร"}
      description={organization?.isActive ? "องค์กรนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "องค์กรนี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmText={organization?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      cancelText="ยกเลิก"
      variant="warning"
      loading={pending}
      onConfirm={async () => { if (organization) await onConfirm(organization); }}
    />
  );
}
