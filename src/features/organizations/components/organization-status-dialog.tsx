"use client";

import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import type { Organization } from "../api/organizations-api";

export function OrganizationStatusDialog({ organization, onOpenChange, onConfirm, pending }: {
  organization: Organization | null; onOpenChange: (o: boolean) => void;
  onConfirm: (o: Organization) => Promise<void> | void; pending?: boolean;
}) {
  return (
    <ConfirmDeleteDialog
      open={!!organization}
      onOpenChange={(o) => !o && onOpenChange(false)}
      itemName={organization ? `${organization.code} - ${organization.nameTh}` : "รายการ"}
      title={organization?.isActive ? "ปิดใช้งานองค์กร" : "เปิดใช้งานองค์กร"}
      description={organization?.isActive ? "องค์กรนี้จะถูกปิดใช้งาน (ไม่ใช่การลบถาวร)" : "องค์กรนี้จะถูกเปิดใช้งานอีกครั้ง"}
      confirmLabel={organization?.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
      loading={pending}
      onConfirm={async () => { if (organization) await onConfirm(organization); }}
    />
  );
}
