/**
 * Loading Points Page
 * 
 * Thin wrapper page that uses LoadingPointListContainer for business logic.
 * Following Container/Presenter pattern from @/lib/patterns.ts
 */

import { PermissionGuard } from "@/components/ui/permission-guard";
import { LoadingPointListContainer } from "@/features/loading-points/components/loading-point-list.container";

export default function LoadingPointsPage() {
  return (
    <PermissionGuard permission="LOADING_POINT_VIEW">
      <LoadingPointListContainer />
    </PermissionGuard>
  );
}
