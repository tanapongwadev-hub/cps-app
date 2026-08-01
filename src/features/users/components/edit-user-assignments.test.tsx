import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, it } from "vitest";
import type { Department } from "@/types/department";
import type { Role } from "@/types/role";
import {
  updateUserSchema,
  type EditUserAssignmentValues,
  type UpdateUserFormValues,
} from "../schemas/user-schema";
import {
  EditUserAssignments,
  resolveRoleScope,
} from "./edit-user-assignments";

const departments: Department[] = [
  {
    id: "dept-1",
    code: "PROD",
    nameTh: "ฝ่ายผลิต",
    nameEn: "Production",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const roles: Role[] = [
  {
    id: "role-1",
    code: "MANAGER",
    name: "Manager",
    nameTh: "ผู้จัดการ",
    scopeType: "DEPARTMENT",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "role-system",
    code: "SUPER_ADMIN",
    name: "Super Admin",
    nameTh: "ผู้ดูแลระบบ",
    scopeType: "SYSTEM",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "role-built-in",
    code: "USER",
    name: "User",
    nameTh: "ผู้ใช้งาน",
    scopeType: "DEPARTMENT",
    isSystem: true,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

const firstAssignment: EditUserAssignmentValues = {
  id: "assignment-1",
  departmentId: "dept-1",
  roleId: "role-1",
  roleScopeType: "DEPARTMENT",
};

function AssignmentEditorHarness({
  initialAssignments,
}: {
  initialAssignments: EditUserAssignmentValues[];
}) {
  const form = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: "Somchai",
      lastName: "Jaidee",
      email: "somchai@example.com",
      telephone: "",
      assignments: initialAssignments,
    },
  });

  return (
    <EditUserAssignments form={form} departments={departments} roles={roles} disabled={false} />
  );
}

describe("EditUserAssignments", () => {
  it("adds a local assignment row", async () => {
    const user = userEvent.setup();
    render(<AssignmentEditorHarness initialAssignments={[firstAssignment]} />);

    await user.click(screen.getByRole("button", { name: "เพิ่ม Assignment" }));

    expect(screen.getAllByTestId("assignment-row")).toHaveLength(2);
  });

  it("does not remove a row until deletion is confirmed", async () => {
    const user = userEvent.setup();
    render(
      <AssignmentEditorHarness
        initialAssignments={[
          firstAssignment,
          {
            id: "assignment-2",
            departmentId: null,
            roleId: "role-system",
            roleScopeType: "SYSTEM",
          },
        ]}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: /ลบ Assignment/ })[0]!);
    expect(screen.getByText(/ยืนยันการลบ Assignment/)).toBeInTheDocument();
    expect(screen.getAllByTestId("assignment-row")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "ลบ" }));

    expect(screen.getAllByTestId("assignment-row")).toHaveLength(1);
  });

  it("disables deletion when only one assignment remains", () => {
    render(<AssignmentEditorHarness initialAssignments={[firstAssignment]} />);

    expect(screen.getByRole("button", { name: /ลบ Assignment/ })).toBeDisabled();
    expect(screen.getByText(/อย่างน้อย 1 Assignment/)).toBeInTheDocument();
  });

  it("shows the system-wide department treatment for a system role", () => {
    render(
      <AssignmentEditorHarness
        initialAssignments={[
          {
            id: "assignment-system",
            departmentId: null,
            roleId: "role-system",
            roleScopeType: "SYSTEM",
          },
        ]}
      />,
    );

    expect(screen.getByText("ทุกแผนก (System)")).toBeInTheDocument();
  });

  it("keeps a built-in department role department-scoped", () => {
    expect(resolveRoleScope(roles[2])).toBe("DEPARTMENT");
  });
});
