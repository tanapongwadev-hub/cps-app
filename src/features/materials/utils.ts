import { env } from "@/config/env";

/**
 * Resolve a Material image path returned by the backend into a URL the
 * browser can load.
 *
 * The API stores Material image paths as absolute paths under `/uploads/...`
 * (e.g. `/uploads/materials/abc.jpg` for a promoted image, or
 * `/uploads/materials/.tmp/<uuid>.jpg` for a staged one). The backend serves
 * these via `useStaticAssets`, but the browser cannot resolve a bare
 * `/uploads/...` path against the Next.js dev server.
 *
 * Two options are supported:
 *  1. `next.config.ts` rewrites `/uploads/*` to the backend origin
 *     (same-origin in the browser, no CORS, no extra DNS round-trip).
 *     This is the default and what we use in development / production.
 *  2. As a safety net, when the rewrite cannot be used (e.g. `next export`,
 *     CDN serving static assets), we fall back to the full backend URL
 *     derived from `NEXT_PUBLIC_API_BASE_URL`.
 *
 * The function is intentionally tolerant:
 *  - returns `null` for `null` / `undefined` / empty inputs
 *  - returns the input unchanged if it is already a `http(s):` or `data:` URL
 *  - returns the input unchanged if it is already a same-origin `/uploads/...`
 *    path (so the Next.js rewrite picks it up)
 *  - otherwise resolves it to a full URL using the API origin
 */
export function resolveMaterialImage(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  const trimmed = imagePath.trim();
  if (trimmed === "") return null;

  // Already a fetchable URL — keep as-is.
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  // Same-origin path served by the Next.js rewrite. Leave it alone so the
  // dev server can proxy it through to the backend.
  if (trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  // Relative path without a leading slash — normalise, then fall through to
  // the absolute-URL fallback below.
  const normalised = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // Final fallback: build a full URL from the API base URL.
  const baseUrl = env.api.baseUrl.replace(/\/$/, "");
  // API base may be `/api`, `/api/v1`, or a full origin like
  // `http://localhost:3001/api/v1`. Strip the trailing `/api...` segment so we
  // get to the bare origin and append the public uploads path.
  const origin = baseUrl.replace(/\/api\/v\d+\/?$/, "").replace(/\/api\/?$/, "");
  if (!origin || origin.startsWith("/")) {
    // No real origin (relative API base) — return the path as-is and rely on
    // the Next.js rewrite to proxy it.
    return normalised;
  }
  return `${origin}${normalised}`;
}
