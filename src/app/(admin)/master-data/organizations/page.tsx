/**
 * Organizations Page
 * 
 * Thin wrapper page that uses OrganizationListContainer for business logic.
 * Following Container/Presenter pattern from @/lib/patterns.ts
 */

import { PermissionGuard } from "@/components/ui/permission-guard";
import { OrganizationListContainer } from "@/features/organizations/components/organization-list.container";

export default function OrganizationsPage() {
  return (
    <PermissionGuard permission="ORGANIZATION_VIEW">
      <OrganizationListContainer />
    </PermissionGuard>
  );
}
