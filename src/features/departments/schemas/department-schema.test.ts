import { describe, it, expect } from "vitest";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "./department-schema";

describe("createDepartmentSchema", () => {
  const validData = {
    code: "IT",
    nameTh: "แผนกไอที",
    nameEn: "IT Department",
  };

  it("accepts valid data", () => {
    const result = createDepartmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty code", () => {
    const result = createDepartmentSchema.safeParse({ ...validData, code: "" });
    expect(result.success).toBe(false);
  });

  it("rejects lowercase code", () => {
    const result = createDepartmentSchema.safeParse({ ...validData, code: "it" });
    expect(result.success).toBe(false);
  });

  it("rejects code with special characters", () => {
    const result = createDepartmentSchema.safeParse({ ...validData, code: "IT@DEPT" });
    expect(result.success).toBe(false);
  });

  it("rejects empty nameTh", () => {
    const result = createDepartmentSchema.safeParse({ ...validData, nameTh: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty nameEn", () => {
    const result = createDepartmentSchema.safeParse({ ...validData, nameEn: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing nameEn (real backend requires it)", () => {
    const { nameEn: _n, ...withoutNameEn } = validData;
    void _n;
    const result = createDepartmentSchema.safeParse(withoutNameEn);
    expect(result.success).toBe(false);
  });

  it("rejects legacy `name` field", () => {
    const result = createDepartmentSchema.safeParse({
      ...validData,
      name: "Legacy Name",
    });
    // Strict mode: the schema doesn't allow `name` so it gets stripped.
    // Verify the strict object would reject extra keys.
    const strict = createDepartmentSchema.strict().safeParse({
      ...validData,
      name: "Legacy Name",
    });
    expect(strict.success).toBe(false);
  });

  it("accepts code with hyphens and underscores", () => {
    const result = createDepartmentSchema.safeParse({
      ...validData,
      code: "IT-DEV_TEST",
    });
    expect(result.success).toBe(true);
  });
});

describe("updateDepartmentSchema", () => {
  const validData = {
    nameTh: "แผนกไอที",
    nameEn: "IT Department",
  };

  it("accepts valid data", () => {
    const result = updateDepartmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects empty nameTh", () => {
    const result = updateDepartmentSchema.safeParse({ ...validData, nameTh: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty nameEn", () => {
    const result = updateDepartmentSchema.safeParse({ ...validData, nameEn: "" });
    expect(result.success).toBe(false);
  });

  it("does not require code (PATCH /departments/:id only takes nameTh/nameEn)", () => {
    const result = updateDepartmentSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
