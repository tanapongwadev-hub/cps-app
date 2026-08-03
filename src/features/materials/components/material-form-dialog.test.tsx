import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/services/api-client";
import type {
  Material,
  MaterialImageUpload,
  MaterialLookups,
  MaterialPayload,
  UpdateMaterialPayload,
} from "../api/materials-api";
import { MaterialFormDialog } from "./material-form-dialog";

const lookups: MaterialLookups = {
  units: [
    { id: "9007199254740993", code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram", symbol: "kg" },
  ],
  models: [{ id: "2", code: "M-01", nameTh: "รุ่นมาตรฐาน", nameEn: null }],
  deliveryTypes: [{ id: "3", code: "DIRECT", nameTh: "ส่งตรง", nameEn: null }],
  loadingPoints: [{ id: "4", code: "LP-A", nameTh: "จุดรับ A", nameEn: null }],
  suppliers: [
    {
      id: "10",
      code: "SUP-10",
      nameTh: "บริษัท เหล็กไทย",
      nameEn: "Thai Steel",
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
    {
      id: "11",
      code: "SUP-11",
      nameTh: "ผู้ขายปิดใช้งาน",
      nameEn: null,
      taxId: null,
      contactName: null,
      telephone: null,
      email: null,
      address: null,
      isActive: false,
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
  unitId: "9007199254740993",
  deliveryTypeId: "3",
  modelId: "2",
  loadingPointId: "4",
  processLineName: "Line A",
  scale: "10.50",
  imagePath: "/uploads/materials/steel.webp",
  specification: "SS400",
  description: "สำหรับงานขึ้นรูป",
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

function renderForm(overrides: Partial<React.ComponentProps<typeof MaterialFormDialog>> = {}) {
  const props: React.ComponentProps<typeof MaterialFormDialog> = {
    open: true,
    onOpenChange: vi.fn(),
    lookups,
    onUploadImage: vi.fn<(_file: File) => Promise<MaterialImageUpload>>(),
    onSave: vi.fn<(_payload: MaterialPayload | UpdateMaterialPayload) => Promise<void>>(),
    ...overrides,
  };

  return { ...render(<MaterialFormDialog {...props} />), props };
}

beforeEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:material-preview"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

describe("MaterialFormDialog", () => {
  it("blocks upload and save until the three required trimmed fields are valid", async () => {
    const user = userEvent.setup();
    const { props } = renderForm();

    await user.click(screen.getByRole("button", { name: "สร้างวัสดุ" }));

    expect(await screen.findByText("กรุณากรอกรหัสวัสดุ")).toBeInTheDocument();
    expect(screen.getByText("กรุณากรอกชื่อวัสดุ")).toBeInTheDocument();
    expect(screen.getByText("กรุณาเลือกหน่วย")).toBeInTheDocument();
    expect(props.onUploadImage).not.toHaveBeenCalled();
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("uploads a valid image first and emits every normalized aggregate field once", async () => {
    const user = userEvent.setup();
    const calls: string[] = [];
    const onUploadImage = vi.fn(async () => {
      calls.push("upload");
      return { imagePath: "/uploads/materials/.tmp/new.webp", previewUrl: "/preview/new.webp" };
    });
    const onSave = vi.fn(async () => {
      calls.push("save");
    });
    const { props } = renderForm({ onUploadImage, onSave });

    await user.type(screen.getByLabelText("รหัสวัสดุ"), "  mat-001  ");
    await user.type(screen.getByLabelText("ชื่อวัสดุ"), "  เหล็กม้วน  ");
    await user.selectOptions(screen.getByLabelText("หน่วย"), "9007199254740993");
    await user.selectOptions(screen.getByLabelText("ประเภทการจัดส่ง"), "3");
    await user.selectOptions(screen.getByLabelText("รุ่น"), "2");
    await user.selectOptions(screen.getByLabelText("จุดรับสินค้า"), "4");
    await user.type(screen.getByLabelText("ไลน์กระบวนการ"), "  Line B  ");
    await user.type(screen.getByLabelText("สเกล"), "  25.50  ");
    await user.type(screen.getByLabelText("ข้อกำหนด"), "  JIS G3101  ");
    await user.type(screen.getByLabelText("คำอธิบาย"), "  ใช้ในไลน์หลัก  ");

    const supplierSelect = screen.getByLabelText("เพิ่มผู้ขาย");
    fireEvent.change(supplierSelect, { target: { value: "10" } });
    fireEvent.change(supplierSelect, { target: { value: "10" } });
    expect(
      within(screen.getByRole("list", { name: "ผู้ขายที่เลือก" })).getAllByRole("listitem"),
    ).toHaveLength(1);
    expect(screen.queryByRole("option", { name: /ผู้ขายปิดใช้งาน/ })).not.toBeInTheDocument();

    const file = new File(["image"], "material.webp", { type: "image/webp" });
    await user.upload(screen.getByLabelText("เลือกรูปวัสดุ"), file);
    expect(screen.getByRole("img", { name: "ตัวอย่างรูปวัสดุ" })).toHaveAttribute(
      "src",
      "blob:material-preview",
    );

    await user.click(screen.getByRole("button", { name: "สร้างวัสดุ" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(calls).toEqual(["upload", "save"]);
    expect(onSave).toHaveBeenCalledWith({
      code: "mat-001",
      name: "เหล็กม้วน",
      unitId: "9007199254740993",
      deliveryTypeId: "3",
      modelId: "2",
      loadingPointId: "4",
      processLineName: "Line B",
      scale: "25.50",
      supplierIds: ["10"],
      imagePath: "/uploads/materials/.tmp/new.webp",
      specification: "JIS G3101",
      description: "ใช้ในไลน์หลัก",
      isActive: true,
    });
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("initializes edit relationships and image, and includes updatedAt without replacing the image", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => undefined);
    const { props } = renderForm({ material, onSave });

    expect(screen.getByLabelText("รหัสวัสดุ")).toHaveValue("MAT-099");
    expect(screen.getByRole("img", { name: "ตัวอย่างรูปวัสดุ" })).toHaveAttribute(
      "src",
      material.imagePath,
    );
    expect(screen.getByRole("list", { name: "ผู้ขายที่เลือก" })).toHaveTextContent(
      "บริษัท เหล็กไทย",
    );

    await user.clear(screen.getByLabelText("คำอธิบาย"));
    await user.click(screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(props.onUploadImage).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "MAT-099",
        supplierIds: ["10"],
        imagePath: "/uploads/materials/steel.webp",
        description: null,
        updatedAt: "2026-08-02T00:00:00.000Z",
      }),
    );
  });

  it("rejects invalid image types and files over 5 MiB", async () => {
    renderForm();
    const input = screen.getByLabelText("เลือกรูปวัสดุ");

    fireEvent.change(input, {
      target: { files: [new File(["pdf"], "spec.pdf", { type: "application/pdf" })] },
    });
    expect(screen.getByText("รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP")).toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();

    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(5 * 1024 * 1024 + 1)], "too-large.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(screen.getByText("รูปต้องมีขนาดไม่เกิน 5 MiB")).toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("revokes object URLs on replacement, removal, and unmount", async () => {
    const user = userEvent.setup();
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce("blob:first")
      .mockReturnValueOnce("blob:second");
    const view = renderForm();
    const input = screen.getByLabelText("เลือกรูปวัสดุ");

    await user.upload(input, new File(["one"], "one.png", { type: "image/png" }));
    await user.upload(input, new File(["two"], "two.jpeg", { type: "image/jpeg" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");

    await user.click(screen.getByRole("button", { name: "ลบรูปวัสดุ" }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:second");

    await user.upload(input, new File(["three"], "three.png", { type: "image/png" }));
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:material-preview");
  });

  it("emits null when the current image is removed during edit", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => undefined);
    const { props } = renderForm({ material, onSave });

    await user.click(screen.getByRole("button", { name: "ลบรูปวัสดุ" }));
    await user.click(screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(props.onUploadImage).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ imagePath: null }));
  });

  it("asks before closing dirty data and discards only after confirmation", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderForm({ onOpenChange });

    await user.type(screen.getByLabelText("รหัสวัสดุ"), "MAT-001");
    await user.click(screen.getByRole("button", { name: "ยกเลิก" }));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "ทิ้งการเปลี่ยนแปลงที่ยังไม่บันทึก?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ทิ้งการเปลี่ยนแปลง" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("intercepts Escape for dirty data and revokes a selected preview when discarded", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.upload(
      screen.getByLabelText("เลือกรูปวัสดุ"),
      new File(["image"], "dirty.png", { type: "image/png" }),
    );

    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("dialog", { name: "ทิ้งการเปลี่ยนแปลงที่ยังไม่บันทึก?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ทิ้งการเปลี่ยนแปลง" }));

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:material-preview");
  });

  it("disables save and prevents double invocation while a save is pending", async () => {
    const user = userEvent.setup();
    let resolveSave!: () => void;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );
    renderForm({ onSave });
    await user.type(screen.getByLabelText("รหัสวัสดุ"), "MAT-001");
    await user.type(screen.getByLabelText("ชื่อวัสดุ"), "เหล็ก");
    await user.selectOptions(screen.getByLabelText("หน่วย"), "9007199254740993");

    const save = screen.getByRole("button", { name: "สร้างวัสดุ" });
    await user.click(save);
    await waitFor(() => expect(save).toBeDisabled());
    await user.click(save);
    expect(onSave).toHaveBeenCalledTimes(1);

    resolveSave();
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it("retains form values and shows a useful API error after save fails", async () => {
    const user = userEvent.setup();
    renderForm({ onSave: vi.fn().mockRejectedValue(new Error("รหัสวัสดุซ้ำ")) });
    await user.type(screen.getByLabelText("รหัสวัสดุ"), "MAT-001");
    await user.type(screen.getByLabelText("ชื่อวัสดุ"), "เหล็ก");
    await user.selectOptions(screen.getByLabelText("หน่วย"), "9007199254740993");

    await user.click(screen.getByRole("button", { name: "สร้างวัสดุ" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("รหัสวัสดุซ้ำ");
    expect(screen.getByLabelText("รหัสวัสดุ")).toHaveValue("MAT-001");
    expect(screen.getByLabelText("ชื่อวัสดุ")).toHaveValue("เหล็ก");
  });

  it("shows reload guidance for a stale 409 and keeps the edited values", async () => {
    const user = userEvent.setup();
    const conflict = new ApiClientError("stale", { status: 409, code: "CONFLICT" });
    renderForm({ material, onSave: vi.fn().mockRejectedValue(conflict) });
    await user.clear(screen.getByLabelText("ชื่อวัสดุ"));
    await user.type(screen.getByLabelText("ชื่อวัสดุ"), "เหล็กแก้ไข");

    await user.click(screen.getByRole("button", { name: "บันทึกการเปลี่ยนแปลง" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ข้อมูลนี้ถูกแก้ไขจากที่อื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนแก้ไขอีกครั้ง",
    );
    expect(screen.getByLabelText("ชื่อวัสดุ")).toHaveValue("เหล็กแก้ไข");
  });

  it("keeps the server conflict message for a create-code conflict", async () => {
    const user = userEvent.setup();
    const conflict = new ApiClientError("รหัสวัสดุนี้มีอยู่แล้ว", {
      status: 409,
      code: "CONFLICT",
    });
    renderForm({ onSave: vi.fn().mockRejectedValue(conflict) });
    await user.type(screen.getByLabelText("รหัสวัสดุ"), "MAT-001");
    await user.type(screen.getByLabelText("ชื่อวัสดุ"), "เหล็ก");
    await user.selectOptions(screen.getByLabelText("หน่วย"), "9007199254740993");

    await user.click(screen.getByRole("button", { name: "สร้างวัสดุ" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("รหัสวัสดุนี้มีอยู่แล้ว");
    expect(screen.getByRole("alert")).not.toHaveTextContent("โหลดข้อมูลล่าสุด");
  });
});
