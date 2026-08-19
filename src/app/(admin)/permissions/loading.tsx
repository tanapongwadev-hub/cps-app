/**
 * Permissions Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function PermissionsLoading() {
  return (
    <PageLoadingSkeleton
      title="สิทธิ์การใช้งาน"
      description="จัดการสิทธิ์และการเข้าถึงของผู้ใช้"
      rowCount={5}
      showFilters={true}
    />
  );
}
