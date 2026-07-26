/**
 * Date utilities - wrappers around date-fns for consistent formatting
 */
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { th } from "date-fns/locale";

export const DEFAULT_LOCALE = "th";

export const formatDate = (date: string | Date | null | undefined, fmt = "dd MMM yyyy"): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "-";
  return format(d, fmt, { locale: th });
};

export const formatDateTime = (
  date: string | Date | null | undefined,
  fmt = "dd MMM yyyy HH:mm",
): string => {
  return formatDate(date, fmt);
};

export const formatTime = (date: string | Date | null | undefined, fmt = "HH:mm"): string => {
  return formatDate(date, fmt);
};

export const formatRelative = (date: string | Date | null | undefined): string => {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "-";
  return formatDistanceToNow(d, { addSuffix: true, locale: th });
};

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
};

export const toISO = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString();
};

export const fromISO = (date: string | null | undefined): Date | null => {
  if (!date) return null;
  const d = parseISO(date);
  return isValid(d) ? d : null;
};
