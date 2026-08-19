/**
 * Server-only module guard
 * 
 * Import this file at the top of any module that should ONLY run on the server.
 * If imported on the client, it will throw a clear error.
 * 
 * This mimics the behavior of the `server-only` npm package.
 * 
 * @example
 * ```ts
 * // database.ts - Server-only database module
 * import 'server-only'
 * // ... rest of the file
 * ```
 */

if (typeof window !== "undefined") {
  throw new Error(
    "This module cannot be imported from a client component. " +
    "This error helps you find accidental client-side imports of server-only code."
  );
}

export {};
