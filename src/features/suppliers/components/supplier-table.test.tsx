import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Supplier } from "../api/suppliers-api";
import { SupplierTable } from "./supplier-table";

const supplier: Supplier = {
  id: "supplier-1",
  code: "SUP-001",
  nameTh: "ผู้จัดจำหน่ายหนึ่ง",
  nameEn: "Supplier One",
  taxId: null,
  contactName: null,
  telephone: null,
  email: null,
  address: null,
  isActive: true,
  createdBy: null,
  updatedBy: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

describe("SupplierTable action menus", () => {
  function renderSuppliers() {
    render(
      <SupplierTable
        suppliers={[
          supplier,
          { ...supplier, id: "supplier-2", code: "SUP-002", nameTh: "ผู้จัดจำหน่ายสอง" },
        ]}
        isLoading={false}
        page={1}
        pageSize={20}
        totalItems={2}
        totalPages={1}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onEdit={vi.fn()}
        onStatusChange={vi.fn()}
      />,
    );
  }

  it("gives each row action trigger a label containing its supplier code", () => {
    renderSuppliers();

    expect(screen.getByRole("button", { name: "จัดการผู้จัดจำหน่าย SUP-001" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "จัดการผู้จัดจำหน่าย SUP-002" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "เมนู" })).not.toBeInTheDocument();
  });

  it("uses a compact right-aligned action column", () => {
    renderSuppliers();

    const actionCell = screen
      .getByRole("button", { name: "จัดการผู้จัดจำหน่าย SUP-001" })
      .closest("td");
    expect(actionCell).toHaveStyle({ width: "56px" });
    expect(actionCell).toHaveClass("text-right");
  });
});
