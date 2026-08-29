import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Permission } from "@/features/permissions/types";
import { DepartmentPermissionDialog } from "./department-permission-dialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  usePermissionDepartments: vi.fn(),
  useUpdatePermissionDepartments: vi.fn(),
}));

vi.mock("../hooks/use-permissions", () => ({
  usePermissionDepartments: mocks.usePermissionDepartments,
  useUpdatePermissionDepartments: mocks.useUpdatePermissionDepartments,
}));

const departmentA = {
  id: "1",
  code: "WE",
  nameTh: "แผนกวิศวกรรม",
  nameEn: "Engineering",
};
const departmentB = {
  id: "2",
  code: "PS",
  nameTh: "แผนกผลิต",
  nameEn: "Production",
};
const permission: Permission = {
  id: "10",
  code: "order.approve",
  departments: [departmentA],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("DepartmentPermissionDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.usePermissionDepartments.mockReturnValue({
      data: {
        items: [departmentA, departmentB],
        meta: {
          page: 1,
          limit: 1000,
          totalItems: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
      isError: false,
    });
    mocks.useUpdatePermissionDepartments.mockReturnValue({
      mutateAsync: mocks.mutateAsync,
      isPending: false,
    });
    mocks.mutateAsync.mockResolvedValue(permission);
  });

  it("starts with the permission's current departments selected", () => {
    render(
      <DepartmentPermissionDialog
        open
        onOpenChange={vi.fn()}
        permission={permission}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /แผนกวิศวกรรม/ }),
    ).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /แผนกผลิต/ })).not.toBeChecked();
  });

  it("searches by code and selects all visible results", async () => {
    const user = userEvent.setup();
    render(
      <DepartmentPermissionDialog
        open
        onOpenChange={vi.fn()}
        permission={{ ...permission, departments: [] }}
      />,
    );

    await user.type(screen.getByPlaceholderText("ค้นหาแผนก..."), "PS");
    expect(screen.queryByText("แผนกวิศวกรรม")).not.toBeInTheDocument();
    expect(screen.getByText("แผนกผลิต")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "เลือกทั้งหมด" }));
    await user.click(screen.getByRole("button", { name: "บันทึกการกำหนดแผนก" }));

    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      id: "10",
      departmentIds: ["2"],
    });
  });

  it("clears every selection and saves an unrestricted permission", async () => {
    const user = userEvent.setup();
    render(
      <DepartmentPermissionDialog
        open
        onOpenChange={vi.fn()}
        permission={permission}
      />,
    );

    await user.click(screen.getByRole("button", { name: "ล้างทั้งหมด" }));
    expect(screen.getByText("ใช้งานได้ทุกแผนก")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "บันทึกการกำหนดแผนก" }));

    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      id: "10",
      departmentIds: [],
    });
  });

  it("keeps the dialog open when saving fails", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mocks.mutateAsync.mockRejectedValue(new Error("network"));
    render(
      <DepartmentPermissionDialog
        open
        onOpenChange={onOpenChange}
        permission={permission}
      />,
    );

    await user.click(screen.getByRole("button", { name: "บันทึกการกำหนดแผนก" }));

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
