/**
 * Container/Presenter Pattern
 * 
 * Following Vercel Best Practices for React component architecture:
 * - Container: Logic + State management (hooks, data fetching)
 * - Presenter: Pure UI components (no hooks, no business logic)
 * 
 * Benefits:
 * - Better testability (Presenter can be tested without mocking hooks)
 * - Clear separation of concerns
 * - Easier to maintain and refactor
 * 
 * @example
 * ```tsx
 * // materials-list.container.tsx
 * function MaterialsListContainer() {
 *   const { data, isLoading, error } = useMaterials();
 *   return (
 *     <MaterialsListPresenter
 *       materials={data?.items ?? []}
 *       isLoading={isLoading}
 *       error={error}
 *     />
 *   );
 * }
 * 
 * // materials-list.presenter.tsx
 * interface MaterialsListPresenterProps {
 *   materials: Material[];
 *   isLoading: boolean;
 *   error: Error | null;
 * }
 * 
 * function MaterialsListPresenter({ materials, isLoading, error }: MaterialsListPresenterProps) {
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorMessage error={error} />;
 *   return <MaterialTable data={materials} />;
 * }
 * ```
 */

import type { ReactNode } from "react";

/**
 * Base props for all Presenters
 */
export interface BasePresenterProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Loading state presenter
 */
export interface LoadingPresenterProps extends BasePresenterProps {
  variant?: "spinner" | "skeleton" | "pulse";
  text?: string;
}

/**
 * Error state presenter
 */
export interface ErrorPresenterProps extends BasePresenterProps {
  error: Error | null;
  onRetry?: () => void;
  title?: string;
}

/**
 * Empty state presenter
 */
export interface EmptyPresenterProps extends BasePresenterProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/**
 * State wrapper that handles Loading/Error/Empty states
 */
export interface StateWrapperProps extends BasePresenterProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  children: ReactNode;
}
