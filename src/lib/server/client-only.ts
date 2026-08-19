/**
 * Client-only module guard
 * 
 * Import this file at the top of any module that should ONLY run on the client.
 * If imported on the server, it will throw a clear error.
 * 
 * @example
 * ```ts
 * // browser-api.ts - Client-only browser API module
 * import 'client-only'
 * // ... rest of the file
 * ```
 */

if (typeof window === "undefined") {
  throw new Error(
    "This module cannot be imported from a server component. " +
    "This error helps you find accidental server-side imports of client-only code."
  );
}

export {};
