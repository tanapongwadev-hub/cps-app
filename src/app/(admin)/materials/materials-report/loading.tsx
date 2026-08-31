/**
 * Materials Stock Report Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MaterialsReportLoading() {
  return (
    <PageLoadingSkeleton
      title="รายงานวัสดุคงคลัง"
      rowCount={8}
      showFilters={true}
    />
  );
}
