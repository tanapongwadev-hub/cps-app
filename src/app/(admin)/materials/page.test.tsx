import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaterialsPage from "./page";

const { refetchMock, createMutateAsync, updateMutateAsync, deactivateMutateAsync, restoreMutateAsync, uploadMutateAsync } = vi.hoisted(() => ({
  refetchMock: vi.fn(),
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  deactivateMutateAsync: vi.fn(),
  restoreMutateAsync: vi.fn(),
  uploadMutateAsync: vi.fn(),
}));

const SAMPLE_MATERIALS = [
  {
    id: "1",
    code: "MAT-001",
    name: "ผ้าเบรคหน้า",
    unitId: "1",
    deliveryTypeId: null,
    modelId: null,
    loadingPointId: null,
    processLineName: null,
    scale: null,
    imagePath: null,
    specification: null,
    description: null,
    isActive: true,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    unit: { id: "1", code: "PCS", nameTh: "ชิ้น", nameEn: "Piece", symbol: "ชิ้น" },
    deliveryType: null,
    model: null,
    loadingPoint: null,
    suppliers: [],
  },
  {
    id: "2",
    code: "MAT-002",
    name: "น้ำมันเครื่อง 10W-40",
    unitId: "2",
    deliveryTypeId: null,
    modelId: null,
    loadingPointId: null,
    processLineName: null,
    scale: null,
    imagePath: null,
    specification: null,
    description: null,
    isActive: false,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    unit: { id: "2", code: "L", nameTh: "ลิตร", nameEn: "Litre", symbol: "ลิตร" },
    deliveryType: null,
    model: null,
    loadingPoint: null,
    suppliers: [],
  },
];

const SAMPLE_LOOKUPS = {
  units: [
    { id: "1", code: "PCS", nameTh: "ชิ้น", nameEn: "Piece" },
    { id: "2", code: "L", nameTh: "ลิตร", nameEn: "Litre" },
  ],
  suppliers: [
    {
      id: "sup-1",
      code: "SUP-001",
      nameTh: "บริษัท A",
      nameEn: "Company A",
      taxId: null,
      contactName: null,
      telephone: null,
      email: null,
      address: null,
      isActive: true,
      createdBy: null,
      updatedBy: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  models: [],
  deliveryTypes: [],
  loadingPoints: [],
};

const LIST_STATE = {
  data: { items: SAMPLE_MATERIALS, meta: { page: 1, limit: 10, totalItems: 2, totalPages: 1 } },
  isLoading: false,
  isError: false,
  isFetching: false,
  error: null,
  refetch: refetchMock,
};

const LOOKUPS_STATE = {
  data: SAMPLE_LOOKUPS,
  isLoading: false,
  isError: false,
  error: null,
};

vi.mock("@/features/materials/hooks/use-materials", () => ({
  useMaterials: () => LIST_STATE,
  useMaterialLookups: () => LOOKUPS_STATE,
  useCreateMaterial: () => ({ mutateAsync: createMutateAsync, isPending: false }),
  useUpdateMaterial: () => ({ mutateAsync: updateMutateAsync, isPending: false }),
  useDeactivateMaterial: () => ({ mutateAsync: deactivateMutateAsync, isPending: false }),
  useRestoreMaterial: () => ({ mutateAsync: restoreMutateAsync, isPending: false }),
  useUploadMaterialImage: () => ({ mutateAsync: uploadMutateAsync, isPending: false }),
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { isSuperAdmin: true }, permissions: ["*"] }),
}));

