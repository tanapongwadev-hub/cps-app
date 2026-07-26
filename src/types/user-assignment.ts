/**
 * User Assignment types - ใช้สำหรับ /users/:id/assignments
 */
import type { BaseEntity } from "@/types/common";

export interface UserAssignment extends BaseEntity {
  userId: string;
  departmentId: string;
  departmentName: string;
  roleId: string;
  roleName: string;
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
  status: "active" | "inactive";
}
