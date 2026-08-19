/**
 * Units Page
 * 
 * Main page for units management.
 * Uses Container/Presenter pattern for clean separation of concerns.
 * 
 * Following Vercel Best Practices:
 * - Thin page component
 * - Logic in Container
 * - UI in Presenter
 */

import { UnitListContainer } from "@/features/units/components/unit-list.container";
import { PermissionGuard } from "@/components/ui/permission-guard";

export default function UnitsPage() {
  return (
    <PermissionGuard
      permission="units.view"
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <UnitListContainer />
    </PermissionGuard>
  );
}
