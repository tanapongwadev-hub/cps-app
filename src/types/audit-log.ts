/**
 * Audit Log types
 * ต่างจาก activity-log.ts ตรงที่ audit-log เป็น formal log
 */
import type { BaseEntity } from "@/types/common";

export type AuditAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "approve"
  | "reject"
  | "permission_change"
  | "settings_change"
  | "security_event";

export interface AuditLog extends BaseEntity {
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  module: string;
  resource: string;
  resourceId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  status: "success" | "failure";
  errorMessage?: string;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  duration?: number;
}
