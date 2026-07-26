/**
 * Notification types
 */
export type NotificationType = "info" | "success" | "warning" | "danger";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  icon?: string;
}
