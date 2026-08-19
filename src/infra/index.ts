/**
 * Infrastructure Layer
 * 
 * Contains infrastructure concerns: API client, database access, external services.
 * Follows Vercel Best Practices for clear separation of concerns.
 * 
 * Structure:
 * - api/       - HTTP client and API types
 * - db/        - Database clients (when needed)
 * - errors/    - Error handling utilities
 * - storage/   - Storage utilities
 */

export * from "./api";
