"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoadingPointsPage from "./page";

vi.mock("@/features/loading-points/hooks/use-loading-points", () => ({
  useLoadingPoints: vi.fn(),
  useCreateLoadingPoint: vi.fn(),
  useUpdateLoadingPoint: vi.fn(),
  useDeactivateLoadingPoint: vi.fn(),
  useRestoreLoadingPoint: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useLoadingPoints, useCreateLoadingPoint, useUpdateLoadingPoint, useDeactivateLoadingPoint, useRestoreLoadingPoint } from "@/features/loading-points/hooks/use-loading-points";

describe("LoadingPointsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useLoadingPoints as any).mockReturnValue({
      data: { items: [{ id: "1", code: "LP-01", nameTh: "จุดขนถ่าย A", nameEn: "Loading Point A", description: null, isActive: true, createdBy: "9", updatedBy: "9", createdAt: "2026-08-04T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z" }], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
      isLoading: false, refetch: vi.fn(),
    });
    const m = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
    (useCreateLoadingPoint as any).mockReturnValue(m);
    (useUpdateLoadingPoint as any).mockReturnValue(m);
    (useDeactivateLoadingPoint as any).mockReturnValue(m);
    (useRestoreLoadingPoint as any).mockReturnValue(m);
  });

  it("renders page header and table", () => {
    render(<LoadingPointsPage />);
    expect(screen.getByText("จัดการจุดขนถ่าย")).toBeInTheDocument();
    expect(screen.getAllByText("LP-01").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<LoadingPointsPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มจุดขนถ่าย/i }));
    expect(screen.getAllByText(/เพิ่มจุดขนถ่าย|แก้ไขจุดขนถ่าย/).length).toBeGreaterThan(0);
  });
});
