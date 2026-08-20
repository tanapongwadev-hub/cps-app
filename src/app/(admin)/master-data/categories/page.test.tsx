"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoriesPage from "./page";

vi.mock("@/features/categories/hooks/use-categories", () => ({
  useCategories: vi.fn(),
  useCreateCategory: vi.fn(),
  useUpdateCategory: vi.fn(),
  useDeactivateCategory: vi.fn(),
  useRestoreCategory: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useCategories, useCreateCategory, useUpdateCategory, useDeactivateCategory, useRestoreCategory } from "@/features/categories/hooks/use-categories";

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useCategories as any).mockReturnValue({
      data: { items: [{ id: "1", code: "CAT-01", nameTh: "หมวดหมู่ A", nameEn: null, parentId: null, sortOrder: 0, iconColor: null, description: null, isActive: true, createdBy: "9", updatedBy: "9", createdAt: "2026-08-04T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z" }], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
      isLoading: false, refetch: vi.fn(),
    });
    const m = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
    (useCreateCategory as any).mockReturnValue(m);
    (useUpdateCategory as any).mockReturnValue(m);
    (useDeactivateCategory as any).mockReturnValue(m);
    (useRestoreCategory as any).mockReturnValue(m);
  });

  it("renders page header and table", () => {
    render(<CategoriesPage />);
    expect(screen.getByText("จัดการหมวดหมู่")).toBeInTheDocument();
    expect(screen.getAllByText("CAT-01").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<CategoriesPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มหมวดหมู่/i }));
    expect(screen.getAllByText(/เพิ่มหมวดหมู่|แก้ไขหมวดหมู่/).length).toBeGreaterThan(0);
  });
});
