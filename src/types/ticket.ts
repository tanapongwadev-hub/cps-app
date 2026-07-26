/**
 * Ticket-related types
 */
import type { BaseEntity, Priority } from "@/types/common";

export type TicketStatus =
  | "PENDING"
  | "PENDING_IAPP"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED"
  | "REJECTED";

export interface TicketComment extends BaseEntity {
  ticketId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  isInternal: boolean;
  attachments?: TicketAttachment[];
}

export interface TicketAttachment extends BaseEntity {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedByName: string;
}

export interface TicketActivity extends BaseEntity {
  ticketId: string;
  type: "status_change" | "assignment" | "comment" | "attachment" | "create" | "update";
  description: string;
  performedBy: string;
  performedByName: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

export interface Ticket extends BaseEntity {
  ticketNumber: string;
  subject: string;
  description: string;
  categoryId: string;
  categoryName: string;
  priority: Priority;
  status: TicketStatus;
  requesterId: string;
  requesterName: string;
  assigneeId?: string;
  assigneeName?: string;
  departmentId: string;
  departmentName: string;
  dueDate?: string;
  resolvedAt?: string;
  closedAt?: string;
  commentCount: number;
  attachmentCount: number;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface TicketFilters {
  search?: string;
  status?: TicketStatus | TicketStatus[];
  priority?: Priority | Priority[];
  categoryId?: string;
  requesterId?: string;
  assigneeId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
}
