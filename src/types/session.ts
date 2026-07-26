/**
 * Session types
 * Aligned with the real NestJS backend response shape:
 *   { id, user: { id, username, firstName, lastName }, ipAddress, expiresAt, revokedAt, createdAt }
 */
import type { BaseEntity } from "@/types/common";

export interface SessionUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
}

export type SessionStatus = "active" | "expired" | "revoked";

export interface UserSession extends BaseEntity {
  userId?: string;
  user?: SessionUser;
  userName?: string;
  userEmail?: string;
  ipAddress?: string | null;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  status?: SessionStatus;
  /** ISO string from the backend */
  expiresAt: string;
  lastActiveAt?: string;
  /** When set, the session has been revoked */
  revokedAt?: string | null;
  revokedBy?: string;
  revokedReason?: string;
  /** Convenience computed field: active when no revokedAt and not yet expired */
  isActive?: boolean;
}
