/**
 * Pagination types matching the real NestJS backend shape:
 *   { items: T[], meta: { page, limit, totalItems, totalPages } }
 */
import type { PaginationParams, SortParams } from "@/types/common";

/** Standard pagination metadata returned by the backend */
export interface PageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

/** Generic paginated response */
export interface PaginatedList<T> {
  items: T[];
  meta: PageMeta;
}

/** Build pagination query params for an API call */
export interface PageQuery extends PaginationParams, SortParams {
  search?: string;
  status?: string;
  userId?: string;
}

/** Helper: normalise legacy `pageSize` → `limit` for the real backend */
export const toLimit = (pageSize: number | undefined, fallback = 20): number => {
  if (!pageSize || !Number.isFinite(pageSize) || pageSize <= 0) return fallback;
  return Math.min(100, Math.floor(pageSize));
};
