/**
 * Mock handler helpers
 */
import { mockDb } from "../db";
import type { PaginatedResponse, PaginationParams, SortParams } from "@/types/common";

export interface ListQuery extends PaginationParams, SortParams {
  search?: string;
  status?: string;
  [key: string]: unknown;
}

export const ok = <T>(data: T, message = "Success", status = 200) =>
  new Response(
    JSON.stringify({ success: true, message, data, messageCode: "OK" }),
    { status, headers: { "Content-Type": "application/json" } },
  );

export const fail = (message: string, status = 400, code?: string) =>
  new Response(
    JSON.stringify({
      success: false,
      message,
      messageCode: code ?? "ERROR",
      data: null,
    }),
    { status, headers: { "Content-Type": "application/json" } },
  );

export const paginate = <T>(items: T[], query: ListQuery): PaginatedResponse<T> => {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, query.pageSize ?? 10));
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const sorted = sortItems(items, query.sortBy, query.sortOrder);
  return {
    items: sorted.slice(start, end),
    page,
    pageSize,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
};

const sortItems = <T>(items: T[], sortBy?: string, sortOrder?: "asc" | "desc"): T[] => {
  if (!sortBy) return items;
  const dir = sortOrder === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
};

export const matchPath = (path: string, pattern: RegExp): RegExpMatchArray | null => {
  return path.match(pattern);
};

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const simulateLatency = (ms = 250): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getBody = async (body: unknown): Promise<Record<string, unknown>> => {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof body === "object") return body as Record<string, unknown>;
  return {};
};

export const isAuthenticated = (_options: { headers?: HeadersInit }): boolean => {
  // Mock mode: always authenticated
  return mockDb.users.length > 0;
};
