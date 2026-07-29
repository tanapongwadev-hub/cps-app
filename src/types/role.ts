/**
 * Role types
 */
import type { BaseEntity, Status } from "@/types/common";

export interface Role extends BaseEntity {
  code: string;
  /** English name (fallback) */
  name: string;
  /** Thai name — returned by the real backend */
  nameTh?: string;
  /** English name — returned by the real backend */
  nameEn?: string;
  description?: string | null;
  /** System-level (e.g. SUPER_ADMIN) vs department-scoped */
  scopeType?: "SYSTEM" | "DEPARTMENT" | "CUSTOM";
  status?: Status;
  isActive?: boolean;
  isSystem?: boolean;
  permissions?: string[];
  userCount?: number;
}
