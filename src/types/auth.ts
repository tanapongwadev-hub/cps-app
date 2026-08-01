/**
 * Auth-related types
 * Aligned with the real NestJS backend response shape:
 *   POST /auth/login → { success, message, data: { authentication, user, accessControl }, timestamp }
 *   data.authentication = { accessToken, refreshToken, tokenType, expiresIn }
 *   data.user          = { id, username, firstName, lastName, displayName, email, isSuperAdmin, roles, departments }
 *   data.accessControl = { menus: MenuItem[], permissions: string[] }
 */
import type { BaseEntity, Status } from "@/types/common";
import type { MenuItem } from "@/types/menu";

// Re-export Role/Department for convenience
export type { Role } from "@/types/role";
export type { Department } from "@/types/department";

/** Minimal role shape returned by the backend (used inside User.roles) */
export interface UserRole {
  id: string;
  code: string;
  name: string;
}

/** Minimal department shape returned by the backend (used inside User.departments) */
export interface UserDepartment {
  id: string;
  code: string;
  name: string;
  /** Thai name — present in some endpoint responses */
  nameTh?: string;
  /** English name — present in some endpoint responses */
  nameEn?: string;
}

/**
 * Real backend User shape (returned by GET /users, GET /users/:id, POST /users, PATCH /users/:id).
 *
 *  {
 *    "id", "username", "firstName", "lastName", "email",
 *    "telephone", "isActive", "isLocked",
 *    "failedLoginAttempts", "lockedUntil", "lastLoginAt",
 *    "permissionVersion", "createdAt", "updatedAt"
 *  }
 *
 * Many fields used by the UI (fullName, status, roleNames, departmentName, …)
 * are *derived* client-side from this base shape and from /users/:id/assignments.
 */
export interface User extends BaseEntity {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Computed/display full name (used by UI). Backend doesn't return this directly. */
  fullName?: string;
  /** Backend-provided display name (optional, may differ from fullName) */
  displayName?: string;
  /**
   * Phone number. Real backend uses `telephone` — we keep both names so legacy
   * UI code keeps working; the form sends `telephone` to the backend.
   */
  telephone?: string | null;
  phone?: string;

  // ---- Real backend fields ----
  isActive: boolean;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  lastLoginAt?: string | null;
  lastLoginIp?: string | null;
  permissionVersion?: number;

  // ---- Legacy / derived UI fields (optional) ----
  /** Computed from `isActive` for backwards compatibility. */
  status?: Status;
  avatarUrl?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  language?: string;
  timezone?: string;
  twoFactorEnabled?: boolean;

  /** True if the user has the SUPER_ADMIN system role */
  isSuperAdmin?: boolean;

  /** Roles assigned to the user (subset returned by /auth/login) */
  roles?: UserRole[];
  /** Departments assigned to the user (subset returned by /auth/login) */
  departments?: UserDepartment[];

  // ---- Convenience fields - derived from /users/:id/assignments or currentDepartmentRole ----
  departmentId?: string;
  departmentName?: string;
  roleIds?: string[];
  roleNames?: string[];
  permissions?: string[];
  /** Full assignment records (department + role + isActive) — populated by detail/assignments calls */
  assignments?: UserAssignment[];
}

/**
 * A single (user, department, role) tuple — exactly what
 * GET/POST /users/:id/assignments returns.
 */
export interface UserAssignment {
  id: string;
  userId: string;
  departmentId: string | null;
  roleId: string;
  isActive: boolean;
  assignedAt?: string;
  assignedBy?: string | null;
  expiredAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Populated by GET /users/:id/assignments */
  department?: UserDepartment | null;
  role?: UserRole & {
    nameTh?: string;
    nameEn?: string;
    scopeType?: "SYSTEM" | "DEPARTMENT";
  };
}

/**
 * Assignment ของ user กับ department + role
 * 1 user สามารถมีหลาย assignments
 * (Spec 2-step flow — kept for future use; real backend currently uses 1-step)
 */
export interface UserDepartmentRole extends BaseEntity {
  userId: string;
  departmentId: string | null;
  departmentName: string;
  departmentCode: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  isPrimary: boolean;
  isActive: boolean;
}

/** Department info (subset) */
export interface DepartmentInfo {
  id: string;
  code: string;
  name: string;
  nameTh?: string;
  nameEn?: string;
}

/** Role info (subset) */
export interface RoleInfo {
  id: string;
  code: string;
  name: string;
}

/** Assignment summary (ใช้ตอน list เลือก department) */
export interface DepartmentRoleOption {
  userDepartmentRoleId: string;
  department: DepartmentInfo;
  role: RoleInfo;
  isPrimary: boolean;
}

