/**
 * Users Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function UsersLoading() {
  return (
    <PageLoadingSkeleton
      title="ผู้ใช้งาน"
      rowCount={8}
      showFilters={true}
    />
  );
}
