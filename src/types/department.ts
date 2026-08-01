/**
 * Department types
 *
 * Aligned with the real NestJS backend response shape:
 *   GET /departments           { items, meta: { page, limit, totalItems, totalPages } }
 *   GET /departments/:id       { id, code, nameTh, nameEn, isActive, createdAt, ... }
 *   POST /departments          { code, nameTh, nameEn }    (only these 3 are accepted)
 *   PATCH /departments/:id     { nameTh, nameEn }         (only these 2 are accepted)
 *   DELETE /departments/:id    — works
 *
 * Notes:
 *   - `isActive` is a backend-controlled flag (read-only from the API).
 *     The PATCH endpoint does NOT accept it; there's no separate "set status"
 *     endpoint. We display it as a badge but the toggle is not exposed.
 *   - `/departments/tree` is broken on the backend (500). The UI builds
 *     the tree client-side from the flat list using `parent?.id`.
 *   - `userCount` is computed by the backend when present (not in the basic
 *     GET response — we'd need an extra endpoint to populate it).
 */
import type { BaseEntity } from "@/types/common";

export interface Department extends BaseEntity {
  id: string;
  /** Short identifier (e.g. "WE", "PS"). Always uppercase by convention. */
  code: string;
  /** Thai name — required, returned by the real backend */
  nameTh: string;
  /** English name — required, returned by the real backend */
  nameEn: string;
  /** Optional description */
  description?: string | null;
  /**
   * Active flag (read-only). The real backend returns this on list/single
   * but does not accept it on POST/PATCH (no status-toggle endpoint).
   */
  isActive: boolean;
  /**
   * Parent department (populated when listing; flat list shape).
   * Build the tree client-side by reading `parent?.id` for each item.
   */
  parent?: Pick<Department, "id" | "code" | "nameTh" | "nameEn"> | null;
  /**
   * Flat parent-id reference. Note: backend sometimes omits this on
   * `/departments` (list) — fall back to `parent?.id` in that case.
   */
  parentId?: string | null;
  /**
   * Optional: present on some endpoints, missing on others.
   * Not currently sent/accepted by POST/PATCH.
   */
  managerId?: string | null;
  managerName?: string | null;
  sortOrder?: number;
  /**
   * Optional count of users in this department — present in some endpoints
   * (e.g. with a `?includeUserCount=true` flag) but not by default.
   */
  userCount?: number;
  /**
   * Children — only present when the backend returns a tree. We build the
   * tree client-side so this is usually empty in the basic list response.
   */
  children?: Department[];
}

