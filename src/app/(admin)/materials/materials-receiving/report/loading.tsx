/**
 * Materials Receiving Report Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MaterialsReceivingReportLoading() {
  return (
    <PageLoadingSkeleton
      title="รายงานรับเข้าวัสดุ"
      rowCount={8}
      showFilters={true}
    />
  );
}
