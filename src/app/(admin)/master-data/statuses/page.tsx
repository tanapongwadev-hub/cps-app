/**
 * Statuses Page
 * 
 * Thin wrapper page that uses StatusItemListContainer for business logic.
 * Following Container/Presenter pattern from @/lib/patterns.ts
 */

import { PermissionGuard } from "@/components/ui/permission-guard";
import { StatusItemListContainer } from "@/features/status-items/components/status-item-list.container";

export default function StatusesPage() {
  return (
    <PermissionGuard permission="STATUS_ITEM_VIEW">
      <StatusItemListContainer />
    </PermissionGuard>
  );
}
