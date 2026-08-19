/**
 * Server-side Validation Utilities
 * 
 * Zod schemas and validation helpers for server-side data validation.
 * These should only be imported in Server Components, Server Actions, or API routes.
 * 
 * @see https://zod.dev
 */

import { z } from "zod";

/**
 * Create a validation schema for API requests
 */
export function createRequestSchema<T extends z.ZodTypeAny>(schema: T) {
  return schema;
}

/**
 * Validate data against a Zod schema
 * Throws ZodError if validation fails
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validate - returns result instead of throwing
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Common validation schemas
 */
export const schemas = {
  // ID validation
  id: z.string().uuid(),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),

  // Date range
  dateRange: z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),

  // Search
  search: z.object({
    search: z.string().min(1).max(200).optional(),
  }),

  // Status filter
  statusFilter: z.object({
    status: z.enum(["active", "inactive", "pending", "archived"]).optional(),
  }),

  // Bulk IDs
  bulkIds: z.object({
    ids: z.array(z.string()).min(1).max(100),
  }),
} as const;

/**
 * Format Zod errors for API response
 */
export function formatZodErrors(error: z.ZodError) {
  return error.errors.map((err) => ({
    code: err.code,
    message: err.message,
    field: err.path.join("."),
  }));
}
