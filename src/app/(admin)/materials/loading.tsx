/**
 * Materials Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MaterialsLoading() {
  return (
    <PageLoadingSkeleton
      title="จัดการวัสดุ"
      description="รายการวัสดุทั้งหมดในระบบ"
      rowCount={8}
      showFilters={true}
    />
  );
}