vi.mock("@/features/permissions/components/permission-form-dialog", () => ({
  PermissionFormDialog: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  createMutateAsync.mockResolvedValue(SAMPLE_MATERIALS[0]);
  updateMutateAsync.mockResolvedValue(SAMPLE_MATERIALS[0]);
  deactivateMutateAsync.mockResolvedValue({ ...SAMPLE_MATERIALS[0], isActive: false });
  restoreMutateAsync.mockResolvedValue({ ...SAMPLE_MATERIALS[0], isActive: true });
  uploadMutateAsync.mockResolvedValue({ imagePath: "/uploads/x.png", previewUrl: "/uploads/x.png" });
});

describe("MaterialsPage", () => {
  it("renders the page title, filters, and table rows from the API", async () => {
    render(<MaterialsPage />);
    expect(await screen.findByText("จัดการอะไหล่")).toBeInTheDocument();
    // Filter inputs
    expect(screen.getByLabelText("ค้นหาวัสดุ")).toBeInTheDocument();
    // Table rows by code
    expect(screen.getByText("MAT-001")).toBeInTheDocument();
    expect(screen.getByText("MAT-002")).toBeInTheDocument();
    // Count summary
    expect(screen.getByText(/แสดง 2 จาก 2 รายการ/)).toBeInTheDocument();
  });

  it("opens the create form when เพิ่มอะไหล่ is clicked", async () => {
    const user = userEvent.setup();
    render(<MaterialsPage />);
    const addBtn = await screen.findByRole("button", { name: /เพิ่มอะไหล่/ });
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByText("เพิ่มวัสดุใหม่")).toBeInTheDocument();
    });
  });

  it("opens the edit form with prefill when แก้ไข is clicked on a row", async () => {
    const user = userEvent.setup();
    render(<MaterialsPage />);
    const editBtn = await screen.findByRole("button", { name: "แก้ไข MAT-001" });
    await user.click(editBtn);
    await waitFor(() => {
      expect(screen.getByText("แก้ไขวัสดุ")).toBeInTheDocument();
    });
    // Sheet description contains the code
    expect(screen.getByText(/MAT-001/)).toBeInTheDocument();
  });

  it("opens the status change dialog with action=deactivate when row is active", async () => {
    const user = userEvent.setup();
    render(<MaterialsPage />);
    const deactivateBtn = await screen.findByRole("button", { name: "ปิดใช้งาน MAT-001" });
    await user.click(deactivateBtn);
    await waitFor(() => {
      expect(screen.getByText("ยืนยันการปิดใช้งานวัสดุ")).toBeInTheDocument();
    });
  });

  it("opens the status change dialog with action=restore when row is inactive", async () => {
    const user = userEvent.setup();
    render(<MaterialsPage />);
    const restoreBtn = await screen.findByRole("button", { name: "เปิดใช้งาน MAT-002" });
    await user.click(restoreBtn);
    await waitFor(() => {
      expect(screen.getByText("เปิดใช้งานวัสดุอีกครั้ง")).toBeInTheDocument();
    });
  });

  it("calls deactivate mutation when user confirms deactivate", async () => {
    const user = userEvent.setup();
    render(<MaterialsPage />);
    const deactivateBtn = await screen.findByRole("button", { name: "ปิดใช้งาน MAT-001" });
    await user.click(deactivateBtn);
    const confirmBtn = await screen.findByRole("button", { name: "ปิดใช้งาน" });
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(deactivateMutateAsync).toHaveBeenCalledWith("1");
    });
  });

  it("calls restore mutation when user confirms restore", async () => {
    const user = userEvent.setup();
    render(<MaterialsPage />);
    const restoreBtn = await screen.findByRole("button", { name: "เปิดใช้งาน MAT-002" });
    await user.click(restoreBtn);
    const confirmBtn = await screen.findByRole("button", { name: "เปิดใช้งาน" });
    await user.click(confirmBtn);
    await waitFor(() => {
      expect(restoreMutateAsync).toHaveBeenCalledWith("2");
    });
  });

  it("triggers refetch when รีเฟรช button is clicked", async () => {
    const user = userEvent.setup();
    render(<MaterialsPage />);
    const refreshBtn = await screen.findByRole("button", { name: /รีเฟรชรายการวัสดุ/ });
    await user.click(refreshBtn);
    expect(refetchMock).toHaveBeenCalled();
  });
});
