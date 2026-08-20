"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MaterialModelsPage from "./page";

vi.mock("@/features/material-models/hooks/use-material-models", () => ({
  useMaterialModels: vi.fn(),
  useCreateMaterialModel: vi.fn(),
  useUpdateMaterialModel: vi.fn(),
  useDeactivateMaterialModel: vi.fn(),
  useRestoreMaterialModel: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import {
  useMaterialModels,
  useCreateMaterialModel,
  useUpdateMaterialModel,
  useDeactivateMaterialModel,
  useRestoreMaterialModel,
} from "@/features/material-models/hooks/use-material-models";

const mockM = (h: any) => h as unknown as ReturnType<typeof vi.fn>;

describe("MaterialModelsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMaterialModels as any).mockReturnValue({
      data: {
        items: [{
          id: "1", code: "MD-01", nameTh: "รุ่น A", nameEn: "Model A",
          description: null, isActive: true, createdBy: "9", updatedBy: "9",
          createdAt: "2026-08-04T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z",
        }],
        meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
      },
      isLoading: false,
      refetch: vi.fn(),
    });
    const m = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
    (useCreateMaterialModel as any).mockReturnValue(m);
    (useUpdateMaterialModel as any).mockReturnValue(m);
    (useDeactivateMaterialModel as any).mockReturnValue(m);
    (useRestoreMaterialModel as any).mockReturnValue(m);
  });

  it("renders page header and table", () => {
    render(<MaterialModelsPage />);
    expect(screen.getByText("จัดการรุ่นวัสดุ")).toBeInTheDocument();
    expect(screen.getAllByText("MD-01").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<MaterialModelsPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มรุ่นวัสดุ/i }));
    expect(screen.getAllByText(/เพิ่มรุ่นวัสดุ|แก้ไขรุ่นวัสดุ/).length).toBeGreaterThan(0);
  });
});
