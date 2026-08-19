/**
 * Delivery Types Page
 * 
 * Main page for delivery types management.
 * Uses Container/Presenter pattern.
 */

import { DeliveryTypeListContainer } from "@/features/delivery-types/components/delivery-type-list.container";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { PERMISSIONS } from "@/constants/permissions";

export default function DeliveryTypesPage() {
  return (
    <PermissionGuard
      permission={PERMISSIONS.DELIVERY_TYPE_VIEW}
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
