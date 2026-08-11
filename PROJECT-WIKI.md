# 📖 PROJECT WIKI

> **⚠️ สำคัญ: AI และ Developer ทุกคนต้องอ่านไฟล์นี้ก่อนแก้ไขโปรเจกต์**

เอกสารนี้เป็นศูนย์รวมความรู้เกี่ยวกับโปรเจกต์ Admin Template ครอบคลุม Architecture, Coding Convention, Workflow และแนวทางปฏิบัติที่ดีที่สุด

---

## 📑 สารบัญ

1. [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
2. [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
3. [Coding Standards](#coding-standards)
4. [Naming Convention](#naming-convention)
5. [วิธีเพิ่ม Module ใหม่](#วิธีเพิ่ม-module-ใหม่)
6. [วิธีเพิ่ม Menu](#วิธีเพิ่ม-menu)
7. [วิธีเพิ่ม Permission](#วิธีเพิ่ม-permission)
8. [วิธีเรียก API](#วิธีเรียก-api)
9. [วิธีสร้าง Form](#วิธีสร้าง-form)
10. [วิธีสร้าง Data Table](#วิธีสร้าง-data-table)
11. [วิธีเขียน Test](#วิธีเขียน-test)
12. [Git Workflow](#git-workflow)
13. [Error Handling](#error-handling)
14. [Performance](#performance)
15. [Security](#security)

---

## ภาพรวมโปรเจกต์

Admin Template เป็น Frontend สำหรับระบบ Enterprise Admin ที่ออกแบบมาให้:

- **Modular** - แต่ละ Feature แยกออกจากกัน เพิ่ม/ลบ ได้ง่าย
- **Type-safe** - ใช้ TypeScript Strict Mode ทุกที่ ไม่มี `any` โดยไม่จำเป็น
- **Reusable** - Component กลางที่นำกลับมาใช้ซ้ำได้
- **Production-ready** - รองรับ Error, Loading, Empty state ครบ
- **Secure** - ไม่เก็บ Secret ใน Client, Token-based auth, Permission guards
- **Accessible** - ARIA, Keyboard nav, Focus management
- **Thai-friendly** - ฟอนต์ Noto Sans Thai, ตัวอักษรไม่ล้น, รองรับ RTL-ready

### Tech Stack สรุป

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, RSC) |
| Language | TypeScript 5 (Strict) |
| Styling | Tailwind CSS v4 + CSS Variables |
| UI | Custom shadcn-style components |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table v8 |
| Server State | TanStack Query v5 |
| Client State | Zustand |
| Charts | Recharts |
| Icons | Lucide React |
| Testing | Vitest + RTL + Playwright |

---

## โครงสร้างโปรเจกต์

ดูรายละเอียดเพิ่มเติมที่ [docs/project-structure.md](./docs/project-structure.md)

### โฟลเดอร์หลัก

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Public routes (login, forgot, reset)
│   ├── (admin)/              # Protected routes (with sidebar)
│   ├── 403/, 404/, 500/      # Error routes
│   ├── layout.tsx
│   ├── page.tsx              # Redirect to /login
│   └── global-error.tsx
│
├── components/               # Shared UI components
│   ├── ui/                   # Base primitives (Button, Input, Card, ...)
│   ├── layout/               # Layout components (Sidebar, TopNav, PageHeader)
│   ├── forms/                # Form components (TextField, ConfirmDialog)
│   ├── tables/               # DataTable + ActionMenu
│   └── feedback/             # Error pages, Empty states
│
├── features/                 # Feature modules
│   └── <feature>/
│       ├── api/              # API service functions
│       ├── components/       # Feature-specific components
│       ├── hooks/            # React Query hooks
│       ├── schemas/          # Zod schemas
│       ├── types/            # TypeScript types
│       └── constants/        # Feature constants
│
├── services/                 # Global services
│   └── api-client.ts         # HTTP client with interceptors
│
├── stores/                   # Zustand stores
│   ├── auth-store.ts         # User, token, permissions
│   └── ui-store.ts           # Sidebar, theme, language
│
├── types/                    # Global TypeScript types
│   ├── common.ts             # ApiResponse, PaginatedResponse
│   ├── auth.ts               # User, Role, Department
│   ├── menu.ts               # MenuItem
│   ├── ticket.ts             # Ticket, TicketStatus
│   └── ...
│
├── constants/                # App-wide constants
│   ├── app.ts                # App name, storage keys, query keys
│   └── permissions.ts        # Permission codes
│
├── config/                   # Configuration
│   └── env.ts                # Environment variables
│
├── lib/                      # 3rd party setup
│   ├── providers.tsx         # Root providers
│   ├── query-client.ts       # TanStack Query setup
│   ├── theme-provider.tsx    # next-themes wrapper
│   └── toast.ts              # Toast helpers
│
├── utils/                    # Pure utility functions
│   ├── cn.ts                 # className merger
│   ├── format.ts             # Number, currency, date formatting
│   ├── date.ts               # Date utilities
│   └── storage.ts            # localStorage / sessionStorage
│
└── mocks/                    # Mock data + handlers
    ├── handlers/             # Mock API handlers per feature
    ├── db.ts                 # In-memory database
    └── index.ts              # Setup function
```

### Feature modules ที่สำคัญ

| Feature | Path | บทบาท |
|---|---|---|
| `materials-receiving` | `src/features/materials-receiving/` | รับเข้าวัตถุดิบ (single material) + คำนวณบรรจุภัณฑ์ + generate QR + update stock balance (route: `/materials/materials-receiving`) |
| `goods-receipts` | `src/features/goods-receipts/` | เอกสารรับเข้าวัตถุดิบ (multi-line) + ไฟล์แนบ + reject reasons (route: `/materials/goods-receipts`) |
| `materials` | `src/features/materials/` | Material Master CRUD + รูปภาพ |
| `reject-reasons` | `src/features/reject-reasons/` | Master data: เหตุผลการปฏิเสธ |

**สำคัญ — ความต่างระหว่าง Materials Receiving vs Goods Receipt:**
- **Materials Receiving** — 1 material ต่อ 1 ใบ, generate Internal Lot No. (`CCI-YYYYMMDD-XXX`) + Supplier Lot No. (`SUP-YYYYMMDD`), package breakdown (`CEIL(qty / packing)`), QR code, update `stock_balances` + `stock_transactions` ทันทีที่ confirm
- **Goods Receipt** — เอกสารหลายบรรทัด, generate `GR-YYYYMM-NNNN`, มี reject reasons และ attachments, ไม่แตะ stock (ยังไม่มี stock ledger ในเฟสนี้)

---

## Coding Standards

### 1. TypeScript

- **เปิด Strict Mode** เสมอ (มีอยู่ใน tsconfig.json แล้ว)
- **ห้ามใช้ `any`** - ใช้ `unknown` แล้ว narrow type แทน
- **ใช้ type inference** เมื่อเป็นไปได้
- **Define type ทั้งหมด** - ไม่ปล่อยให้ implicit

```ts
// ❌ Bad
const handleChange = (e: any) => {
  setValue(e.target.value);
};

// ✅ Good
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};
```

### 2. Components

- ใช้ **Functional Component** เท่านั้น
- ใช้ **forwardRef** เมื่อ component ต้องรับ ref
- ใช้ **React.forwardRef + displayName**
- แยก **Business logic** ออกจาก UI (เก็บใน hooks)
- **ไม่เขียน Inline Style** - ใช้ Tailwind classes แทน

```tsx
// ❌ Bad
export function UserCard(props) {
  return <div style={{padding: 16, color: 'red'}}>{props.name}</div>;
}

// ✅ Good
export const UserCard = React.forwardRef<HTMLDivElement, UserCardProps>(
  ({ name, className }, ref) => (
    <div ref={ref} className={cn("p-4 text-danger", className)}>
      {name}
    </div>
  )
);
UserCard.displayName = "UserCard";
```

### 3. File Organization

- **1 component = 1 file** (ยกเว้น small variants)
- Component ขนาดใหญ่ควรแตกเป็น sub-components
- **ไม่เขียน Component ซ้ำ** - ใช้ Shared components จาก `components/`
- **Validation Schema แยกไฟล์** - อยู่ใน `features/<f>/schemas/`
- **Type แยกไฟล์** - อยู่ใน `features/<f>/types/` หรือ `types/`

### 4. Magic Strings

**ห้ามใช้ Magic Strings** - ใช้ Constants แทน

```ts
// ❌ Bad
if (user.status === "active") { ... }

// ✅ Good
import { UserStatus } from "@/constants/user";
if (user.status === UserStatus.ACTIVE) { ... }
```

---

## Naming Convention

| Item | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `UserFormDialog.tsx` |
| Hook | camelCase with `use` prefix | `useUsers.ts` |
| Util | camelCase | `formatDate.ts` |
| Constant | SCREAMING_SNAKE | `API_TIMEOUT` |
| Type | PascalCase | `User`, `LoginFormValues` |
| Permission | `module.action` lowercase | `user.create` |
| File (page) | lowercase with hyphens | `forgot-password/page.tsx` |

---

## วิธีเพิ่ม Module ใหม่

ตัวอย่าง: เพิ่ม Module "Products"

### 1. สร้าง Feature folder

```bash
src/features/products/
├── api/products-api.ts
├── hooks/use-products.ts
├── schemas/product-schema.ts
├── types/index.ts
├── components/
│   ├── product-form-dialog.tsx
│   └── product-detail.tsx
└── constants.ts
```

### 2. กำหนด Type

```ts
// src/features/products/types/index.ts
export interface Product extends BaseEntity {
  code: string;
  name: string;
  price: number;
  status: Status;
}
```

### 3. สร้าง API service

```ts
// src/features/products/api/products-api.ts
export const productsApi = {
  list: (params) => apiClient.get<PaginatedResponse<Product>>("/products", { params }),
  get: (id) => apiClient.get<Product>(`/products/${id}`),
  create: (data) => apiClient.post<Product>("/products", data),
  update: (id, data) => apiClient.put<Product>(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};
```

### 4. สร้าง React Query hooks

```ts
// src/features/products/hooks/use-products.ts
export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ["products", "list", params],
    queryFn: () => productsApi.list(params),
  });
}
```

### 5. สร้าง Zod Schema

```ts
// src/features/products/schemas/product-schema.ts
export const productSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0),
  status: z.enum(["active", "inactive"]),
});
```

### 6. สร้างหน้า Page

```tsx
// src/app/(admin)/operations/products/page.tsx
"use client";
import { useProducts } from "@/features/products/hooks/use-products";

export default function ProductsPage() {
  const { data, isLoading } = useProducts({ page: 1, pageSize: 10 });
  // ...
}
```

### 7. (Optional) เพิ่ม Mock Handler

```ts
// src/mocks/handlers/products.ts
export async function setupProductMocks(path, method, body) {
  if (path === "/products" && method === "GET") { ... }
  return null;
}
```

### 8. (Optional) เพิ่ม Permission + Menu

ดู [วิธีเพิ่ม Permission](#วิธีเพิ่ม-permission) และ [วิธีเพิ่ม Menu](#วิธีเพิ่ม-menu)

---

## วิธีเพิ่ม Menu

### 1. เพิ่มใน `src/mocks/db.ts` (สำหรับ mock mode)

```ts
{
  id: "menu-products",
  code: "PRODUCTS",
  name: "สินค้า",
  icon: "Package",
  path: "/operations/products",
  parentId: "menu-operations",
  sortOrder: 4,
  status: "active",
  requiredPermissions: [PERMISSIONS.PRODUCT_VIEW],
  openInNewTab: false,
  isHidden: false,
  isGroup: false,
}
```

### 2. เมื่อต่อ Backend จริง - Backend ต้องส่ง menu list ใน login response

```json
{
  "menu": [
    { "code": "PRODUCTS", "path": "/operations/products", ... }
  ]
}
```

---

## วิธีเพิ่ม Permission

### 1. เพิ่มใน `src/constants/permissions.ts`

```ts
export const PERMISSIONS = {
  // ...existing
  PRODUCT_VIEW: "product.view",
  PRODUCT_CREATE: "product.create",
  PRODUCT_UPDATE: "product.update",
  PRODUCT_DELETE: "product.delete",
} as const;
```

### 2. เพิ่มใน `PERMISSION_GROUPS` (เพื่อแสดงใน Role Permission Matrix)

```ts
{
  module: "product",
  label: "สินค้า",
  permissions: [
    { key: "view", code: PERMISSIONS.PRODUCT_VIEW, label: "ดู" },
    { key: "create", code: PERMISSIONS.PRODUCT_CREATE, label: "สร้าง" },
    // ...
  ],
}
```

### 3. ใช้ใน Component

```tsx
<PermissionGuard permission={PERMISSIONS.PRODUCT_CREATE}>
  <Button>เพิ่มสินค้า</Button>
</PermissionGuard>
```

หรือใน hook:

```ts
const { hasPermission } = usePermission();
if (hasPermission(PERMISSIONS.PRODUCT_UPDATE)) { ... }
```

---

## วิธีเรียก API

### 1. ใช้ API Client โดยตรง

```ts
import { apiClient } from "@/services/api-client";

const response = await apiClient.get<User>("/users/123");
const created = await apiClient.post<User>("/users", { ...data });
```

### 2. ใช้ผ่าน Feature API (แนะนำ)

```ts
// src/features/users/api/users-api.ts
export const usersApi = {
  list: (params) => apiClient.get("/users", { params }),
  // ...
};

// usage
import { usersApi } from "@/features/users/api/users-api";
const data = await usersApi.list({ page: 1 });
```

### 3. ใช้ผ่าน React Query Hook (แนะนำที่สุด)

```ts
import { useUsers } from "@/features/users/hooks/use-users";
const { data, isLoading, error } = useUsers({ page: 1, pageSize: 10 });
```

### 4. Mutations

```ts
const create = useCreateUser();
await create.mutateAsync({ ...data });
```

---

## วิธีสร้าง Form

### 1. ใช้ React Hook Form + Zod

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
});

type FormValues = z.infer<typeof schema>;

export function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "" },
  });

  const onSubmit = (data: FormValues) => {
    // ...
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <TextField
        label="ชื่อ"
        required
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <Button type="submit">บันทึก</Button>
    </form>
  );
}
```

### 2. ใช้ FormField components

- `TextField` - Input ทั่วไป
- `TextAreaField` - Textarea
- `SelectField` - Select
- `CheckboxField` - Checkbox พร้อม label
- `RadioField` - Radio group
- `SwitchField` - Toggle switch
- `DatePicker` / `DateRangePicker` - Date picker

ดู source: `src/components/forms/form-field.tsx`

---

## วิธีสร้าง Data Table

### 1. Define Columns

```ts
import type { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<User>[] = [
  {
    id: "name",
    header: "ชื่อ",
    cell: ({ row }) => <span>{row.original.fullName}</span>,
  },
  {
    id: "email",
    accessorKey: "email",
    header: "อีเมล",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionMenu
        items={[
          { label: "แก้ไข", icon: <Pencil />, onClick: () => {} },
          { label: "ลบ", icon: <Trash />, variant: "danger", onClick: () => {} },
        ]}
      />
    ),
  },
];
```

### 2. Use DataTable Component

```tsx
<DataTable
  columns={columns}
  data={data?.items ?? []}
  isLoading={isLoading}
  totalItems={data?.totalItems}
  searchPlaceholder="ค้นหา..."
  enableRowSelection
  enableColumnVisibility
  pageIndex={page - 1}
  pageSize={pageSize}
  pageCount={data?.totalPages}
  onPaginationChange={({ pageIndex, pageSize }) => {
    setPage(pageIndex + 1);
    setPageSize(pageSize);
  }}
  manualPagination
  onSortingChange={setSorting}
  sorting={sorting}
/>
```

### 3. URL Filter Sync (Optional)

ใช้ `useSearchParams` + `useRouter` เพื่อ sync filter กับ URL

---

## วิธีเขียน Test

### Unit Test (Vitest)

```ts
// src/utils/format.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("formats number to THB", () => {
    expect(formatCurrency(1500)).toContain("1,500");
  });
});
```

### Component Test (Vitest + RTL)

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });
});
```

### E2E Test (Playwright)

```ts
import { test, expect } from "@playwright/test";

test("login flow", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=username]", "admin");
  await page.fill("input[name=password]", "admin");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL("/dashboard");
});
```

---

## Git Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/<name>` - Feature development
- `fix/<name>` - Bug fixes
- `hotfix/<name>` - Urgent production fixes

### Commit Convention (Conventional Commits)

```
feat: เพิ่มหน้า Product CRUD
fix: แก้ไข permission check
docs: อัพเดท README
refactor: แยก utils
test: เพิ่ม unit test
chore: อัพเดท dependencies
```

---

## Error Handling

### 1. ใช้ `try/catch` ใน mutations

```ts
const onSubmit = async (data) => {
  try {
    await create.mutateAsync(data);
    showToast.success("สำเร็จ");
  } catch (err) {
    showToast.error("ล้มเหลว", err.message);
  }
};
```

### 2. Toast Notification

```ts
import { showToast } from "@/lib/toast";

showToast.success("สำเร็จ", "รายละเอียด");
showToast.error("ผิดพลาด", "รายละเอียด");
showToast.warning("คำเตือน");
showToast.info("ข้อมูล");
```

### 3. Error Boundary

ใช้ `error.tsx` ในแต่ละ route segment เพื่อ catch errors

### 4. API Errors

`ApiClientError` มี fields:
- `status` - HTTP status code
- `code` - Business error code
- `errors` - Validation errors
- `message` - User-friendly message

---

## Performance

- ใช้ **React.memo** เมื่อ component render หนัก
- ใช้ **useMemo / useCallback** เมื่อจำเป็น (อย่าใช้ทุกที่)
- ใช้ **TanStack Query** จัดการ cache อัตโนมัติ
- **Lazy load** components หนักๆ ด้วย `dynamic import`
- **Optimistic updates** ใน mutations เมื่อเป็นไปได้

---

## Security

- **ห้ามเก็บ Secret ใน Client** ใช้ Backend API เท่านั้น
- **ใช้ HTTPS** ใน Production
- **CSRF Token** - Backend ต้อง implement
- **XSS Prevention** - Next.js escape โดย default
- **Permission check ทั้ง UI และ Backend** (อย่าพึ่ง UI guard อย่างเดียว)
- **Session Timeout** - ใช้ token expiry + refresh
- **Sensitive Data Masking** - `maskEmail`, `maskPhone` ใน `utils/format.ts`
- **Input Validation** - ใช้ Zod ทุก form
- **Environment Validation** - ตรวจสอบ env vars ตอน startup

---

## 🚀 เริ่มต้นใช้งาน

1. อ่าน [docs/architecture.md](./docs/architecture.md)
2. อ่าน [docs/design-system.md](./docs/design-system.md)
3. ดูตัวอย่างใน `src/features/users/` (เป็น feature ที่สมบูรณ์ที่สุด)
4. รัน `pnpm dev` แล้วทดลองใช้งาน

ถ้ามีคำถามเพิ่มเติม สามารถเปิด issue หรือดูใน docs/ ได้เลย
