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
  /**
   * Action reference. The real NestJS backend returns this as a
   * {@link PermissionActionRef} object (e.g. `{ id, code: "view", nameTh, nameEn }`).
   * Older / alternate backends may return a plain string — we accept both.
   */
  action?: string | PermissionActionRef;
  name?: string;
  nameTh?: string;
  nameEn?: string;
  description?: string;
  isSystem?: boolean;
  isActive?: boolean;
  menu?: PermissionMenuRef;
  /**
   * Alias of {@link action} kept for callers that used the explicit name.
   * Most backends only return `action` — `actionRef` is preserved here so
   * existing code that reads `actionRef` doesn't break.
   */
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
