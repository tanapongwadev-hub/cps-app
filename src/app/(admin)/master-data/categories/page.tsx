/**
 * Categories Page
 * 
 * Main page for categories management.
 * Uses Container/Presenter pattern for clean separation of concerns.
 * 
 * Following Vercel Best Practices:
 * - Thin page component
 * - Logic in Container
 * - UI in Presenter
 */

import { CategoryListContainer } from "@/features/categories/components/category-list.container";
import { PermissionGuard } from "@/components/ui/permission-guard";

export default function CategoriesPage() {
  return (
    <PermissionGuard
      permission="categories.view"
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <CategoryListContainer />
    </PermissionGuard>
  );
}
