/**
 * Roles Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function RolesLoading() {
  return (
    <PageLoadingSkeleton
      title="บทบาท (Roles)"
      rowCount={8}
      showFilters={true}
    />
  );
}
