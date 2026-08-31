/**
 * Materials Disbursement Report Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MaterialsDisbursementReportLoading() {
  return (
    <PageLoadingSkeleton
      title="รายงานจ่ายออกวัสดุ"
      rowCount={8}
      showFilters={true}
    />
  );
}
