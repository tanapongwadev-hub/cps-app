import { RouteNotFoundState } from "@/components/feedback/route-error-state";

/**
 * Catches unmatched routes and explicit `notFound()` calls under (admin)
 * (e.g. a ticket/product id that doesn't exist) while keeping the sidebar
 * and topnav mounted.
 */
export default function AdminNotFound() {
  return (
    <RouteNotFoundState
      title="ไม่พบหน้าที่คุณต้องการ"
      description="หน้าหรือรายการนี้อาจถูกย้าย ลบ หรือไม่เคยมีอยู่"
    />
  );
}
