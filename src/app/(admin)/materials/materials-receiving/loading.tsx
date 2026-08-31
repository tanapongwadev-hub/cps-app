/**
 * Materials Receiving Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MaterialsReceivingLoading() {
  return (
    <PageLoadingSkeleton
      title="รับเข้าวัตถุดิบ (Materials Receiving)"
      rowCount={8}
      showFilters={true}
    />
  );
}
