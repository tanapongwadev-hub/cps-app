"use client";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenuManagementPage from "./page";
import type { MenuItem } from "@/features/menus/types";

vi.mock("@/features/menus/hooks/use-menus", () => ({
  useMenusList: vi.fn(),
  useCreateMenu: vi.fn(),
  useUpdateMenu: vi.fn(),
  useDeleteMenu: vi.fn(),
  useReorderMenus: vi.fn(),
}));

import {
  useMenusList,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  useReorderMenus,
} from "@/features/menus/hooks/use-menus";

function menu(overrides: Partial<MenuItem>): MenuItem {
  return {
    id: "1",
    parentId: null,
    code: "DASHBOARD",
    nameTh: "แดชบอร์ด",
    nameEn: "Dashboard",
    menuType: "MAIN",
    path: "/dashboard",
    icon: "layout-dashboard",
    sortOrder: 1,
    isVisible: true,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const rootMenu = menu({ id: "root-1", code: "MATERIALS", nameTh: "วัสดุ", sortOrder: 1 });
const rootMenu2 = menu({ id: "root-2", code: "REPORTS", nameTh: "รายงาน", sortOrder: 2 });
const childMenu = menu({
  id: "child-1",
  parentId: "root-1",
  code: "MATERIALS_RECEIVING",
  nameTh: "รับเข้าวัตถุดิบ",
  menuType: "MENU",
  sortOrder: 1,
});

describe("MenuManagementPage", () => {
  let reorderMutate: ReturnType<typeof vi.fn>;
  let createMutate: ReturnType<typeof vi.fn>;
  let updateMutate: ReturnType<typeof vi.fn>;
  let deleteMutate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    reorderMutate = vi.fn();
    createMutate = vi.fn();
    updateMutate = vi.fn();
    deleteMutate = vi.fn();

    vi.mocked(useMenusList).mockReturnValue({
      data: { items: [rootMenu, rootMenu2, childMenu] },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useMenusList>);
    vi.mocked(useCreateMenu).mockReturnValue({
      mutate: createMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateMenu>);
    vi.mocked(useUpdateMenu).mockReturnValue({
      mutate: updateMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateMenu>);
    vi.mocked(useDeleteMenu).mockReturnValue({
      mutate: deleteMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useDeleteMenu>);
    vi.mocked(useReorderMenus).mockReturnValue({
      mutate: reorderMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useReorderMenus>);
  });

  it("renders the menu tree with parent before children, indented", () => {
    render(<MenuManagementPage />);

    expect(screen.getByRole("heading", { name: "จัดการเมนู" })).toBeInTheDocument();
    expect(screen.getByText("วัสดุ")).toBeInTheDocument();
    expect(screen.getByText("รายงาน")).toBeInTheDocument();
    expect(screen.getByText("รับเข้าวัตถุดิบ")).toBeInTheDocument();

    // Child row is indented deeper than its parent (level > 0).
    const parentRow = screen.getByText("วัสดุ").closest("li")!;
    const childRow = screen.getByText("รับเข้าวัตถุดิบ").closest("li")!;
    const parentIndent = parseInt((parentRow as HTMLElement).style.paddingLeft, 10);
    const childIndent = parseInt((childRow as HTMLElement).style.paddingLeft, 10);
    expect(childIndent).toBeGreaterThan(parentIndent);
  });

  it("shows a loading skeleton while the list is loading", () => {
    vi.mocked(useMenusList).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useMenusList>);
    render(<MenuManagementPage />);
    expect(screen.queryByText("วัสดุ")).not.toBeInTheDocument();
  });

  it("shows an error message when the list fails to load", () => {
    vi.mocked(useMenusList).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("network down"),
    } as unknown as ReturnType<typeof useMenusList>);
    render(<MenuManagementPage />);
    expect(screen.getByText("โหลดเมนูไม่สำเร็จ")).toBeInTheDocument();
    expect(screen.getByText("network down")).toBeInTheDocument();
  });

  it("opens the create dialog and submits a new root menu", async () => {
    const user = userEvent.setup();
    render(<MenuManagementPage />);

    await user.click(screen.getByRole("button", { name: "เพิ่มเมนู" }));
    expect(screen.getByText("เพิ่มเมนูใหม่")).toBeInTheDocument();

    // fireEvent.change instead of user.type — these are plain controlled
    // inputs with no per-keystroke logic to exercise, and char-by-char
    // typing of Thai text is measurably slow enough to flirt with the
    // suite's 15s test timeout when run alongside the rest of the file.
    fireEvent.change(screen.getByPlaceholderText("MENU_CODE"), { target: { value: "NEW_MENU" } });
    fireEvent.change(screen.getByPlaceholderText("จัดการอะไหล่"), { target: { value: "เมนูใหม่" } });
    fireEvent.change(screen.getByPlaceholderText("Materials Management"), {
      target: { value: "New Menu" },
    });

    await user.click(screen.getByRole("button", { name: "สร้างเมนู" }));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ code: "NEW_MENU", nameTh: "เมนูใหม่", nameEn: "New Menu" }),
      expect.anything(),
    );
  });

  it("opens the edit dialog prefilled for an existing menu", async () => {
    const user = userEvent.setup();
    render(<MenuManagementPage />);

    // The row renders 3 responsive action-button groups (desktop/tablet/
    // mobile) simultaneously in jsdom (no real media-query evaluation), so
    // each label appears 3 times per row — any one of them triggers the
    // same onClick.
    const row = screen.getByText("วัสดุ").closest("li")!;
    await user.click(within(row).getAllByRole("button", { name: "แก้ไข" })[0]!);

    expect(screen.getByText("แก้ไขเมนู")).toBeInTheDocument();
    expect(screen.getByDisplayValue("MATERIALS")).toBeInTheDocument();
    expect(screen.getByDisplayValue("วัสดุ")).toBeInTheDocument();
  });

  it("disables move-up for the first sibling and moves the second one up", async () => {
    const user = userEvent.setup();
    render(<MenuManagementPage />);

    const firstRow = screen.getByText("วัสดุ").closest("li")!;
    const secondRow = screen.getByText("รายงาน").closest("li")!;

    for (const btn of within(firstRow).getAllByRole("button", { name: "เลื่อนขึ้น" })) {
      expect(btn).toBeDisabled();
    }
    const secondUpButtons = within(secondRow).getAllByRole("button", { name: "เลื่อนขึ้น" });
    expect(secondUpButtons[0]).not.toBeDisabled();

    await user.click(secondUpButtons[0]!);

    expect(reorderMutate).toHaveBeenCalledWith([
      { id: rootMenu2.id, sortOrder: rootMenu.sortOrder, parentId: null },
      { id: rootMenu.id, sortOrder: rootMenu2.sortOrder, parentId: null },
    ]);
  });

  it("opens the delete confirmation and confirms deletion", async () => {
    const user = userEvent.setup();
    render(<MenuManagementPage />);

    const row = screen.getByText("รายงาน").closest("li")!;
    await user.click(within(row).getAllByRole("button", { name: "ลบ" })[0]!);

    expect(screen.getByText("ลบเมนูนี้?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "ลบเลย" }));

    expect(deleteMutate).toHaveBeenCalledWith(rootMenu2.id, expect.anything());
  });
});
