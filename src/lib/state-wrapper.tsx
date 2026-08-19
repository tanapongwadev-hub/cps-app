/**
 * State Wrapper Component
 * 
 * A reusable component that handles Loading, Error, and Empty states.
 * Follows the Container/Presenter pattern by delegating to child Presenters.
 */

import type { ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Props for StateWrapper
 */
export interface StateWrapperProps {
  /** Current loading state */
  isLoading?: boolean;
  /** Current error state */
  isError?: boolean;
  /** Current empty state */
  isEmpty?: boolean;
  /** Error object when isError is true */
  error?: Error | null;
  /** Loading indicator text */
  loadingText?: string;
  /** Empty state title */
  emptyTitle?: string;
  /** Empty state description */
  emptyDescription?: string;
  /** Custom empty icon */
  emptyIcon?: ReactNode;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Children to render when all states are resolved */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Loading skeleton component
 */
function LoadingSkeleton({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

/**
 * Error display component
 */
function ErrorDisplay({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive" className="mx-auto max-w-md">
      <Alert.Title>เกิดข้อผิดพลาด</Alert.Description>
      <p className="mt-2 text-sm">{error?.message ?? "ไม่สามารถโหลดข้อมูลได้"}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
          ลองใหม่
        </Button>
      )}
    </Alert>
  );
}

/**
 * Empty state display component
 */
function EmptyDisplay({
  title,
  description,
  icon,
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title ?? "ไม่พบข้อมูล"}
      description={description ?? "ยังไม่มีข้อมูลในระบบ"}
    />
  );
}

/**
 * State Wrapper Component
 * 
 * Handles all conditional rendering states in one place:
 * - Loading: Shows spinner or skeleton
 * - Error: Shows error message with optional retry
 * - Empty: Shows empty state message
 * - Success: Renders children
 * 
 * @example
 * ```tsx
 * <StateWrapper
 *   isLoading={isLoading}
 *   isError={isError}
 *   isEmpty={data?.items.length === 0}
 *   error={error}
 *   loadingText="กำลังโหลด..."
 *   emptyTitle="ไม่พบวัสดุ"
 * >
 *   <MaterialTable data={data.items} />
 * </StateWrapper>
 * ```
 */
export function StateWrapper({
  isLoading = false,
  isError = false,
  isEmpty = false,
  error = null,
  loadingText,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  onRetry,
  children,
  className,
}: StateWrapperProps) {
  if (isLoading) {
    return <LoadingSkeleton text={loadingText} />;
  }

  if (isError) {
    return <ErrorDisplay error={error} onRetry={onRetry} />;
  }

  if (isEmpty) {
    return (
      <EmptyDisplay
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  return <div className={className}>{children}</div>;
}
