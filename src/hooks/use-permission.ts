/**
 * Permission utilities & hooks
 *
 * Super admin is detected via:
 *   1) `user.isSuperAdmin === true`  — real NestJS backend sets this on /auth/login
 *   2) `permissions` contains "*"    — template/mock super admin
 */
"use client";

import { useAuthStore, isSuperAdminUser } from "@/stores/auth-store";
import { PERMISSIONS } from "@/constants/permissions";

export const hasPermission = (permissions: string[], required: string | string[]): boolean => {
  // We can't see the user here without coupling, so just fall back to "*"
  if (permissions.includes("*") || permissions.includes("SUPER_ADMIN")) return true;
  if (Array.isArray(required)) {
    return required.some((p) => permissions.includes(p));
  }
  return permissions.includes(required);
};

export const hasAnyPermission = (permissions: string[], required: string[]): boolean => {
  if (permissions.includes("*") || permissions.includes("SUPER_ADMIN")) return true;
  return required.some((p) => permissions.includes(p));
};

export const hasAllPermissions = (permissions: string[], required: string[]): boolean => {
  if (permissions.includes("*") || permissions.includes("SUPER_ADMIN")) return true;
  return required.every((p) => permissions.includes(p));
};

export const isSuperAdmin = (permissions: string[]): boolean => {
  return permissions.includes("*") || permissions.includes("SUPER_ADMIN");
};

export function usePermission(): {
  permissions: string[];
  hasPermission: (required: string | string[]) => boolean;
  hasAny: (required: string[]) => boolean;
  hasAll: (required: string[]) => boolean;
  isSuperAdmin: () => boolean;
} {
  const permissions = useAuthStore((s) => s.permissions);
  const user = useAuthStore((s) => s.user);
  const superAdmin = isSuperAdminUser(user, permissions);
  return {
    permissions,
    hasPermission: (required) => {
      if (superAdmin) return true;
      return hasPermission(permissions, required);
    },
    hasAny: (required) => {
      if (superAdmin) return true;
      return hasAnyPermission(permissions, required);
    },
    hasAll: (required) => {
      if (superAdmin) return true;
      return hasAllPermissions(permissions, required);
    },
    isSuperAdmin: () => superAdmin,
  };
}

export function useHasPermission(required: string | string[]): boolean {
  const permissions = useAuthStore((s) => s.permissions);
  const user = useAuthStore((s) => s.user);
  if (isSuperAdminUser(user, permissions)) return true;
  return hasPermission(permissions, required);
}

// Re-export for test compatibility
export { PERMISSIONS };
