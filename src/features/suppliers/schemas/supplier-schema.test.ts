import { describe, it, expect } from "vitest";
import { supplierSchema } from "./supplier-schema";

describe("supplierSchema", () => {
  it("accepts a valid minimal payload", () => {
    const r = supplierSchema.safeParse({ code: "SUP-001", nameTh: "บริษัท ABC" });
    expect(r.success).toBe(true);
  });

  it("trims string fields", () => {
    const r = supplierSchema.safeParse({
      code: "  SUP-001  ",
      nameTh: "  บริษัท  ",
      email: "  a@b.com  ",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.code).toBe("SUP-001");
      expect(r.data.nameTh).toBe("บริษัท");
      expect(r.data.email).toBe("a@b.com");
    }
  });

  it("rejects invalid email", () => {
    const r = supplierSchema.safeParse({
      code: "SUP-001",
      nameTh: "บริษัท",
      email: "not-email",
    });
    expect(r.success).toBe(false);
  });

  it("rejects empty nameTh", () => {
    const r = supplierSchema.safeParse({ code: "SUP-001", nameTh: "" });
    expect(r.success).toBe(false);
  });
});
