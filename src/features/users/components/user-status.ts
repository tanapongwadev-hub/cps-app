import type { User } from "@/features/auth/types";

/**
 * Map the real backend `isActive` boolean to a derived UI status.
 * (The legacy `status` field is no longer in the backend response — we
 *  compute it here so the table can keep its badge column.)
 */
export function toUiStatus(u: User): "active" | "inactive" {
  return u.isActive ? "active" : "inactive";
}

export const statusVariants: Record<"active" | "inactive", "success" | "muted"> = {
  active: "success",
  inactive: "muted",
};

export const statusLabels: Record<"active" | "inactive", string> = {
  active: "ใช้งาน",
  inactive: "ระงับ",
};
