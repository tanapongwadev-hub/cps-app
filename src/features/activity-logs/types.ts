/**
 * Activity Log types
 */
import type { BaseEntity } from "@/types/common";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "view"
  | "login"
  | "logout"
  | "export"
  | "import"
  | "approve"
  | "reject"
  | "assign"
  | "status_change"
  | "permission_change";

export interface ActivityLog extends BaseEntity {
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: ActivityAction;
  module: string;
  resource: string;
  resourceId?: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  status: "success" | "failure" | "warning";
  errorMessage?: string;
  duration?: number;
}
