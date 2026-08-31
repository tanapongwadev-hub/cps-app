"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BomPage from "./page";
import type { ProductBom } from "@/features/products/api/products-api";

vi.mock("next/navigation", () => ({
  useParams: () => ({ productId: "prod-1" }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/ui/permission-guard", () => ({
  PermissionGuard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// next/dynamic wraps BomFormModal (loaded lazily) — replace it with a plain
// sync component so tests don't have to wait on a dynamic import to resolve.
// Both the "create" and "edit" usages in page.tsx point at the same dynamic
// component, distinguished only by whether a `bom` prop is passed.
vi.mock("next/dynamic", () => ({
  default: () => {
    function DynamicBomFormModal(props: { open: boolean; bom?: ProductBom }) {
      if (!props.open) return null;
      return (
        <div data-testid="bom-form-modal">{props.bom ? `edit:${props.bom.id}` : "create"}</div>
      );
    }
    return DynamicBomFormModal;
  },
}));

vi.mock("@/features/products/hooks/use-products", () => ({
  useBom: vi.fn(),
  useBomsByProduct: vi.fn(),
  useCreateBom: vi.fn(),
  useUpdateBom: vi.fn(),
  useAddBomItem: vi.fn(),
  useRemoveBomItem: vi.fn(),
  useActivateBom: vi.fn(),
  useDeactivateBom: vi.fn(),
  useDeleteBom: vi.fn(),
}));

import {
  useBomsByProduct,
  useCreateBom,
  useUpdateBom,
  useAddBomItem,
  useRemoveBomItem,
  useActivateBom,
  useDeactivateBom,
  useDeleteBom,
} from "@/features/products/hooks/use-products";

function bom(overrides: Partial<ProductBom>): ProductBom {
  return {
    id: "bom-1",
    productId: "prod-1",
    version: "v1",
    status: "DRAFT",
    specification: null,
    remark: null,
    effectiveFrom: null,
    effectiveTo: null,
    createdBy: null,
    updatedBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    product: { id: "prod-1", code: "PRD-001", name: "กันชนหน้า" },
    items: [],
    ...overrides,
  };
}

const activeBom = bom({ id: "bom-active", version: "v1", status: "ACTIVE" });
const draftBom = bom({ id: "bom-draft", version: "v2-draft", status: "DRAFT" });

describe("BomPage", () => {
  let refetch: ReturnType<typeof vi.fn>;
  let deleteMutateAsync: ReturnType<typeof vi.fn>;
  let activateMutateAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    refetch = vi.fn();
    deleteMutateAsync = vi.fn().mockResolvedValue(undefined);
    activateMutateAsync = vi.fn().mockResolvedValue(undefined);

    vi.mocked(useBomsByProduct).mockReturnValue({
      data: [activeBom, draftBom],
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof useBomsByProduct>);
    vi.mocked(useCreateBom).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateBom>);
    vi.mocked(useUpdateBom).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateBom>);
    vi.mocked(useAddBomItem).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useAddBomItem>);
    vi.mocked(useRemoveBomItem).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useRemoveBomItem>);
    vi.mocked(useActivateBom).mockReturnValue({
      mutateAsync: activateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useActivateBom>);
    vi.mocked(useDeactivateBom).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useDeactivateBom>);
    vi.mocked(useDeleteBom).mockReturnValue({
      mutateAsync: deleteMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteBom>);
  });

  it("shows a spinner while loading", () => {
    vi.mocked(useBomsByProduct).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isFetching: true,
      refetch,
    } as unknown as ReturnType<typeof useBomsByProduct>);
    render(<BomPage />);
    expect(screen.queryByText("ACTIVE")).not.toBeInTheDocument();
  });

  it("shows an empty state with a create button when there are no BOMs", () => {
    vi.mocked(useBomsByProduct).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      isFetching: false,
      refetch,
    } as unknown as ReturnType<typeof useBomsByProduct>);
    render(<BomPage />);
    expect(screen.getByText("ยังไม่มี BOM สำหรับสินค้านี้")).toBeInTheDocument();
  });

  it("groups BOMs into active/draft sections and shows the product name from the active BOM", () => {
    render(<BomPage />);
    expect(screen.getByText("กันชนหน้า (PRD-001)")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    // "DRAFT" appears both as the section heading and the card's status
    // badge — just confirm the section heading is there.
    expect(screen.getByRole("heading", { name: "DRAFT" })).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("v2-draft")).toBeInTheDocument();
  });

  it("opens the create modal", async () => {
    const user = userEvent.setup();
    render(<BomPage />);

    await user.click(screen.getByRole("button", { name: /สร้าง BOM ใหม่/ }));
    expect(screen.getByTestId("bom-form-modal")).toHaveTextContent("create");
  });

  it("opens the edit modal for a draft BOM", async () => {
    const user = userEvent.setup();
    render(<BomPage />);

    await user.click(screen.getByRole("button", { name: "แก้ไข BOM" }));
    expect(screen.getByTestId("bom-form-modal")).toHaveTextContent(`edit:${draftBom.id}`);
  });

  it("activates a draft BOM", async () => {
    const user = userEvent.setup();
    render(<BomPage />);

    await user.click(screen.getByRole("button", { name: "เปิดใช้งาน" }));
    expect(activateMutateAsync).toHaveBeenCalledWith(draftBom.id);
  });

  it("deletes a draft BOM after confirming", async () => {
    const user = userEvent.setup();
    render(<BomPage />);

    await user.click(screen.getByRole("button", { name: `ลบ BOM ${draftBom.version}` }));
    expect(screen.getByText("ลบ BOM")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ลบ" }));
    expect(deleteMutateAsync).toHaveBeenCalledWith(draftBom.id);
  });

  it("refetches when รีเฟรช is clicked", async () => {
    const user = userEvent.setup();
    render(<BomPage />);

    await user.click(screen.getByRole("button", { name: /รีเฟรช/ }));
    expect(refetch).toHaveBeenCalled();
  });
});
