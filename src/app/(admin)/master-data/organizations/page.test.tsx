"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import OrganizationsPage from "./page";

vi.mock("@/features/organizations/hooks/use-organizations", () => ({
  useOrganizations: vi.fn(),
  useCreateOrganization: vi.fn(),
  useUpdateOrganization: vi.fn(),
  useDeactivateOrganization: vi.fn(),
  useRestoreOrganization: vi.fn(),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeactivateOrganization, useRestoreOrganization } from "@/features/organizations/hooks/use-organizations";

describe("OrganizationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useOrganizations as any).mockReturnValue({
      data: { items: [{ id: "1", code: "ORG-01", nameTh: "บริษัท ABC", nameEn: "ABC Co.", taxId: "0105560001234", address: "Bangkok", phone: "02-123-4567", email: "info@abc.co.th", website: null, logoUrl: null, parentId: null, type: "headquarters", isActive: true, createdBy: "9", updatedBy: "9", createdAt: "2026-08-04T00:00:00.000Z", updatedAt: "2026-08-04T00:00:00.000Z" }], meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 } },
      isLoading: false, refetch: vi.fn(),
    });
    const m = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };
    (useCreateOrganization as any).mockReturnValue(m);
    (useUpdateOrganization as any).mockReturnValue(m);
    (useDeactivateOrganization as any).mockReturnValue(m);
    (useRestoreOrganization as any).mockReturnValue(m);
  });

  it("renders page header and table", () => {
    render(<OrganizationsPage />);
    expect(screen.getByText("จัดการองค์กร")).toBeInTheDocument();
    expect(screen.getAllByText("ORG-01").length).toBeGreaterThan(0);
  });

  it("opens form dialog when clicking add button", () => {
    render(<OrganizationsPage />);
    fireEvent.click(screen.getByRole("button", { name: /เพิ่มองค์กร/i }));
    expect(screen.getAllByText(/เพิ่มองค์กร|แก้ไของค์กร/).length).toBeGreaterThan(0);
  });
});
