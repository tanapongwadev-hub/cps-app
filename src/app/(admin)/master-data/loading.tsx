/**
 * Master Data Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function MasterDataLoading() {
  return (
    <PageLoadingSkeleton
      title="ข้อมูลหลัก"
      description="จัดการข้อมูลหลักของระบบ"
      showFilters={false}
    />
  );
}
