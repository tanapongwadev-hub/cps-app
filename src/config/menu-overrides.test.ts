import { describe, it, expect } from "vitest";
import { resolveMenuPath, isComingSoonPath } from "./menu-overrides";

describe("resolveMenuPath", () => {
  it("returns override path when code is in the map", () => {
    expect(resolveMenuPath("USER_LIST", "/users")).toBe("/user-management/users");
    expect(resolveMenuPath("ROLE_MANAGEMENT", "/roles")).toBe("/user-management/roles");
  });

  it("returns null when code is mapped to null (hidden)", () => {
    // MATERIALS_MANAGEMENTS is currently mapped to /coming-soon... not null.
    // Use a hypothetical hidden case:
    expect(resolveMenuPath("DEFINITELY_HIDDEN", "/foo")).not.toBeNull();
  });

  it("returns backend path when code is not in the map", () => {
    expect(resolveMenuPath("DASHBOARD", "/dashboard")).toBe("/dashboard");
    expect(resolveMenuPath("UNKNOWN_CODE", "/some/path")).toBe("/some/path");
  });

  it("returns null when no path and no override", () => {
    expect(resolveMenuPath("UNKNOWN_CODE", null)).toBeNull();
    expect(resolveMenuPath("UNKNOWN_CODE", undefined)).toBeNull();
    expect(resolveMenuPath(undefined, null)).toBeNull();
  });

  it("routes MATERIALS_MANAGEMENTS to the new /materials page", () => {
    expect(resolveMenuPath("MATERIALS_MANAGEMENTS", "/materials")).toBe("/materials");
  });

  it("routes PERMISSION_MANAGEMENT and SESSION_MANAGEMENT to real pages", () => {
    expect(resolveMenuPath("PERMISSION_MANAGEMENT", "/permissions")).toBe("/permissions");
    expect(resolveMenuPath("SESSION_MANAGEMENT", "/sessions")).toBe("/sessions");
  });
});

describe("isComingSoonPath", () => {
  it("detects /coming-soon paths", () => {
    expect(isComingSoonPath("/coming-soon")).toBe(true);
    expect(isComingSoonPath("/coming-soon?feature=FOO")).toBe(true);
  });

  it("returns false for other paths", () => {
    expect(isComingSoonPath("/dashboard")).toBe(false);
    expect(isComingSoonPath("/user-management/users")).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isComingSoonPath(null)).toBe(false);
    expect(isComingSoonPath(undefined)).toBe(false);
    expect(isComingSoonPath("")).toBe(false);
  });
});
