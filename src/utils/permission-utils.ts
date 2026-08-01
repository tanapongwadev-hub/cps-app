/**
 * Permission utilities
 * ---------------------------------------------------------------------------
 * Shared helpers used by role / permission UIs to render the matrix of
 * (menu × action) and to talk to the backend.
 *
 * Backend shape (real NestJS):
 *   { id, code, isActive, menu: {id, code, nameTh, nameEn}, action: {id, code, nameTh, nameEn} }
 *
 * Roles carry permissions as a flat `actionCodes: string[]` of action codes
 * (e.g. ["READ", "CREATE"]).  So we always have to translate between:
 *   - selected **permission IDs** (UI state)
 *   - a set of **action codes** (what /roles PATCH accepts)
 */
import type { Permission, PermissionMenuRef } from "@/types/permission";

/** Safely read the action code from a value that may be a string OR a ref object. */
export function readActionCode(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "code" in value && typeof (value as { code: unknown }).code === "string") {
    return (value as { code: string }).code;
  }
  return null;
}

/** Map common CRUD-style action codes to a stable display order. */
export function actionOrder(actionCode: string | null | undefined): number {
  switch ((actionCode ?? "").toUpperCase()) {
    case "CREATE":
      return 0;
    case "READ":
      return 1;
    case "UPDATE":
      return 2;
    case "DELETE":
      return 3;
    default:
      return 99;
  }
}

/** Thai labels for the common action codes. Falls back to the code itself. */
export const ACTION_LABELS_TH: Record<string, string> = {
  CREATE: "สร้าง",
  READ: "อ่าน",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
};

export function labelForAction(code: string | null | undefined): string {
  if (!code) return "-";
  const upper = code.toUpperCase();
  return ACTION_LABELS_TH[upper] ?? code;
}

/** Label for a menu reference, preferring Thai name then English then code. */
export function labelForMenu(menu?: PermissionMenuRef | null): string {
  if (!menu) return "-";
  return menu.nameTh ?? menu.nameEn ?? menu.name ?? menu.code ?? "-";
}

/** A single menu group as rendered by the matrix. */
export interface PermissionMenuGroup {
  menu: PermissionMenuRef;
  perms: Permission[];
}

/** Group active permissions by `menu.code`, sorted by menu name. */
export function groupPermissionsByMenu(perms: Permission[]): PermissionMenuGroup[] {
  const m = new Map<string, PermissionMenuGroup>();
  for (const p of perms) {
    if (p.isActive === false) continue;
    if (!p.menu) continue;
    const key = p.menu.code;
    if (!m.has(key)) {
      m.set(key, { menu: p.menu, perms: [] });
    }
    m.get(key)!.perms.push(p);
  }
  for (const g of m.values()) {
    g.perms.sort(
      (a, b) =>
        actionOrder(readActionCode(a.action)) -
        actionOrder(readActionCode(b.action)),
    );
  }
  return [...m.values()].sort((a, b) =>
    labelForMenu(a.menu).localeCompare(labelForMenu(b.menu), "th"),
  );
}

/**
 * Given the full permission catalog and a list of action codes that a role
 * currently has, return the permission IDs that should be **pre-checked**
 * in the role form.  Because role permissions are coarse-grained
 * (`actionCodes` not per-menu), if a role has `READ` we mark all permissions
 * with action `READ` as selected.
 */
export function selectedPermissionIdsFromActionCodes(
  perms: Permission[],
  actionCodes: readonly string[] | undefined,
): string[] {
  if (!actionCodes?.length) return [];
  const set = new Set(actionCodes.map((c) => c.toUpperCase()));
  return perms
    .filter((p) => {
      const code = readActionCode(p.action);
      return code ? set.has(code.toUpperCase()) : false;
    })
    .map((p) => p.id);
}

/** Union of action codes from a list of selected permission IDs. */
export function actionCodesFromSelectedIds(
  perms: Permission[],
  selectedIds: readonly string[],
): string[] {
  if (!selectedIds.length) return [];
  const idSet = new Set(selectedIds);
  const codes = new Set<string>();
  for (const p of perms) {
    if (!idSet.has(p.id)) continue;
    const code = readActionCode(p.action);
    if (code) codes.add(code.toUpperCase());
  }
  return [...codes];
}
