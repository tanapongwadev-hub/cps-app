/**
 * Dashboard Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function DashboardLoading() {
  return (
    <PageLoadingSkeleton
      title="แดชบอร์ด"
      description="ภาพรวมข้อมูลและสถิติระบบ"
      rowCount={4}
      showFilters={false}
    />
  );
}
