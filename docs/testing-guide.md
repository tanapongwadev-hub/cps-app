# Testing Guide

## Test Types

### 1. Unit Tests (Vitest)

ทดสอบ functions แยก

```ts
// src/utils/format.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency, formatPhone } from "./format";

describe("formatCurrency", () => {
  it("formats 1500 to THB currency", () => {
    expect(formatCurrency(1500)).toMatch(/1,500/);
  });

  it("handles zero", () => {
    expect(formatCurrency(0)).toMatch(/0/);
  });
});

describe("formatPhone", () => {
  it("formats 10-digit phone", () => {
    expect(formatPhone("0812345678")).toBe("081-234-5678");
  });
});
```

### 2. Component Tests (Vitest + RTL)

```tsx
// src/components/ui/button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>คลิก</Button>);
    expect(screen.getByRole("button", { name: "คลิก" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>คลิก</Button>);

    await userEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("disables when loading", () => {
    render(<Button loading>คลิก</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
```

### 3. Integration Tests (Vitest + RTL)

```tsx
// src/components/forms/text-field.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TextField } from "./form-field";

const schema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
});

function TestForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  return (
    <form>
      <TextField label="อีเมล" {...form.register("email")} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
    </form>
  );
}

describe("TextField", () => {
  it("shows error message when validation fails", async () => {
    render(<TestForm />);
    const input = screen.getByLabelText("อีเมล");
    await userEvent.type(input, "invalid");
    await userEvent.tab();
    expect(await screen.findByText("อีเมลไม่ถูกต้อง")).toBeInTheDocument();
  });
});
```

### 4. E2E Tests (Playwright)

```ts
// tests/e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("logs in with valid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("ชื่อผู้ใช้งาน").fill("admin");
    await page.getByLabel("รหัสผ่าน").fill("admin");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText("แดชบอร์ด")).toBeVisible();
  });

  test("shows error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("ชื่อผู้ใช้งาน").fill("admin");
    await page.getByLabel("รหัสผ่าน").fill("wrong");
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(page.getByText(/ผิดพลาด|ไม่ถูกต้อง/)).toBeVisible();
  });
});
```

## Running Tests

```bash
pnpm test              # Run all unit tests
pnpm test:watch        # Watch mode
pnpm test:ui           # Vitest UI
pnpm test:coverage     # With coverage
pnpm test:e2e          # E2E tests
pnpm test:e2e:ui       # Playwright UI
```

## Test Coverage Targets

- **Statements**: 60%
- **Branches**: 55%
- **Functions**: 60%
- **Lines**: 60%

ปรับใน `vitest.config.ts`

## What to Test

✅ **DO**:
- Utility functions
- Zod schemas (validation rules)
- Permission guards
- Form components (validation flow)
- Critical business logic

❌ **DON'T**:
- Test framework code (React, Next.js)
- Test third-party libraries
- Test 100% - focus on critical paths
- Test styling / visual aspects (use E2E / visual tests)

## Mocking

### Mock API Client

```ts
import { vi } from "vitest";

vi.mock("@/services/api-client", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: [], totalItems: 0 }),
    post: vi.fn().mockResolvedValue({}),
  },
}));
```

### Mock Next.js Router

```ts
// ใน vitest.setup.ts (มีอยู่แล้ว)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
}));
```

### Mock Zustand Store

```ts
vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn((selector) =>
    selector({
      user: { id: "1", fullName: "Test" },
      permissions: ["*"],
      hasPermission: () => true,
    })
  ),
}));
```

## Setup for New Test

1. Create file `<name>.test.ts` หรือ `<name>.test.tsx`
2. Import from `vitest`
3. Use `describe` + `it` blocks
4. Run `pnpm test`

## Best Practices

✅ One assertion focus per test
✅ Descriptive test names
✅ Arrange-Act-Assert pattern
✅ Use `findBy` for async elements
✅ Use `userEvent` instead of `fireEvent`
✅ Mock external dependencies
❌ Don't test implementation details
❌ Don't share state between tests
❌ Don't skip the cleanup
