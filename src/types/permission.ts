/**
 * Permission types
 * Aligned with the real NestJS backend response shape:
 *   { id, code, isActive, menu: { id, code, nameTh, nameEn }, action: { id, code, nameTh, nameEn } }
 */
import type { BaseEntity } from "@/types/common";

/** Multilingual menu reference inside a permission */
export interface PermissionMenuRef {
  id: string;
  code: string;
  nameTh?: string;
  nameEn?: string;
  name?: string;
}

/** CRUD action reference inside a permission */
export interface PermissionActionRef {
  id: string;
  code: string;
  nameTh?: string;
  nameEn?: string;
  name?: string;
}

export interface Permission extends BaseEntity {
  code: string;
  module?: string;
  action?: string;
  name?: string;
  nameTh?: string;
  nameEn?: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
  menu?: PermissionMenuRef;
  actionRef?: PermissionActionRef;
}

/** Computed shape used by the matrix UI — derived from the user's permission list */
export interface PermissionGroup {
  module: string;
  label: string;
  permissions: Array<{
    code: string;
    label: string;
    /** Whether the current user has this permission */
    granted: boolean;
  }>;
}
