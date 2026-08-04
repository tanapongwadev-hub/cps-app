"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StatusesPage from "./page";

vi.mock("@/features/status-items/hooks/use-status-items", () => ({
  useStatusItems: vi.fn(),
  useCreateStatusItem: vi.fn(),
  useUpdateStatusItem: vi.fn(),
  useDeactivateStatusItem: vi.fn(),
  useRestoreStatusItem: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useStatusItems, useCreateStatusItem, useUpdateStatusItem, useDeactivateStatusItem, useRestoreStatusItem } from "@/features/status-items/hooks/use-status-items";

describe("StatusesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useStatusItems as any).mockReturnValue({
      data: { items: [{ id: "1", code: "ST-01", nameTh: "เปิด", nameEn: "Open", color: "info", module: "tickets", isDefault: true, sortOrder: 0, description: null, isActive: true, createdBy: "9", updatedBy: "9", createdAt: "2026-08-04T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z" }], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
      isLoading: false, refetch: vi.fn(),
    });
    const m = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
    (useCreateStatusItem as any).mockReturnValue(m);
    (useUpdateStatusItem as any).mockReturnValue(m);
    (useDeactivateStatusItem as any).mockReturnValue(m);
    (useRestoreStatusItem as any).mockReturnValue(m);
  });

  it("renders page header and table", () => {
    render(<StatusesPage />);
    expect(screen.getByText("จัดการสถานะ")).toBeInTheDocument();
    expect(screen.getAllByText("ST-01").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<StatusesPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มสถานะ/i }));
    expect(screen.getAllByText(/เพิ่มสถานะ|แก้ไขสถานะ/).length).toBeGreaterThan(0);
  });
});
