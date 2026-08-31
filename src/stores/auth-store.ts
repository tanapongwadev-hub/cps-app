/**
 * Auth Store - manages user session, tokens, and permissions
 * Supports multi-department/multi-role users with active context switching
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  User,
  UserDepartmentRole,
  AccessControl,
  AuthSession,
  LoginResponse,
  LoginRequiresDepartmentSelectionResponse,
  SelectDepartmentResponse,
} from "@/features/auth/types";
import { SESSION_STORAGE_KEYS } from "@/constants/app";
import { setSessionCookie, clearSessionCookie } from "@/utils/session-cookie";

/**
 * Determine whether a user is a super admin.
 *
 * Two sources of truth:
 *   1) `user.isSuperAdmin === true`  — set by the real NestJS backend
 *   2) `permissions` contains "*"    — template/mocked behavior
 * Either signal should grant super admin.
 */
export const isSuperAdminUser = (user: User | null, permissions: string[]): boolean => {
  if (user?.isSuperAdmin === true) return true;
  if (permissions.includes("*")) return true;
  // Real backend may also encode SUPER_ADMIN as a permission string (e.g. "*" or "SUPER_ADMIN")
  if (permissions.some((p) => p === "SUPER_ADMIN" || p === "*")) return true;
  return false;
};

/**
 * Decide whether a logged-in user must pick a department before they can
 * enter the app.
 *
 * Triggered when:
 *   - The user has more than one department assigned (`user.departments.length > 1`)
 *   - They are not a super admin (superadmins have empty `departments`)
 *
 * Used by:
 *   - `useLogin` to redirect to `/select-department` after 1-step login
 *   - `admin-shell` to enforce the gate on app load
 *   - `buildAuthSessionFromLogin` to populate `needsDepartmentSelection`
 */
export const userNeedsDepartmentSelection = (user: User | null): boolean => {
  if (!user) return false;
  if (user.isSuperAdmin === true) return false;
  const deptCount = user.departments?.length ?? 0;
  return deptCount > 1;
};

/**
 * State เก็บไว้ใน client
 *
 * Two flavors of "waiting for department selection":
 *
 *   - `"select"` — spec-style 2-step login: backend returns a temporary
 *     `departmentSelectionToken`; client must POST /auth/select-department
 *     with `userDepartmentRoleId` to get the real tokens + session.
 *
 *   - `"switch"` — 1-step login (real backend) but the user is assigned to
 *     >1 department. We already have a valid session; the user just needs
 *     to pick which (department, role) tuple to "switch into" via
 *     POST /auth/switch-department.
 */
export type PendingSelectionMode = "select" | "switch";

export interface PendingDepartmentSelection {
  /** Which flow to use when the user picks a department */
  mode: PendingSelectionMode;
  /** Required when mode === "select"; ignored for "switch" */
  departmentSelectionToken?: string;
  /**
   * User object — optional because the real 2-step login response may
   * not include it. When missing, the login page falls back to the
   * username it stashed locally (a ref) when the form was submitted.
   */
  user?: User;
  /** Pre-computed options for the "select" flow (2-step spec) */
  options?: LoginRequiresDepartmentSelectionResponse["userDepartmentRoles"];
}

interface AuthState {
  user: User | null;
  currentDepartmentRole: UserDepartmentRole | null;
  userDepartmentRoles: UserDepartmentRole[];
  accessControl: AccessControl | null;
  permissions: string[];
  menu: AccessControl["menus"];

  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /**
   * True after 1-step login when the user has more than one department.
   * Admin shell uses this to gate access and force /select-department.
   */
  needsDepartmentSelection: boolean;

  // 2-step login state
  pendingSelection: PendingDepartmentSelection | null;

