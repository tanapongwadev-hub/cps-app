/**
 * Loading Skeleton Component
 * 
 * A reusable loading skeleton for route-level loading states.
 * Uses CSS animation for smooth loading indication.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Props for PageLoadingSkeleton
 */
export interface PageLoadingSkeletonProps {
  /** Page title to display in header */
  title?: string;
  /** Description text in header */
  description?: string;
  /** Number of table rows to show (default: 5) */
  rowCount?: number;
  /** Show filter/search bar (default: true) */
  showFilters?: boolean;
  /** Show action buttons (default: true) */
  showActions?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Page-level loading skeleton with header and table placeholders
 */
export function PageLoadingSkeleton({
  title = "กำลังโหลด...",
  description,
  rowCount = 5,
  showFilters = true,
  showActions = true,
  className,
}: PageLoadingSkeletonProps) {
  return (
    <div className={className}>
      <PageHeader title={title} description={description}>
        {showActions && (
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        )}
      </PageHeader>

      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      <div className="rounded-md border">
        <div className="border-b bg-muted/50 px-4 py-3">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
        </div>

        {Array.from({ length: rowCount }).map((_, i) => (
          <div key={i} className="border-b last:border-b-0 px-4 py-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simple centered loading spinner
 */
export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        {text && (
          <p className="text-sm text-muted-foreground">{text}</p>
        )}
      </div>
    </div>
  );
}
