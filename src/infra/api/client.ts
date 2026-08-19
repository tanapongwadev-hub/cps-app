/**
 * API Client - Re-export from services
 * 
 * Provides a unified import path following Vercel Best Practices:
 * - Single entry point for API client
 * - Centralized configuration
 * - Type-safe request methods
 * 
 * @example
 * ```ts
 * import { apiClient, ApiClientError } from '@/infra/api/client';
 * ```
 */

export {
  apiClient,
  ApiClient,
  type RequestOptions,
  type ApiClientError,
} from "@/services/api-client";

/**
 * Re-export types for convenience
 */
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  PaginationParams,
  SortParams,
  BaseEntity,
  SoftDeleteEntity,
} from "@/types/common";
