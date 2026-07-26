/**
 * Common Type Definitions
 */

/** Generic API Response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  messageCode?: string;
  data: T;
  errors?: ApiError[];
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp?: string;
}

/** Paginated API Response */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Common pagination params */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Common sort params */
export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/** Base entity with audit fields */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Soft-delete aware entity */
export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: string | null;
  deletedBy?: string | null;
}

/** Status enum */
export type Status = "active" | "inactive" | "pending" | "archived";

/** Priority levels */
export type Priority = "low" | "medium" | "high" | "urgent";

/** Theme */
export type Theme = "light" | "dark" | "system";

/** Language */
export type Language = "th" | "en";

/** Loading state */
export type LoadingState = "idle" | "loading" | "success" | "error";

/** Async state */
export interface AsyncState<T> {
  data: T | null;
  status: LoadingState;
  error: Error | null;
}

/** Sort direction */
export type SortDirection = "asc" | "desc" | null;

/** Permission action types */
export type PermissionAction = "view" | "create" | "update" | "delete" | "export" | "manage";

/** Permission string format: "module.action" */
export type PermissionCode = `${string}.${PermissionAction}` | "*";
