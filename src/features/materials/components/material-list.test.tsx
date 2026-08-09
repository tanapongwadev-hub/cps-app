import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ListMaterialsParams, Material, MaterialLookups } from "../api/materials-api";
import { MaterialFilters } from "./material-filters";
import { MaterialStatusDialog } from "./material-status-dialog";
import { MaterialTable } from "./material-table";

const lookups: MaterialLookups = {
  units: [{ id: "1", code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram", symbol: "kg" }],
  models: [{ id: "2", code: "M-01", nameTh: "รุ่นมาตรฐาน", nameEn: null }],
  deliveryTypes: [{ id: "3", code: "DIRECT", nameTh: "ส่งตรง", nameEn: null }],
  loadingPoints: [{ id: "4", code: "LP-A", nameTh: "จุดรับ A", nameEn: null }],
  suppliers: [
    {
      id: "10",
      code: "SUP-10",
      nameTh: "บริษัท เหล็กไทย",
      nameEn: null,
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
    },
  ],
};

const material: Material = {
  id: "99",
  code: "MAT-099",
  name: "เหล็กแผ่น",
  unitId: "1",
  deliveryTypeId: "3",
  modelId: "2",
  loadingPointId: "4",
  processLineName: "Line A",
  scale: "10.50",
  imagePath: "/uploads/materials/steel.webp",
  specification: "SS400",
  description: null,
  packingQuantity: null,
  isActive: true,
  createdBy: "1",
  updatedBy: "1",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
  unit: first(lookups.units),
  model: first(lookups.models),
  deliveryType: first(lookups.deliveryTypes),
  loadingPoint: first(lookups.loadingPoints),
  suppliers: [first(lookups.suppliers)],
};

function first<T>(items: T[]): T {
  const item = items[0];
  if (!item) throw new Error("Expected a fixture item");
  return item;
}

afterEach(() => vi.useRealTimers());

describe("MaterialTable", () => {
  it("renders only the approved master columns, supplier names, and the identity strip", () => {
    render(
      <MaterialTable
        materials={[material]}
        page={1}
        pageSize={10}
        totalItems={1}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortChange={vi.fn()}
      />,
    );

    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      expect.stringContaining("วัสดุ"),
      "หน่วย",
      "รุ่น",
      "ประเภทการจัดส่ง",
      "ผู้ขาย",
      expect.stringContaining("สถานะ"),
      "การทำงาน",
    ]);
    expect(screen.getByTestId("material-identity-MAT-099")).toHaveTextContent("MAT-099เหล็กแผ่นkg");
    expect(screen.getByText("บริษัท เหล็กไทย")).toBeInTheDocument();
    expect(document.body.textContent?.toLowerCase()).not.toMatch(/stock|คงคลัง/);
  });

  it("emits server sorting and valid pagination while showing the current range", async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <MaterialTable
        materials={[material]}
        page={2}
        pageSize={10}
        totalItems={25}
        sortBy="code"
        sortOrder="asc"
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "เรียงตามรหัสวัสดุ" }));
    expect(onSortChange).toHaveBeenCalledWith("code", "desc");
    expect(screen.getByText("11–20 จาก 25 รายการ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "หน้าถัดไป" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    await user.selectOptions(screen.getByLabelText("จำนวนต่อหน้า"), "25");
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it("disables invalid previous and next navigation", () => {
    render(
      <MaterialTable
        materials={[material]}
        page={1}
        pageSize={10}
        totalItems={1}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "หน้าก่อนหน้า" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "หน้าถัดไป" })).toBeDisabled();
  });

  it("renders loading, actionable empty, and retryable error states", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <MaterialTable
        materials={[]}
        page={1}
        pageSize={10}
        totalItems={0}
        isLoading
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("status", { name: "กำลังโหลดรายการวัสดุ" })).toBeInTheDocument();

    const onCreate = vi.fn();
    rerender(
      <MaterialTable
        materials={[]}
        page={1}
        pageSize={10}
        totalItems={0}
        onCreate={onCreate}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortChange={vi.fn()}
      />,
    );
    expect(screen.getByText("ยังไม่มีข้อมูลวัสดุ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เพิ่มวัสดุ" }));
    expect(onCreate).toHaveBeenCalledOnce();

    const onRetry = vi.fn();
    rerender(
      <MaterialTable
        materials={[]}
        page={1}
        pageSize={10}
        totalItems={0}
        isError
        onRetry={onRetry}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
        onSortChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "ลองใหม่" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});

describe("MaterialFilters", () => {
  it("debounces trimmed search and emits every Task 5 filter from page one", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const params: ListMaterialsParams = {
      page: 4,
      pageSize: 10,
      sortBy: "code",
      sortOrder: "asc",
    };
    render(<MaterialFilters value={params} lookups={lookups} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("ค้นหาวัสดุ"), { target: { value: "  steel  " } });
    act(() => vi.advanceTimersByTime(299));
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1, search: "steel" }));

    fireEvent.change(screen.getByLabelText("สถานะ"), { target: { value: "false" } });
    fireEvent.change(screen.getByLabelText("หน่วย"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "ตัวกรองเพิ่มเติม" }));
    fireEvent.change(screen.getByLabelText("รุ่น"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("ประเภทการจัดส่ง"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("จุดรับสินค้า"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("ผู้ขาย"), { target: { value: "10" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1, isActive: false }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1, unitId: "1" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1, modelId: "2" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, deliveryTypeId: "3" }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, loadingPointId: "4" }),
    );
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ page: 1, supplierId: "10" }));
  });

  it("clears filters while preserving default paging size and sorting", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MaterialFilters
        value={{
          page: 5,
          pageSize: 25,
          search: "steel",
          isActive: false,
          unitId: "1",
          modelId: "2",
          deliveryTypeId: "3",
          loadingPointId: "4",
          supplierId: "10",
          sortBy: "name",
          sortOrder: "desc",
        }}
        lookups={lookups}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "ล้างตัวกรอง" }));
    expect(onChange).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 25,
      sortBy: "name",
      sortOrder: "desc",
    });
    expect(screen.getByLabelText("ค้นหาวัสดุ")).toHaveValue("");
  });
});

describe("MaterialStatusDialog", () => {
  it("explains that deactivation is not permanent deletion and names the material", () => {
    render(
      <MaterialStatusDialog
        open
        material={material}
        action="deactivate"
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "ยืนยันการปิดใช้งานวัสดุ" });
    expect(dialog).toHaveTextContent("MAT-099");
    expect(dialog).toHaveTextContent("เหล็กแผ่น");
    expect(dialog).toHaveTextContent("ข้อมูลจะไม่ถูกลบถาวร");
    expect(within(dialog).getByRole("button", { name: "ปิดใช้งาน" })).toBeInTheDocument();
  });

  it("presents restore as a clear non-destructive action", () => {
    render(
      <MaterialStatusDialog
        open
        material={{ ...material, isActive: false }}
        action="restore"
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    const dialog = screen.getByRole("dialog", { name: "เปิดใช้งานวัสดุอีกครั้ง" });
    expect(dialog).toHaveTextContent("กลับมาใช้งานในรายการวัสดุ");
    expect(within(dialog).getByRole("button", { name: "เปิดใช้งาน" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "เปิดใช้งาน" })).not.toHaveClass(
      "bg-destructive",
    );
  });
});
