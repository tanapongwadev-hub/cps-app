import { describe, it, expect } from "vitest";
import { createUserSchema, updateUserSchema } from "./user-schema";

describe("createUserSchema", () => {
  const validData = {
    username: "johndoe",
    password: "Password1",
    confirmPassword: "Password1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "0812345678",
    departmentId: "dept-001",
    roleIds: ["role-001"],
    status: "active" as const,
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
    const result = createUserSchema.safeParse({ ...validData, confirmPassword: "Different1" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createUserSchema.safeParse({ ...validData, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty roleIds", () => {
    const result = createUserSchema.safeParse({ ...validData, roleIds: [] });
    expect(result.success).toBe(false);
  });

  it("allows empty phone", () => {
    const result = createUserSchema.safeParse({ ...validData, phone: "" });
    expect(result.success).toBe(true);
  });
});

describe("updateUserSchema", () => {
  const validData = {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "0812345678",
    departmentId: "dept-001",
    roleIds: ["role-001"],
    status: "active" as const,
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
});