  // Actions
  setSession: (session: AuthSession) => void;
  setTokens: (accessToken: string, refreshToken?: string, expiresAt?: number) => void;
  expireSession: () => void;
  setLoading: (loading: boolean) => void;
  setPendingSelection: (data: PendingDepartmentSelection | null) => void;
  /**
   * Switch into a (department, role) tuple. Updates the current context
   * and clears the `needsDepartmentSelection` flag.
   */
  switchDepartmentRole: (udr: UserDepartmentRole, accessControl: AccessControl) => void;
  logout: () => void;

  // Selectors
  hasPermission: (permission: string | string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isSuperAdmin: () => boolean;
  canAccess: (userDepartmentRoleId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      currentDepartmentRole: null,
      userDepartmentRoles: [],
      accessControl: null,
      permissions: [],
      menu: [],
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      needsDepartmentSelection: false,
      pendingSelection: null,

      setSession: (session) => {
        setSessionCookie();
        set({
          user: session.user,
          currentDepartmentRole: session.currentDepartmentRole,
          accessControl: session.accessControl,
          permissions: session.accessControl.permissions,
          menu: session.accessControl.menus,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
          isAuthenticated: true,
          isLoading: false,
          // When the session is being replaced (login, select-dept, /auth/me
          // sync), only treat dept selection as "done" if the user actually
          // has a `currentDepartmentRole` *and* doesn't need to pick. The
          // `useLogin` hook sets this explicitly via the helper below.
          needsDepartmentSelection:
            !!session.user && !session.currentDepartmentRole
              ? userNeedsDepartmentSelection(session.user)
              : false,
          pendingSelection: null,
        });
      },

      /**
       * Update tokens after a refresh (keeps user, permissions, menu as-is).
       * Used by the auto-refresh interceptor in api-client.
       */
      setTokens: (accessToken, refreshToken, expiresAt) =>
        set((state) => ({
          accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
          expiresAt,
        })),

      /**
       * Mark the session as expired (used by interceptor when refresh fails).
       * Keeps the user state so we can show a friendly "session expired" page.
       */
      expireSession: () => {
        clearSessionCookie();
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setPendingSelection: (data) => set({ pendingSelection: data }),

      switchDepartmentRole: (udr, accessControl) =>
        set({
          currentDepartmentRole: udr,
          accessControl,
          permissions: accessControl.permissions,
          menu: accessControl.menus,
          // Once a user has switched into a real (dept, role) context the
          // gate is satisfied — they're no longer "waiting" for selection.
          needsDepartmentSelection: false,
        }),

      logout: () => {
        clearSessionCookie();
        set({
          user: null,
          currentDepartmentRole: null,
          userDepartmentRoles: [],
          accessControl: null,
          permissions: [],
          menu: [],
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          isLoading: false,
          needsDepartmentSelection: false,
          pendingSelection: null,
        });
      },

      hasPermission: (permission) => {
        const state = get();
        if (isSuperAdminUser(state.user, state.permissions)) return true;
        const perms = state.permissions;
        if (Array.isArray(permission)) {
          return permission.some((p) => perms.includes(p));
        }
        return perms.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const state = get();
        if (isSuperAdminUser(state.user, state.permissions)) return true;
        return permissions.some((p) => state.permissions.includes(p));
      },

      hasAllPermissions: (permissions) => {
        const state = get();
        if (isSuperAdminUser(state.user, state.permissions)) return true;
        return permissions.every((p) => state.permissions.includes(p));
      },

      isSuperAdmin: () => isSuperAdminUser(get().user, get().permissions),

      canAccess: (userDepartmentRoleId) => {
        const current = get().currentDepartmentRole;
        return current?.id === userDepartmentRoleId;
      },
    }),
    {
      name: SESSION_STORAGE_KEYS.AUTH_TOKEN,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        currentDepartmentRole: state.currentDepartmentRole,
        userDepartmentRoles: state.userDepartmentRoles,
        accessControl: state.accessControl,
        permissions: state.permissions,
        menu: state.menu,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
        needsDepartmentSelection: state.needsDepartmentSelection,
      }),
      // Restore the middleware's session-presence cookie after a hard reload
      // (localStorage survives it, but the cookie above does not since it
      // carries no Max-Age). Without this, a refresh would bounce an
      // already-logged-in user to /login via middleware.
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated) {
          setSessionCookie();
        }
      },
    },
  ),
);

