/**
 * Suppliers Page
 * 
 * Main page for suppliers management.
 * Uses Container/Presenter pattern for clean separation of concerns.
 * 
 * Following Vercel Best Practices:
 * - Thin page component
 * - Logic in Container
 * - UI in Presenter
 */

import { SupplierListContainer } from "@/features/suppliers/components/supplier-list.container";
import { PermissionGuard } from "@/components/ui/permission-guard";

export default function SuppliersPage() {
  return (
    <PermissionGuard
      permission="suppliers.view"
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <SupplierListContainer />
    </PermissionGuard>
  );
}
