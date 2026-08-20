"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DeliveryTypesPage from "./page";

vi.mock("@/features/delivery-types/hooks/use-delivery-types", () => ({
  useDeliveryTypes: vi.fn(),
  useCreateDeliveryType: vi.fn(),
  useUpdateDeliveryType: vi.fn(),
  useDeactivateDeliveryType: vi.fn(),
  useRestoreDeliveryType: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useDeliveryTypes, useCreateDeliveryType, useUpdateDeliveryType, useDeactivateDeliveryType, useRestoreDeliveryType } from "@/features/delivery-types/hooks/use-delivery-types";

describe("DeliveryTypesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDeliveryTypes as any).mockReturnValue({
      data: { items: [{ id: "1", code: "DT-01", nameTh: "จัดส่งด่วน", nameEn: "Express", description: null, isActive: true, createdBy: "9", updatedBy: "9", createdAt: "2026-08-04T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z" }], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
      isLoading: false, refetch: vi.fn(),
    });
    const m = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
    (useCreateDeliveryType as any).mockReturnValue(m);
    (useUpdateDeliveryType as any).mockReturnValue(m);
    (useDeactivateDeliveryType as any).mockReturnValue(m);
    (useRestoreDeliveryType as any).mockReturnValue(m);
  });

  it("renders page header and table", () => {
    render(<DeliveryTypesPage />);
    expect(screen.getByText("จัดการประเภทการจัดส่ง")).toBeInTheDocument();
    expect(screen.getAllByText("DT-01").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<DeliveryTypesPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มประเภทการจัดส่ง/i }));
    expect(screen.getAllByText(/เพิ่มประเภทการจัดส่ง|แก้ไขประเภทการจัดส่ง/).length).toBeGreaterThan(0);
  });
});