/**
 * Parse expiresIn to milliseconds. The real backend returns "15m" (string) or 900 (number).
 * The mock returns a plain number of seconds.
 */
const parseExpiresInMs = (raw: number | string | undefined, fallbackSeconds = 3600): number => {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw * 1000;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    // Format like "15m", "1h", "7d"
    const m = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(trimmed);
    if (m) {
      const n = Number(m[1]);
      const unit = (m[2] ?? "s").toLowerCase();
      const mult = unit === "ms" ? 1 : unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
      return n * mult;
    }
    // Pure number string?
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum)) return asNum * 1000;
  }
  return fallbackSeconds * 1000;
};

/**
 * Helper: build AuthSession from the real backend's LoginResponse (1-step).
 * currentDepartmentRole is optional (superadmin has no department context).
 *
 * For users with more than one department we deliberately return
 * `currentDepartmentRole: undefined` so the admin shell can gate them at
 * `/select-department` and force them to pick a context.
 */
export const buildAuthSessionFromLogin = (
  login: Extract<LoginResponse, { authentication: unknown }>,
): AuthSession => {
  const { authentication, user, accessControl } = login;
  const primaryAssignment = userNeedsDepartmentSelection(user)
    ? undefined
    : deriveCurrentDepartmentRole(user);
  return {
    user,
    currentDepartmentRole: primaryAssignment,
    accessControl,
    accessToken: authentication.accessToken,
    refreshToken: authentication.refreshToken,
    expiresAt: Date.now() + parseExpiresInMs(authentication.expiresIn),
  };
};

export const buildAuthSessionFromDepartmentSelection = (
  response: SelectDepartmentResponse,
): AuthSession => ({
  user: response.user,
  currentDepartmentRole: response.currentDepartmentRole,
  accessControl: response.accessControl,
  accessToken: response.authentication.accessToken,
  refreshToken: response.authentication.refreshToken,
  expiresAt:
    Date.now() + parseExpiresInMs(response.authentication.expiresIn),
});

/**
 * Try to derive a UserDepartmentRole from the user object (departments + roles arrays).
 * For superadmin (no departments) this returns undefined and the session skips it.
 *
 * For users with more than one department, returns undefined too — the
 * caller (`buildAuthSessionFromLogin`) will route them to
 * `/select-department` first.
 */
const deriveCurrentDepartmentRole = (user: User): UserDepartmentRole | undefined => {
  if (userNeedsDepartmentSelection(user)) return undefined;
  const dept = user.departments?.[0];
  const role = user.roles?.[0];
  if (!dept || !role) return undefined;
  const now = new Date().toISOString();
  return {
    id: `${user.id}-${dept.id}-${role.id}`,
    userId: user.id,
    departmentId: dept.id,
    departmentName: dept.nameTh ?? dept.nameEn ?? dept.code,
    departmentCode: dept.code,
    roleId: role.id,
    roleName: role.name,
    roleCode: role.code,
    isPrimary: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
};

/**
 * Helper: build AuthSession from a 2-step spec response + accessControl.
 * Kept for the mock 2-step path; not used by the real backend.
 */
export const buildAuthSession = (
  login: SelectDepartmentResponse,
  accessControl: AccessControl,
): AuthSession => ({
  user: login.user,
  currentDepartmentRole: login.currentDepartmentRole,
  accessControl,
  accessToken: login.authentication.accessToken,
  refreshToken: login.authentication.refreshToken,
  expiresAt:
    Date.now() + parseExpiresInMs(login.authentication.expiresIn),
});
