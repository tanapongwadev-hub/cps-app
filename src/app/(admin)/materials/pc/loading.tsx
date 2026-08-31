/**
 * Materials PC Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MaterialsPcLoading() {
  return (
    <PageLoadingSkeleton
      title="จัดการอะไหล่ PC"
      rowCount={8}
      showFilters={true}
    />
  );
}
