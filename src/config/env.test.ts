import { describe, it, expect } from "vitest";
import { env, isDev, isProd, isMockMode } from "./env";

describe("env config", () => {
  it("has app config", () => {
    expect(env.app).toBeDefined();
    expect(env.app.name).toBeDefined();
    expect(env.app.version).toBeDefined();
  });

  it("has api config", () => {
    expect(env.api.baseUrl).toBeDefined();
    expect(typeof env.api.timeout).toBe("number");
  });

  it("has features config", () => {
    expect(typeof env.features.enableDarkMode).toBe("boolean");
    expect(typeof env.features.enableI18n).toBe("boolean");
  });

  it("isDev is boolean", () => {
    expect(typeof isDev).toBe("boolean");
  });

  it("isProd is boolean", () => {
    expect(typeof isProd).toBe("boolean");
  });

  it("isMockMode is boolean", () => {
    expect(typeof isMockMode).toBe("boolean");
  });
});
