/**
 * Sessions Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function SessionsLoading() {
  return (
    <PageLoadingSkeleton
      title="เซสชันผู้ใช้"
      description="ดูและจัดการเซสชันที่กำลังใช้งาน"
      rowCount={6}
      showFilters={true}
    />
  );
}
