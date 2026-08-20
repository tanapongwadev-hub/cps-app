"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SuppliersPage from "./page";

vi.mock("@/features/suppliers/hooks/use-suppliers", () => ({
  useSuppliers: vi.fn(),
  useCreateSupplier: vi.fn(),
  useUpdateSupplier: vi.fn(),
  useDeactivateSupplier: vi.fn(),
  useRestoreSupplier: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeactivateSupplier,
  useRestoreSupplier,
} from "@/features/suppliers/hooks/use-suppliers";

const mockedUseSuppliers = useSuppliers as unknown as ReturnType<typeof vi.fn>;
const mockedUseCreateSupplier = useCreateSupplier as unknown as ReturnType<typeof vi.fn>;
const mockedUseUpdateSupplier = useUpdateSupplier as unknown as ReturnType<typeof vi.fn>;
const mockedUseDeactivateSupplier = useDeactivateSupplier as unknown as ReturnType<typeof vi.fn>;
const mockedUseRestoreSupplier = useRestoreSupplier as unknown as ReturnType<typeof vi.fn>;

describe("SuppliersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseSuppliers.mockReturnValue({
      data: {
        items: [
          {
            id: "1",
            code: "SUP-001",
            nameTh: "บริษัท ABC",
            nameEn: null,
            taxId: "0105560001234",
            contactName: "สมชาย",
            telephone: "02-123-4567",
            email: null,
            address: null,
            isActive: true,
            createdBy: "9",
            updatedBy: "9",
            createdAt: "2026-08-04T00:00:00.000Z",
            updatedAt: "2026-08-04T00:00:00.000Z",
          },
        ],
        meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    const mockMutation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
    mockedUseCreateSupplier.mockReturnValue(mockMutation);
    mockedUseUpdateSupplier.mockReturnValue(mockMutation);
    mockedUseDeactivateSupplier.mockReturnValue(mockMutation);
    mockedUseRestoreSupplier.mockReturnValue(mockMutation);
  });

  it("renders page header and table", () => {
    render(<SuppliersPage />);
    expect(screen.getByText("จัดการผู้จัดจำหน่าย")).toBeInTheDocument();
    expect(screen.getAllByText("SUP-001").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<SuppliersPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มผู้จัดจำหน่าย/i }));
    expect(
      screen.getAllByText(/เพิ่มผู้จัดจำหน่าย|แก้ไขผู้จัดจำหน่าย/).length,
    ).toBeGreaterThan(0);
  });
});
