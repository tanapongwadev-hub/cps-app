"use client";

import * as React from "react";
import { usePermission } from "@/hooks/use-permission";

interface PermissionGuardProps {
  permission?: string | string[];
  anyPermission?: string[];
  allPermissions?: string[];
  /** Render this if permission check fails (defaults to nothing) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Conditionally render children based on the current user's permissions.
 *
 * @example
 *   <PermissionGuard permission="user.create">
 *     <Button>Create</Button>
 *   </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  anyPermission,
  allPermissions,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAny, hasAll } = usePermission();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  }

  if (allowed && anyPermission && anyPermission.length > 0) {
    allowed = hasAny(anyPermission);
  }

  if (allowed && allPermissions && allPermissions.length > 0) {
    allowed = hasAll(allPermissions);
  }

  return <>{allowed ? children : fallback}</>;
}
