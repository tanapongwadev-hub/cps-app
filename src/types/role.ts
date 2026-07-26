/**
 * Role types
 */
import type { BaseEntity, Status } from "@/types/common";

export interface Role extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  status: Status;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
}
