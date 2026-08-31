/**
 * Non-httpOnly "presence" cookie for the session — NOT a security boundary.
 *
 * The real access/refresh tokens live only in localStorage (see auth-store.ts)
 * and are never put in this cookie. This flag exists solely so that
 * `middleware.ts`, which runs on the edge before any client JS executes, can
 * make a fast first-pass redirect decision ("does this browser look logged
 * in at all?") without being able to read or forge a usable token.
 *
 * Real authorization is still enforced by:
 *  - the backend, which re-validates the bearer token on every request
 *  - `AdminShell`, which redirects to /login if the client-side session is
 *    actually invalid/expired
 */
const SESSION_COOKIE_NAME = "cps_has_session";

export function setSessionCookie(): void {
  if (typeof document === "undefined") return;
  // Session cookie (no Max-Age) — cleared when the browser closes, refreshed
  // on every login/session-sync so it also survives long-lived "remember me" sessions.
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; SameSite=Lax`;
}

export function clearSessionCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; SameSite=Lax; Max-Age=0`;
}

export const SESSION_COOKIE_KEY = SESSION_COOKIE_NAME;
