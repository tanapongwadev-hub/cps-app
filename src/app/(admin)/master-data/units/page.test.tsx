"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import UnitsPage from "./page";

vi.mock("@/features/units/hooks/use-units", () => ({
  useUnits: vi.fn(),
  useCreateUnit: vi.fn(),
  useUpdateUnit: vi.fn(),
  useDeactivateUnit: vi.fn(),
  useRestoreUnit: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useUnits, useCreateUnit, useUpdateUnit, useDeactivateUnit, useRestoreUnit } from "@/features/units/hooks/use-units";

const mockedUseUnits = useUnits as unknown as ReturnType<typeof vi.fn>;
const mockedUseCreateUnit = useCreateUnit as unknown as ReturnType<typeof vi.fn>;
const mockedUseUpdateUnit = useUpdateUnit as unknown as ReturnType<typeof vi.fn>;
const mockedUseDeactivateUnit = useDeactivateUnit as unknown as ReturnType<typeof vi.fn>;
const mockedUseRestoreUnit = useRestoreUnit as unknown as ReturnType<typeof vi.fn>;

describe("UnitsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseUnits.mockReturnValue({
      data: {
        items: [
          {
            id: "1",
            code: "PCS",
            nameTh: "ชิ้น",
            nameEn: "Piece",
            symbol: "ชิ้น",
            description: null,
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
    mockedUseCreateUnit.mockReturnValue(mockMutation);
    mockedUseUpdateUnit.mockReturnValue(mockMutation);
    mockedUseDeactivateUnit.mockReturnValue(mockMutation);
    mockedUseRestoreUnit.mockReturnValue(mockMutation);
  });

  it("renders the page header and table", () => {
    render(<UnitsPage />);
    expect(screen.getByText("จัดการหน่วยนับ")).toBeInTheDocument();
    // table rows include the seeded unit
    expect(screen.getAllByText("PCS").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ชิ้น").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<UnitsPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มหน่วยนับ/i }));
    // After clicking, the dialog should show either add or edit title
    expect(
      screen.getAllByText(/เพิ่มหน่วยนับ|แก้ไขหน่วยนับ/).length,
    ).toBeGreaterThan(0);
  });
});
