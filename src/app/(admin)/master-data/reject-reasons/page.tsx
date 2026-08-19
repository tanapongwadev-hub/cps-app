/**
 * Reject Reasons Page
 * 
 * Thin wrapper page that uses RejectReasonListContainer for business logic.
 * Following Container/Presenter pattern from @/lib/patterns.ts
 */

import { PermissionGuard } from "@/components/ui/permission-guard";
import { RejectReasonListContainer } from "@/features/reject-reasons/components/reject-reason-list.container";

export default function RejectReasonsPage() {
  return (
    <PermissionGuard permission="REJECT_REASON_VIEW">
      <RejectReasonListContainer />
    </PermissionGuard>
  );
}
