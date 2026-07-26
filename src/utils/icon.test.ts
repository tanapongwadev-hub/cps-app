import { describe, it, expect } from "vitest";
import { resolveLucideIcon } from "./icon";

describe("resolveLucideIcon", () => {
  it("returns null for null/undefined/empty", () => {
    expect(resolveLucideIcon(null)).toBeNull();
    expect(resolveLucideIcon(undefined)).toBeNull();
    expect(resolveLucideIcon("")).toBeNull();
    expect(resolveLucideIcon("   ")).toBeNull();
  });

  it("resolves exact PascalCase names", () => {
    expect(resolveLucideIcon("Menu")).not.toBeNull();
    expect(resolveLucideIcon("Shield")).not.toBeNull();
    expect(resolveLucideIcon("Key")).not.toBeNull();
    expect(resolveLucideIcon("Clock")).not.toBeNull();
  });

  it("resolves lowercase names via PascalCase conversion", () => {
    expect(resolveLucideIcon("menu")).not.toBeNull();
    expect(resolveLucideIcon("shield")).not.toBeNull();
    expect(resolveLucideIcon("key")).not.toBeNull();
    expect(resolveLucideIcon("clock")).not.toBeNull();
  });

  it("resolves kebab-case names", () => {
    expect(resolveLucideIcon("file-text")).not.toBeNull();
    expect(resolveLucideIcon("layout-dashboard")).not.toBeNull();
    expect(resolveLucideIcon("chevron-right")).not.toBeNull();
  });

  it("resolves building → Building2 (with the 2 suffix variant)", () => {
    expect(resolveLucideIcon("building")).not.toBeNull();
  });

  it("returns null for unknown icons", () => {
    expect(resolveLucideIcon("totally-fake-icon-name")).toBeNull();
  });
});
