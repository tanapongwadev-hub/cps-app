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
}

export interface User extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Computed/display full name (used by UI) */
  fullName: string;
  /** Backend-provided display name (optional, may differ from fullName) */
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  status: Status;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  language?: string;
  timezone?: string;
  twoFactorEnabled?: boolean;

  /** True if the user has the SUPER_ADMIN system role */
  isSuperAdmin?: boolean;

  /** Roles assigned to the user (subset returned by /auth/login) */
  roles?: UserRole[];
  /** Departments assigned to the user (subset returned by /auth/login) */
  departments?: UserDepartment[];

  // Convenience fields - populated from /auth/me or from UserDepartmentRole
  /** Derived from currentDepartmentRole */
  departmentId?: string;
  departmentName?: string;
  /** Derived from currentDepartmentRole */
  roleIds?: string[];
  roleNames?: string[];
  /** Derived from accessControl */
  permissions?: string[];
}

/**
 * Assignment ของ user กับ department + role
 * 1 user สามารถมีหลาย assignments
 * (Spec 2-step flow — kept for future use; real backend currently uses 1-step)
 */
export interface UserDepartmentRole extends BaseEntity {
  userId: string;
  departmentId: string;
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
 * 1-step flow — the real backend returns tokens + user + accessControl in one shot.
 */
export interface LoginResponse {
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

// ---------- 2-step flow (spec / future) ----------

export interface LoginSuccessResponse {
  status: "authenticated";
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
  user: User;
  currentDepartmentRole: UserDepartmentRole;
}

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
