import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatRelative, toISO, fromISO } from "./date";

describe("formatDate", () => {
  it("formats ISO string", () => {
    const result = formatDate("2024-01-15T00:00:00.000Z");
    expect(result).not.toBe("-");
  });

  it("returns - for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns - for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });
});

describe("formatDateTime", () => {
  it("formats datetime", () => {
    const result = formatDateTime("2024-01-15T10:30:00.000Z");
    expect(result).not.toBe("-");
  });
});

describe("formatRelative", () => {
  it("returns - for null", () => {
    expect(formatRelative(null)).toBe("-");
  });

  it("formats recent date", () => {
    const recent = new Date(Date.now() - 60_000).toISOString();
    const result = formatRelative(recent);
    expect(result).not.toBe("-");
  });
});

describe("toISO / fromISO", () => {
  it("converts Date to ISO", () => {
    const date = new Date("2024-01-15T10:30:00.000Z");
    expect(toISO(date)).toBe("2024-01-15T10:30:00.000Z");
  });

  it("returns null for undefined", () => {
    expect(toISO(undefined)).toBe(null);
    expect(fromISO(undefined)).toBe(null);
  });

  it("converts ISO to Date", () => {
    const result = fromISO("2024-01-15T10:30:00.000Z");
    expect(result).toBeInstanceOf(Date);
  });

  it("returns null for invalid ISO", () => {
    expect(fromISO("invalid")).toBe(null);
  });
});
