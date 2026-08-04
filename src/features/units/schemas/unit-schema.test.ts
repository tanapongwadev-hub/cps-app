import { unitSchema } from "./unit-schema";

describe("unitSchema", () => {
  it("accepts a valid minimal payload", () => {
    const result = unitSchema.safeParse({ code: "PCS", nameTh: "ชิ้น" });
    expect(result.success).toBe(true);
  });

  it("trims string fields", () => {
    const result = unitSchema.safeParse({
      code: "  PCS  ",
      nameTh: "  ชิ้น  ",
      nameEn: "  Piece  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("PCS");
      expect(result.data.nameTh).toBe("ชิ้น");
      expect(result.data.nameEn).toBe("Piece");
    }
  });

  it("rejects empty code", () => {
    const result = unitSchema.safeParse({ code: "", nameTh: "ชิ้น" });
    expect(result.success).toBe(false);
  });

  it("rejects empty nameTh", () => {
    const result = unitSchema.safeParse({ code: "PCS", nameTh: "" });
    expect(result.success).toBe(false);
  });

  it("rejects code longer than 20 chars", () => {
    const result = unitSchema.safeParse({ code: "A".repeat(21), nameTh: "x" });
    expect(result.success).toBe(false);
  });
});
