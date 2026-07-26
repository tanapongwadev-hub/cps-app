/**
 * Department types
 */
import type { BaseEntity, Status } from "@/types/common";

export interface Department extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  managerId?: string;
  managerName?: string;
  status: Status;
  sortOrder: number;
  userCount?: number;
  children?: Department[];
}
