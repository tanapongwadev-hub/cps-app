/**
 * Master Data types
 */
import type { BaseEntity, Status } from "@/types/common";

export interface Category extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  parentId?: string | null;
  sortOrder: number;
  status: Status;
  iconColor?: string;
}

export interface StatusItem extends BaseEntity {
  code: string;
  name: string;
  description?: string;
  color: string;
  module: string;
  isDefault: boolean;
  sortOrder: number;
  status: Status;
}

export interface Organization extends BaseEntity {
  code: string;
  name: string;
  nameEn?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  parentId?: string | null;
  type: "headquarters" | "branch" | "subsidiary" | "department";
  status: Status;
}