/**
 * Real backend's flat shape for a single (department, role) option in the
 * 2-step login `departments[]` array. Different from `DepartmentRoleOption`
 * (which is the spec/nested shape used by the UI internally).
 */
export interface BackendDepartmentOption {
  userDepartmentRoleId: string;
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  roleCode: string;
}

/**
 * AccessControl - สิทธิ์และเมนูที่ user มี
 * ดึงมาจาก /auth/login (data.accessControl) และ /auth/me
 */
export interface AccessControl {
  permissions: string[];
  menus: MenuItem[];
  /** Optional context from the spec's multi-dept flow */
  userDepartmentRoleId?: string;
  departmentId?: string;
  roleId?: string;
}

/**
 * Response จาก /auth/login (the inner `data` object after apiClient unwraps the envelope)
 *
 * 1-step flow (superadmin or user with 1 dept): the real backend returns
 * tokens + user + accessControl in one shot.
 *
 * 2-step flow (user with >1 dept): backend returns
 * `{ requiresDepartmentSelection, departmentSelectionToken, departments }`
 * and the client must POST /auth/select-department to get the real session.
 */
export type LoginResponse =
  | {
      authentication: {
        accessToken: string;
        refreshToken: string;
        tokenType: "Bearer";
        /** Backend may send number (seconds) or string ("15m"). We normalize to seconds in the client. */
        expiresIn: number | string;
      };
      user: User;
      accessControl: AccessControl;
    }
  | BackendLoginRequiresDepartmentSelection;

/** Type guard for the 1-step login response (has `authentication`). */
export const isLoginSuccessResponse = (
  payload: LoginResponse,
): payload is Extract<LoginResponse, { authentication: unknown }> => {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "authentication" in payload &&
    !!(payload as { authentication?: unknown }).authentication
  );
};

/**
 * Response จาก /auth/me
 * (Some backends return this; the real backend may or may not — handled defensively.)
 */
export interface AuthMeResponse {
  user: User;
  userDepartmentRoles?: UserDepartmentRole[];
  currentDepartmentRole?: UserDepartmentRole;
  accessControl: AccessControl;
}

// ---------- 2-step flow (spec + real backend) ----------

/**
 * The real backend's 2-step login response shape.
 *
 * When a user is assigned to more than one department, POST /auth/login
 * returns this instead of the immediate `LoginResponse`:
 *
 *   {
 *     requiresDepartmentSelection: true,
 *     departmentSelectionToken: "<jwt>",
 *     departments: [
 *       { userDepartmentRoleId, departmentId, departmentCode,
 *         departmentName, roleCode },
 *       ...
 *     ]
 *   }
 *
 * The client must then POST /auth/select-department with the
 * `departmentSelectionToken` and the chosen `userDepartmentRoleId` to
 * receive the real session.
 */
export interface BackendLoginRequiresDepartmentSelection {
  requiresDepartmentSelection: true;
  departmentSelectionToken: string;
  /** Pre-computed (dept, role) options for the user to pick from. */
  departments: BackendDepartmentOption[];
  /** Optional — not all backends return this. */
  user?: User;
}

/** Type guard: is the login payload a 2-step "needs department" response? */
export const isLoginRequiresDepartmentSelection = (
  payload: unknown,
): payload is BackendLoginRequiresDepartmentSelection => {
  if (!payload || typeof payload !== "object") return false;
  const obj = payload as Record<string, unknown>;
  return obj.requiresDepartmentSelection === true && typeof obj.departmentSelectionToken === "string";
};

/** Spec-style 2-step shape (mock-only, kept for compat). */
export interface LoginRequiresDepartmentSelectionResponse {
  status: "department_selection_required";
  departmentSelectionToken: string;
  user: User;
  userDepartmentRoles: DepartmentRoleOption[];
}

/**
 * Response จาก /auth/select-department
 */
export interface SelectDepartmentResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: User;
  currentDepartmentRole: UserDepartmentRole;
}

/**
 * Response จาก /auth/refresh
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Request DTOs
 */
export interface LoginRequest {
  username: string;
  password: string;
  remember?: boolean;
}

export interface SelectDepartmentRequest {
  departmentSelectionToken: string;
  userDepartmentRoleId: string;
}

export interface SwitchDepartmentRequest {
  userDepartmentRoleId: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * AuthSession - state ใน client
 * currentDepartmentRole is optional (real backend superadmin has no department context)
 */
export interface AuthSession {
  user: User;
  currentDepartmentRole?: UserDepartmentRole;
  accessControl: AccessControl;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}
