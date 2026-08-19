/**
 * Materials Page
 * 
 * Main page for materials management.
 * Uses Container/Presenter pattern for clean separation of concerns.
 * 
 * Following Vercel Best Practices:
 * - Thin page component
 * - Logic in Container
 * - UI in Presenter
 */

import { MaterialsListContainer } from "@/features/materials/components/materials-list.container";
import { PermissionGuard } from "@/components/ui/permission-guard";

export default function MaterialsPage() {
  return (
    <PermissionGuard
      permission="materials.view"
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <MaterialsListContainer />
    </PermissionGuard>
  );
}
