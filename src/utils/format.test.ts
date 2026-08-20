import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatPhone,
  truncate,
  getInitials,
  maskEmail,
  maskPhone,
  pluralize,
} from "./format";

describe("formatNumber", () => {
  it("formats number with Thai locale", () => {
    expect(formatNumber(1234567)).toMatch(/1,234,567/);
  });
  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });
});

describe("formatCurrency", () => {
  it("formats 1500 as THB", () => {
    const result = formatCurrency(1500);
    expect(result).toContain("1,500");
  });
  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});

describe("formatPercent", () => {
  it("converts number to percent", () => {
    expect(formatPercent(50)).toMatch(/50/);
  });
  it("handles decimals", () => {
    expect(formatPercent(33.33, "en-US", 2)).toMatch(/33\.33/);
  });
});

describe("formatPhone", () => {
  it("formats 10-digit phone", () => {
    expect(formatPhone("0812345678")).toBe("081-234-5678");
  });
  it("formats 9-digit phone", () => {
    expect(formatPhone("812345678")).toBe("81-234-5678");
  });
  it("returns input as-is for invalid length", () => {
    expect(formatPhone("12345")).toBe("12345");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    expect(truncate("Hello World", 8)).toBe("Hello...");
  });
  it("keeps short text as-is", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });
  it("uses custom suffix", () => {
    expect(truncate("Hello World", 6, "…")).toBe("Hello…");
  });
});

describe("getInitials", () => {
  it("returns initials", () => {
    expect(getInitials("สมชาย", "ใจดี")).toBe("สใ");
  });
  it("handles single name", () => {
    expect(getInitials("สมชาย")).toBe("ส");
  });
  it("returns ? for empty", () => {
    expect(getInitials()).toBe("?");
  });
});

describe("maskEmail", () => {
  it("masks email local part", () => {
    expect(maskEmail("john.doe@example.com")).toBe("jo***@example.com");
  });
  it("handles short local", () => {
    expect(maskEmail("ab@example.com")).toBe("a***@example.com");
  });
  it("returns invalid email as-is", () => {
    expect(maskEmail("not-an-email")).toBe("not-an-email");
  });
});

describe("maskPhone", () => {
  it("masks middle of phone", () => {
    expect(maskPhone("0812345678")).toBe("081-***-678");
  });
  it("returns short phone as-is", () => {
    expect(maskPhone("12345")).toBe("12345");
  });
});

describe("pluralize", () => {
  it("uses singular for 1", () => {
    expect(pluralize(1, "item")).toBe("1 item");
  });
  it("uses plural for 0", () => {
    expect(pluralize(0, "item")).toBe("0 items");
  });
  it("uses plural for 2+", () => {
    expect(pluralize(5, "item")).toBe("5 items");
  });
  it("uses custom plural", () => {
    expect(pluralize(2, "child", "children")).toBe("2 children");
  });
});
