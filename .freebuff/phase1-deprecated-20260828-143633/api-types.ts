/**
 * Centralized API Types
 * 
 * Shared types for API layer following Vercel Best Practices:
 * - Strict typing for all API responses
 * - Centralized error types
 * - Request/Response validation schemas
 */

import type { ApiResponse, PaginatedResponse, ApiError } from "@/types/common";

// Re-export common types
export type { ApiResponse, PaginatedResponse, ApiError };

/**
 * Extended API error with request context
 */
export interface ApiErrorContext extends ApiError {
  url?: string;
  method?: string;
  requestId?: string;
}

/**
 * API Request options
 */
export interface ApiRequestOptions<T = unknown> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: T;
  headers?: Record<string, string>;
  timeout?: number;
  skipAuth?: boolean;
  skipMock?: boolean;
  skipRefresh?: boolean;
}

/**
 * API Error with enhanced context
 */
export interface EnhancedApiError extends Error {
  status: number;
  code: string;
  errors: ApiError[];
  data: unknown;
  isNetworkError: boolean;
  isTimeout: boolean;
}

/**
 * Typed response wrapper for API calls
 */
export type ApiResult<T> = 
  | { success: true; data: T }
  | { success: false; error: EnhancedApiError };

/**
 * Pagination request params
 */
export interface PaginationRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Common filter params
 */
export interface FilterRequest {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | number | boolean | string[] | undefined | null;
}

/**
 * Export request params
 */
export interface ExportRequest extends PaginationRequest, FilterRequest {
  format?: "csv" | "excel" | "pdf";
  columns?: string[];
}

/**
 * Bulk operation request
 */
export interface BulkOperationRequest {
  ids: string[];
  action: "delete" | "activate" | "deactivate" | "export";
}
