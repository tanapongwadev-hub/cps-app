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
  LoginSuccessResponse,
  LoginRequiresDepartmentSelectionResponse,
  SelectDepartmentResponse,
} from "@/types/auth";
import { SESSION_STORAGE_KEYS } from "@/constants/app";

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
 * State เก็บไว้ใน client
 */
export interface PendingDepartmentSelection {
  departmentSelectionToken: string;
  user: User;
  options: LoginRequiresDepartmentSelectionResponse["userDepartmentRoles"];
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

  // 2-step login state
  pendingSelection: PendingDepartmentSelection | null;

  // Actions
  setSession: (session: AuthSession) => void;
  setTokens: (accessToken: string, refreshToken?: string, expiresAt?: number) => void;
  expireSession: () => void;
  setLoading: (loading: boolean) => void;
  setPendingSelection: (data: PendingDepartmentSelection | null) => void;
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
      pendingSelection: null,

      setSession: (session) =>
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
          pendingSelection: null,
        }),

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
      expireSession: () =>
        set({
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setPendingSelection: (data) => set({ pendingSelection: data }),

      switchDepartmentRole: (udr, accessControl) =>
        set({
          currentDepartmentRole: udr,
          accessControl,
          permissions: accessControl.permissions,
          menu: accessControl.menus,
        }),

      logout: () =>
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
          pendingSelection: null,
        }),

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
      }),
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
 */
export const buildAuthSessionFromLogin = (login: LoginResponse): AuthSession => {
  const { authentication, user, accessControl } = login;
  const primaryAssignment = deriveCurrentDepartmentRole(user);
  return {
    user,
    currentDepartmentRole: primaryAssignment,
    accessControl,
    accessToken: authentication.accessToken,
    refreshToken: authentication.refreshToken,
    expiresAt: Date.now() + parseExpiresInMs(authentication.expiresIn),
  };
};

/**
 * Try to derive a UserDepartmentRole from the user object (departments + roles arrays).
 * For superadmin (no departments) this returns undefined and the session skips it.
 */
const deriveCurrentDepartmentRole = (user: User): UserDepartmentRole | undefined => {
  const dept = user.departments?.[0];
  const role = user.roles?.[0];
  if (!dept || !role) return undefined;
  const now = new Date().toISOString();
  return {
    id: `${user.id}-${dept.id}-${role.id}`,
    userId: user.id,
    departmentId: dept.id,
    departmentName: dept.name,
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
  login: LoginSuccessResponse | SelectDepartmentResponse,
  accessControl: AccessControl,
): AuthSession => ({
  user: login.user,
  currentDepartmentRole: login.currentDepartmentRole,
  accessControl,
  accessToken: login.accessToken,
  refreshToken: login.refreshToken,
  expiresAt: Date.now() + parseExpiresInMs(login.expiresIn),
});
