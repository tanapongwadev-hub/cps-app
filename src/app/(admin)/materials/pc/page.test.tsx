import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MaterialsPCPage from "./page";

const { refetchMock, createMutateAsync, updateMutateAsync, deactivateMutateAsync, restoreMutateAsync, uploadMutateAsync } = vi.hoisted(() => ({
  refetchMock: vi.fn(),
  createMutateAsync: vi.fn(),
  updateMutateAsync: vi.fn(),
  deactivateMutateAsync: vi.fn(),
  restoreMutateAsync: vi.fn(),
  uploadMutateAsync: vi.fn(),
}));

const SAMPLE_PC_MATERIALS = [
  {
    id: "101",
    code: "PC-CPU-001",
    name: "CPU Intel i7-13700K",
    unitId: "1",
    deliveryTypeId: null,
    modelId: "pc-1",
    loadingPointId: null,
    processLineName: "Line A",
    scale: null,
    imagePath: null,
    specification: "LGA1700, 16C/24T",
    description: null,
    isActive: true,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    unit: { id: "1", code: "PCS", nameTh: "ชิ้น", nameEn: "Piece", symbol: "ชิ้น" },
    deliveryType: null,
    model: { id: "pc-1", code: "PC", nameTh: "PC", nameEn: "PC" },
    loadingPoint: null,
    suppliers: [],
  },
  {
    id: "102",
    code: "PC-RAM-002",
    name: "RAM DDR5 32GB",
    unitId: "1",
    deliveryTypeId: null,
    modelId: "pc-1",
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
    unit: { id: "1", code: "PCS", nameTh: "ชิ้น", nameEn: "Piece", symbol: "ชิ้น" },
    deliveryType: null,
    model: { id: "pc-1", code: "PC", nameTh: "PC", nameEn: "PC" },
    loadingPoint: null,
    suppliers: [],
  },
];

const SAMPLE_LOOKUPS = {
  units: [
    { id: "1", code: "PCS", nameTh: "ชิ้น", nameEn: "Piece" },
  ],
  suppliers: [],
  models: [
    { id: "pc-1", code: "PC", nameTh: "PC", nameEn: "PC" },
  ],
  deliveryTypes: [],
  loadingPoints: [],
};

const LIST_STATE = {
  data: { items: SAMPLE_PC_MATERIALS, meta: { page: 1, limit: 10, totalItems: 2, totalPages: 1 } },
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
  isSuperAdminUser: () => true,
}));

beforeEach(() => {
  vi.clearAllMocks();
  createMutateAsync.mockResolvedValue(SAMPLE_PC_MATERIALS[0]);
  updateMutateAsync.mockResolvedValue(SAMPLE_PC_MATERIALS[0]);
  deactivateMutateAsync.mockResolvedValue({ ...SAMPLE_PC_MATERIALS[0], isActive: false });
  restoreMutateAsync.mockResolvedValue({ ...SAMPLE_PC_MATERIALS[0], isActive: true });
  uploadMutateAsync.mockResolvedValue({ imagePath: "/uploads/x.png", previewUrl: "/uploads/x.png" });
});

describe("MaterialsPCPage", () => {
  it("renders the PC-specific page title and breadcrumb", async () => {
    render(<MaterialsPCPage />);
    expect(await screen.findByRole("heading", { name: "จัดการอะไหล่ PC" })).toBeInTheDocument();
    // Breadcrumb labels (current page)
    expect(screen.getAllByText("อะไหล่ PC").length).toBeGreaterThan(0);
  });

  it("renders rows from the API and shows the PC count summary", async () => {
    render(<MaterialsPCPage />);
    expect(await screen.findByText("PC-CPU-001")).toBeInTheDocument();
    expect(screen.getByText("PC-RAM-002")).toBeInTheDocument();
    expect(screen.getByText((content) => /แสดง\s*2\s*รายการ\s*จาก\s*2/.test(content))).toBeInTheDocument();
  });

  it("opens the create form when เพิ่มอะไหล่ PC is clicked", async () => {
    const user = userEvent.setup();
    render(<MaterialsPCPage />);
    const addBtn = await screen.findByRole("button", { name: /เพิ่มอะไหล่ PC/ });
    await user.click(addBtn);
    await waitFor(() => {
      expect(screen.getByText("เพิ่มอะไหล่ PC ใหม่")).toBeInTheDocument();
    });
  });

  it("opens the edit form with prefill when แก้ไข is clicked on a row", async () => {
    const user = userEvent.setup();
    render(<MaterialsPCPage />);
    const editBtn = (await screen.findAllByRole("button", { name: "แก้ไข PC-CPU-001" }))[0]!;
    await user.click(editBtn);
    await waitFor(() => {
      expect(screen.getByText("แก้ไขอะไหล่ PC")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/PC-CPU-001/).length).toBeGreaterThanOrEqual(2);
  });

  it("opens deactivate dialog when row is active", async () => {
    const user = userEvent.setup();
    render(<MaterialsPCPage />);
    const btn = (await screen.findAllByRole("button", { name: "ปิดใช้งาน PC-CPU-001" }))[0]!;
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByText("ยืนยันการปิดใช้งานวัสดุ")).toBeInTheDocument();
    });
  });

  it("opens restore dialog when row is inactive", async () => {
    const user = userEvent.setup();
    render(<MaterialsPCPage />);
    const btn = (await screen.findAllByRole("button", { name: "เปิดใช้งาน PC-RAM-002" }))[0]!;
    await user.click(btn);
    await waitFor(() => {
      expect(screen.getByText("เปิดใช้งานวัสดุอีกครั้ง")).toBeInTheDocument();
    });
  });

  it("calls deactivate mutation when user confirms", async () => {
    const user = userEvent.setup();
    render(<MaterialsPCPage />);
    const btn = (await screen.findAllByRole("button", { name: "ปิดใช้งาน PC-CPU-001" }))[0]!;
    await user.click(btn);
    const confirm = await screen.findByRole("button", { name: "ปิดใช้งาน" });
    await user.click(confirm);
    await waitFor(() => {
      expect(deactivateMutateAsync).toHaveBeenCalledWith("101");
    });
  });

  it("calls restore mutation when user confirms", async () => {
    const user = userEvent.setup();
    render(<MaterialsPCPage />);
    const btn = (await screen.findAllByRole("button", { name: "เปิดใช้งาน PC-RAM-002" }))[0]!;
    await user.click(btn);
    const confirm = await screen.findByRole("button", { name: "เปิดใช้งาน" });
    await user.click(confirm);
    await waitFor(() => {
      expect(restoreMutateAsync).toHaveBeenCalledWith("102");
    });
  });

  it("triggers refetch when รีเฟรช button is clicked", async () => {
    const user = userEvent.setup();
    render(<MaterialsPCPage />);
    const refreshBtn = await screen.findByRole("button", { name: /รีเฟรช/ });
    await user.click(refreshBtn);
    expect(refetchMock).toHaveBeenCalled();
  });
});
