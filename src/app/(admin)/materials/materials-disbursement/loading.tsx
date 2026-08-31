/**
 * Materials Disbursement Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MaterialsDisbursementLoading() {
  return (
    <PageLoadingSkeleton
      title="การจ่ายออกวัสดุ"
      rowCount={8}
      showFilters={true}
    />
  );
}
