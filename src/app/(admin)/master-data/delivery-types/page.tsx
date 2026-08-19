/**
 * Delivery Types Page
 * 
 * Main page for delivery types management.
 * Uses Container/Presenter pattern.
 */

import { DeliveryTypeListContainer } from "@/features/delivery-types/components/delivery-type-list.container";
import { PermissionGuard } from "@/components/ui/permission-guard";

export default function DeliveryTypesPage() {
  return (
    <PermissionGuard
      permission="delivery-types.view"
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <DeliveryTypeListContainer />
    </PermissionGuard>
  );
}
