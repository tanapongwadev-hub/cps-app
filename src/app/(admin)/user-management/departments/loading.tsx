/**
 * Departments Loading State
 */

import { PageLoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function DepartmentsLoading() {
  return (
    <PageLoadingSkeleton
      title="แผนก"
      rowCount={8}
      showFilters={true}
    />
  );
}
