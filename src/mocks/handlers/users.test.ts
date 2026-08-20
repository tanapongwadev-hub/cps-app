import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mockDb } from "../db";
import { setupUserMocks } from "./users";

const targetUserId = "user-002";
let originalUsers: typeof mockDb.users;
let originalAssignments: typeof mockDb.userDepartmentRoles;

describe("mock aggregate user update", () => {
  beforeEach(() => {
    originalUsers = structuredClone(mockDb.users);
    originalAssignments = structuredClone(mockDb.userDepartmentRoles);
  });

  afterEach(() => {
    mockDb.users.splice(0, mockDb.users.length, ...originalUsers);
    mockDb.userDepartmentRoles.splice(
      0,
      mockDb.userDepartmentRoles.length,
      ...originalAssignments,
    );
  });

  it("rejects duplicate assignment pairs without mutating profile or assignments", async () => {
    const beforeUser = structuredClone(
      mockDb.users.find((user) => user.id === targetUserId),
    );
    const beforeAssignments = structuredClone(
      mockDb.userDepartmentRoles.filter(
        (assignment) => assignment.userId === targetUserId,
      ),
    );

    const response = await setupUserMocks(
      `/users/${targetUserId}`,
      "PATCH",
      {
        firstName: "Changed",
        assignments: [
          { departmentId: "dept-hr", roleId: "role-manager" },
          { departmentId: "dept-hr", roleId: "role-manager" },
        ],
      },
    );

    expect(response?.status).toBe(409);
    expect(mockDb.users.find((user) => user.id === targetUserId)).toEqual(
      beforeUser,
    );
    expect(
      mockDb.userDepartmentRoles.filter(
        (assignment) => assignment.userId === targetUserId,
      ),
    ).toEqual(beforeAssignments);
  });

  it("retains, edits, adds, and removes assignments before bumping permissionVersion", async () => {
    const response = await setupUserMocks(
      `/users/${targetUserId}`,
      "PATCH",
      {
        firstName: "Updated",
        assignments: [
          {
            id: "udr-003",
            departmentId: "dept-hr",
            roleId: "role-staff",
          },
          {
            departmentId: "dept-finance",
            roleId: "role-manager",
          },
        ],
      },
    );
    const body = (await response?.json()) as {
      data: { firstName: string; permissionVersion: number };
    };

    expect(response?.status).toBe(200);
    expect(body.data).toMatchObject({
      firstName: "Updated",
      permissionVersion: 1,
    });

    const assignments = mockDb.userDepartmentRoles.filter(
      (assignment) => assignment.userId === targetUserId,
    );
    expect(assignments).toHaveLength(2);
    expect(assignments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "udr-003",
          departmentId: "dept-hr",
          roleId: "role-staff",
        }),
        expect.objectContaining({
          departmentId: "dept-finance",
          roleId: "role-manager",
        }),
      ]),
    );
    expect(assignments.some((assignment) => assignment.id === "udr-004")).toBe(
      false,
    );
  });
});
