/**
 * Menu-related types
 * Aligned with the real NestJS backend shape:
 *   {
 *     id, parentId, code, nameTh, nameEn, menuType, path, icon, sortOrder,
 *     isVisible, isActive, parent?, children?, permissions?,
 *     createdBy?, updatedBy?, createdAt, updatedAt
 *   }
 *
 * The sidebar uses a SUBSET of these fields (see /config/menu-overrides).
 * The management page uses the full shape.
 */
import type { Status } from "@/types/common";

/** Backend menu type discriminator */
export type MenuType = "MAIN" | "SUB" | "GROUP" | "EXTERNAL";

/** Minimal parent reference (included in /menus/:id and /menus/tree responses) */
export interface MenuParentRef {
  id: string;
  code: string;
  nameTh?: string;
  nameEn?: string;
  name?: string;
}

/** A single menu record as returned by the real backend */
export interface MenuItem {
  id: string;
  /** Direct parent id (null for top-level) */
  parentId: string | null;
  code: string;
  /** Thai name (real backend field) */
  nameTh: string;
  /** English name (real backend field) */
  nameEn: string;
  /** Convenience: prefer nameTh, fallback to nameEn, fallback to name */
  name?: string;
  /** Backend menu type discriminator */
  menuType: MenuType;
  /** Route path — null for group-only menus */
  path: string | null;
  /** Lucide icon name (e.g. "menu", "building", "file-text") — null when none */
  icon: string | null;
  sortOrder: number;
  /** Visible in sidebar */
  isVisible: boolean;
  /** Active (logical status — not the same as Status enum) */
  isActive: boolean;
  /** Optional template legacy field */
  status?: Status;
  /** Permission codes required to view this menu (template legacy) */
  requiredPermissions?: string[];
  /** Permission codes (real backend uses this key) */
  permissions?: string[];
  externalUrl?: string;
  openInNewTab?: boolean;
  isHidden?: boolean;
  isGroup?: boolean;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "info";
  description?: string;
  /** Backend convenience fields (populated in /menus/tree and /menus/:id) */
  parent?: MenuParentRef | null;
  children?: MenuItem[];
  /** Audit fields */
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Computed nesting depth (0 = top level) */
  level?: number;
}

/** Tree response (top-level array; each item may nest children) */
export type MenuTree = MenuItem[];

/** Form data for create/edit dialog */
export interface MenuFormData {
  code: string;
  nameTh: string;
  nameEn: string;
  parentId: string | null;
  menuType: MenuType;
  path: string;
  icon: string;
  sortOrder: number;
  isVisible: boolean;
  isActive: boolean;
  openInNewTab: boolean;
  externalUrl?: string;
  description?: string;
  requiredPermissions?: string[];
}

/** Reorder payload */
export interface MenuReorderItem {
  id: string;
  sortOrder: number;
  parentId: string | null;
}
