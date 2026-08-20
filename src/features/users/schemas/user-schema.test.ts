import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  updateUserSchema,
  addUserAssignmentSchema,
  updateUserStatusSchema,
} from "./user-schema";

describe("createUserSchema", () => {
  const validData = {
    username: "johndoe",
    password: "Password1",
    confirmPassword: "Password1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    telephone: "0812345678",
    assignments: [{ departmentId: "dept-001", roleId: "role-001" }],
  };

  it("accepts valid data", () => {
    const result = createUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects short username", () => {
    const result = createUserSchema.safeParse({ ...validData, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid username characters", () => {
    const result = createUserSchema.safeParse({ ...validData, username: "john doe!" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = createUserSchema.safeParse({ ...validData, password: "Pass1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = createUserSchema.safeParse({ ...validData, password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = createUserSchema.safeParse({ ...validData, password: "Password" });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched confirm password", () => {
    const result = createUserSchema.safeParse({
      ...validData,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty assignments array", () => {
    const result = createUserSchema.safeParse({ ...validData, assignments: [] });
    expect(result.success).toBe(false);
  });

  it("rejects assignment with empty departmentId", () => {
    const result = createUserSchema.safeParse({
      ...validData,
      assignments: [{ departmentId: "", roleId: "role-001" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects assignment with empty roleId", () => {
    const result = createUserSchema.safeParse({
      ...validData,
      assignments: [{ departmentId: "dept-001", roleId: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("allows empty telephone", () => {
    const result = createUserSchema.safeParse({ ...validData, telephone: "" });
    expect(result.success).toBe(true);
  });

  it("allows missing telephone", () => {
    const { telephone: _t, ...withoutPhone } = validData;
    void _t;
    const result = createUserSchema.safeParse(withoutPhone);
    expect(result.success).toBe(true);
  });
});

describe("updateUserSchema", () => {
  const validData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    telephone: "0812345678",
    assignments: [
      {
        id: "assignment-1",
        departmentId: "dept-1",
        roleId: "role-1",
        roleScopeType: "DEPARTMENT" as const,
      },
    ],
  };

  it("accepts valid data", () => {
    const result = updateUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("requires firstName and lastName", () => {
    expect(updateUserSchema.safeParse({ ...validData, firstName: "" }).success).toBe(false);
    expect(updateUserSchema.safeParse({ ...validData, lastName: "" }).success).toBe(false);
  });

  it("requires valid email", () => {
    expect(updateUserSchema.safeParse({ ...validData, email: "bad" }).success).toBe(false);
  });

  it("requires at least one assignment", () => {
    expect(
      updateUserSchema.safeParse({ ...validData, assignments: [] }).success,
    ).toBe(false);
  });

  it("rejects duplicate department and role pairs", () => {
    expect(
      updateUserSchema.safeParse({
        ...validData,
        assignments: [
          validData.assignments[0],
          { ...validData.assignments[0], id: "assignment-2" },
        ],
      }).success,
    ).toBe(false);
  });

  it("allows different roles in the same department", () => {
    expect(
      updateUserSchema.safeParse({
        ...validData,
        assignments: [
          validData.assignments[0],
          {
            id: "assignment-2",
            departmentId: "dept-1",
            roleId: "role-2",
            roleScopeType: "DEPARTMENT",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("requires null department for a system role", () => {
    expect(
      updateUserSchema.safeParse({
        ...validData,
        assignments: [
          {
            departmentId: "dept-1",
            roleId: "super",
            roleScopeType: "SYSTEM",
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      updateUserSchema.safeParse({
        ...validData,
        assignments: [
          {
            departmentId: null,
            roleId: "super",
            roleScopeType: "SYSTEM",
          },
        ],
      }).success,
    ).toBe(true);
  });

  it("requires a department for a department role", () => {
    expect(
      updateUserSchema.safeParse({
        ...validData,
        assignments: [
          {
            departmentId: null,
            roleId: "role-1",
            roleScopeType: "DEPARTMENT",
          },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("updateUserStatusSchema", () => {
  it("accepts isActive true", () => {
    expect(updateUserStatusSchema.safeParse({ isActive: true }).success).toBe(true);
  });
  it("accepts isActive false", () => {
    expect(updateUserStatusSchema.safeParse({ isActive: false }).success).toBe(true);
  });
  it("rejects missing isActive", () => {
    expect(updateUserStatusSchema.safeParse({}).success).toBe(false);
  });
  it("rejects non-boolean isActive", () => {
    expect(updateUserStatusSchema.safeParse({ isActive: "active" }).success).toBe(false);
  });
});

describe("addUserAssignmentSchema", () => {
  it("accepts valid data", () => {
    expect(
      addUserAssignmentSchema.safeParse({ departmentId: "d1", roleId: "r1" }).success,
    ).toBe(true);
  });
  it("rejects missing departmentId", () => {
    expect(addUserAssignmentSchema.safeParse({ roleId: "r1" }).success).toBe(false);
  });
  it("rejects missing roleId", () => {
    expect(addUserAssignmentSchema.safeParse({ departmentId: "d1" }).success).toBe(false);
  });
});
