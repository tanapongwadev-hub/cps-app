/**
 * Departments Page
 * 
 * Main page for departments management.
 * Uses Container/Presenter pattern for clean separation of concerns.
 * 
 * Following Vercel Best Practices:
 * - Thin page component
 * - Logic in Container
 */

import { DepartmentListContainer } from "@/features/departments/components/department-list.container";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { PERMISSIONS } from "@/constants/permissions";

export default function DepartmentsPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.DEPARTMENT_VIEW}
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <DepartmentListContainer />
    </PermissionGuard>
  );
}
