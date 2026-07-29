/**
 * Department types
 */
import type { BaseEntity, Status } from "@/types/common";

export interface Department extends BaseEntity {
  code: string;
  /** English name (fallback when nameTh/nameEn are absent) */
  name: string;
  /** Thai name — returned by the real backend */
  nameTh?: string;
  /** English name — returned by the real backend */
  nameEn?: string;
  description?: string | null;
  parentId?: string | null;
  managerId?: string;
  managerName?: string;
  status: Status;
  sortOrder?: number;
  isActive?: boolean;
  userCount?: number;
  children?: Department[];
}
