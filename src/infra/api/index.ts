/**
 * API Infrastructure Layer
 * 
 * Centralized API client, types, and endpoints following Vercel Best Practices.
 * 
 * @example
 * ```ts
 * // Import from centralized location
 * import { apiClient } from '@/infra/api';
 * import { endpoints } from '@/infra/api';
 * import type { ApiResponse, PaginatedResponse } from '@/infra/api';
 * ```
 */

// API Client
export { apiClient, ApiClient } from "./client";
export type { RequestOptions } from "./client";

// API Types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ApiRequestOptions,
  EnhancedApiError,
  ApiResult,
  PaginationRequest,
  FilterRequest,
  ExportRequest,
  BulkOperationRequest,
} from "./types";

// Endpoints
export { endpoints, buildEndpoint } from "./endpoints";
