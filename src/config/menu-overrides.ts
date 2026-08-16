/**
 * Menu path overrides
 *
 * The backend returns menu items with their own `path` (e.g. `/roles`,
 * `/materials`, `/audit-logs`). The frontend has its own route table under
 * `(admin)/` with different conventions (e.g. `/user-management/roles`).
 *
 * This map lets the sidebar reconcile both:
 *   - code in MENU_PATH_OVERRIDES → use the override path
 *   - code not in the map          → use the backend path as-is
 *
 * Set a value to `null` to hide a menu item from the sidebar even though the
 * backend still returns it.
 *
 * To point a missing-page menu at a placeholder, set the override to
 * `/coming-soon?feature=<code>` (the `ComingSoon` page reads this param).
 */
export const MENU_PATH_OVERRIDES: Record<string, string | null> = {
  // Map backend menu codes to the existing frontend routes
  USER_LIST: "/user-management/users",
  ROLE_MANAGEMENT: "/user-management/roles",
  DEPARTMENT_LIST: "/user-management/departments",
  MENU_MANAGEMENT: "/system/menu-management",
  AUDIT_LOG: "/system/activity-logs",
  // Newly built pages (frontend now has dedicated screens for these)
  PERMISSION_MANAGEMENT: "/permissions",
  SESSION_MANAGEMENT: "/sessions",
  // Materials Management
  MATERIALS_PC: "/materials/pc",
  MATERIALS_RECEIVING: "/materials/materials-receiving",
};

/**
 * Resolve the effective path for a menu item:
 *   override (if defined) > backend path > null
 */
export const resolveMenuPath = (
  code: string | undefined,
  backendPath: string | null | undefined,
): string | null => {
  if (code && code in MENU_PATH_OVERRIDES) {
    return MENU_PATH_OVERRIDES[code] ?? null;
  }
  return backendPath ?? null;
};

/**
 * Check whether the path is a "coming soon" placeholder
 */
export const isComingSoonPath = (path: string | null | undefined): boolean =>
  !!path && path.startsWith("/coming-soon");
