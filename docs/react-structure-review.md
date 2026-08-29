# React Project Structure Review — `cps-app`

> รีวิวโครงสร้างโปรเจกต์ตาม React/Next.js Best Practices โดย Senior React Developer
> ตรวจสอบจาก source จริง ณ วันที่รีวิว ไม่มีการแก้ไขโค้ดในขั้นนี้

---

## 0. บริบทของโปรเจกต์ (ตรวจพบจาก source)

| หัวข้อ | ค่าที่ตรวจพบ | แหล่งอ้างอิง |
|---|---|---|
| Framework | **Next.js 16.3.1** (App Router) | `package.json`, `next.config.ts`, `src/app/` ใช้ App Router + route groups |
| UI Library | **React 19.2.8** | `package.json` |
| Language | **TypeScript** (strict + `noUncheckedIndexedAccess`) | `tsconfig.json` |
| Build / Dev | `next dev --webpack`, `next build --webpack` | `package.json` scripts |
| Styling | Tailwind CSS v4 + `tw-animate-css` + `class-variance-authority` | `package.json` + `components/ui/*` |
| Component Primitives | shadcn/ui (Radix UI) | `components/ui/*` (button, dialog, table, …) |
| State (Client) | **Zustand** (auth / sidebar / ui) | `src/stores/*` |
| State (Server) | **TanStack Query v5** | `src/lib/query-client.ts`, `src/features/**/hooks/*` |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | `features/**/schemas/*` |
| Tables | `@tanstack/react-table` | `components/tables/data-table.tsx` |
| DnD | `@dnd-kit/*` | `package.json` (ใช้ใน `sidebar.tsx`) |
| Charts | `recharts` | `package.json` |
| Date | `date-fns` (Thai locale) | `src/utils/date.ts` |
| Toast | `sonner` | `src/lib/toast.ts`, `components/ui/toaster.tsx` |
| Mock | `msw` + handlers ใน `src/mocks` | `package.json`, `src/mocks/handlers/*` |
| Tests | **Vitest 4** + **Playwright** (E2E) + **Testing Library** | `package.json`, `vitest.config.ts` |
| Path Alias | `@/*` → `./src/*` | `tsconfig.json` |
| API Mode | Next.js `rewrites()` proxy `/api/v1/*` → backend (port 3001) | `next.config.ts` |
| Mock Mode | `NEXT_PUBLIC_ENABLE_MOCK_API=true` (default) | `src/config/env.ts` |

โปรเจกต์เป็น **Admin Template** ของระบบ CPS (Production Management) — multi-department, multi-role, มี mock mode เป็นค่า default

---

## 1. Executive Summary

รวมปัญหาเด่น 5 ข้อ (เรียงตามผลกระทบ)

1. **Duplicate entry points จำนวนมากที่ "ไม่มีผู้ใช้"** — `src/infra/api/*` และ `src/lib/utils/*` เป็นชั้น re-export ทั้งหมดที่ไม่มีไฟล์อื่นในโปรเจกต์ import เข้ามาเลย (ตรวจด้วย `grep` แล้วเป็น 0 match) ขณะที่ทุกไฟล์ import ผ่าน `src/services/api-client` และ `src/utils/*` ตรงๆ
2. **Container/Presenter pattern ถูกสร้างครึ่งๆ** — มี `category-list.container.tsx` + `category-list.presenter.tsx` (และอีก 9 features) แต่ **ทุก page ใน `app/(admin)/` ไม่เคยใช้ container** กลับเขียน logic ซ้ำในไฟล์ `page.tsx` แทน
3. **Type definitions ของ feature ถูก hoist ไปอยู่ที่ root** — `src/types/` มี `auth.ts`, `department.ts`, `master-data.ts`, `role.ts`, `menu.ts`, `ticket.ts`, `user-assignment.ts` ฯลฯ ซึ่งแต่ละไฟล์ควรอยู่ใน `features/<feature>/types.ts` เพื่อรักษา feature isolation
4. **Naming/import inconsistency ระหว่าง features** — บาง feature ใช้ `apiClient` จาก `@/services/api-client` โดยตรง บาง feature มี `*-api.ts` wrapper บาง feature ใช้ `QUERY_KEYS` จาก constants บาง feature hard-code key ใน hook (`use-products.ts` เขียน `["products", params]` แทน `QUERY_KEYS.PRODUCTS.LIST(params)`)
5. **Test coverage ไม่สม่ำเสมอ** — จาก 49 `page.tsx` มี test แค่ 11 ไฟล์ (~22%) และหลาย feature ที่มี business logic ซับซ้อน (เช่น products, users, materials-receiving) ไม่มี page-level test เลย

---

## 2. ตารางปัญหา (Priority × Location × Problem × Solution)

### 🔴 P0 — ต้องแก้ก่อน (ทำให้สถาปัตยกรรมเละเทะ)

| # | ตำแหน่ง | ปัญหา | หลักฐาน | วิธีแก้ |
|---|---|---|---|---|
| P0-1 | `src/infra/api/**`, `src/infra/index.ts` | **Dead re-export layer** — มี `infra/api/client.ts`, `endpoints.ts`, `types.ts`, `index.ts` แต่ `grep "from \"@/infra/api\""` ใน `src/` → **0 match** ไม่มีไฟล์ใดใช้ และ `endpoints.*` ก็ไม่เคยถูกเรียก | grep 0 matches | ลบทั้งโฟลเดอร์ `src/infra/` ทิ้ง หรือถ้าจะเก็บไว้ ให้ migrate ทุก `from "@/services/api-client"` → `from "@/infra/api/client"` ให้เป็นทางเดียวที่ใช้ |
| P0-2 | `src/lib/utils/**` (`cn.ts`, `date.ts`, `format.ts`, `index.ts`) | **Dead re-export layer** — ทุกไฟล์ใน `lib/utils/*.ts` แค่ `export { ... } from "@/utils/..."` และ `grep "from \"@/lib/utils\""` → **0 match** | grep 0 matches | ลบทั้งโฟลเดอร์ `src/lib/utils/` ทิ้ง |
| P0-3 | `src/features/*/components/*-list.container.tsx` + `*-list.presenter.tsx` (10 features) | **Container/Presenter ถูกสร้างแต่ไม่ถูกใช้** — มีไฟล์ `category-list.container.tsx`, `materials-list.container.tsx` ฯลฯ แต่ทุก `app/(admin)/.../page.tsx` เขียน logic เองในไฟล์ page (เช่น `app/(admin)/master-data/categories/page.tsx` ที่มี 100+ บรรทัดซ้ำกับ `category-list.container.tsx`) | ดู diff ระหว่าง `categories/page.tsx` กับ `category-list.container.tsx` | **ตัดสินใจเลือกทางเดียว**: (A) Migrate pages → ใช้ container หรือ (B) ลบ container/presenter ทิ้ง (แนะนำ A) |
| P0-4 | `src/lib/server/**` (`client-only.ts`, `server-only.ts`, `validation.ts`, `index.ts`) | **Dead code ทั้งโฟลเดอร์** — `grep "@/lib/server"` → **0 match** และ `validation.ts` มี `schemas` constant ที่ไม่มี consumer และใช้ `@ts-expect-error` สำหรับ Zod v3/v4 compat | grep 0 matches | ลบทิ้ง หรือถ้าจำเป็นจริงๆ ให้ใช้ npm package `server-only` / `client-only` ที่เป็นมาตรฐานแทน |
| P0-5 | `src/lib/patterns.ts`, `src/lib/state-wrapper.tsx` | **Pattern types/component ที่ไม่มีผู้ใช้** — `patterns.ts` เป็นแค่ JSDoc + interface `BasePresenterProps` ฯลฯ และ `StateWrapper` ใน `state-wrapper.tsx` ไม่มีไฟล์ใดเรียกใช้ | grep 0 matches | ลบทิ้ง หรือถ้าจะเก็บ pattern ไว้ ให้ enforce ให้ทุก feature ใช้ |
| P0-6 | `src/features/materials-receiving/components/materials-receiving-form-dialog-old.tsx` | **ไฟล์ตกค้าง** (953 บรรทัด) — มี `-old` suffix ในชื่อ แสดงว่าเคย refactor แต่ลืมลบ | ชื่อไฟล์ | ลบทิ้งทันที (ตรวจ `git log` ก่อนลบเพื่อยืนยันว่าไม่มี import ใดๆ) |
| P0-7 | `src/features/users/hooks/use-departments.ts` | **Hook ซ้ำซ้อนผิดที่** — เป็น `useDepartments` ที่ import จาก `features/departments/api/departments-api` ทั้งที่ `features/departments/hooks/` มี hook ชื่อเดียวกันอยู่แล้ว (ตรวจด้วย `grep "use-departments"` → พบ 7 ไฟล์ที่อ้างถึง ส่วนใหญ่ใช้ของจาก `users/hooks/`) | `features/users/hooks/use-departments.ts` vs `features/departments/hooks/` (ที่ไม่มี `use-departments.ts` จริงๆ — features/departments ไม่มีโฟลเดอร์ hooks!) | ย้าย `useDepartments` ไปไว้ใน `features/departments/hooks/use-departments.ts` แล้วลบของเดิมใน `users/hooks/` |
| P0-8 | `src/types/*` (12 ไฟล์) | **Feature types ถูก hoist ไปที่ root** — `auth.ts`, `department.ts`, `master-data.ts`, `menu.ts`, `permission.ts`, `role.ts`, `session.ts`, `ticket.ts`, `user-assignment.ts`, `dashboard.ts`, `notification.ts`, `activity-log.ts`, `audit-log.ts` ล้วนเป็น type ของ feature แต่อยู่นอก `features/` ทำให้ทำลาย feature isolation และ Next.js tree-shaking ทำงานยากขึ้น | `types/` directory listing | ย้าย type ที่เป็นของ feature กลับเข้า `features/<feature>/types.ts` (เก็บ `types/common.ts` ไว้ — เป็น shared types จริงๆ) |

### 🟠 P1 — แก้หลัง P0 (ทำให้ maintainability แย่ลงเรื่อยๆ)

| # | ตำแหน่ง | ปัญหา | หลักฐาน | วิธีแก้ |
|---|---|---|---|---|
| P1-1 | `src/features/products/hooks/use-products.ts` vs `src/features/categories/hooks/use-categories.ts` | **API access pattern ไม่สม่ำเสมอ** — `use-products.ts` เรียก `apiClient.get/post/patch` inline ในทุก hook และใช้ query key แบบ `["products", params]` hard-code ขณะที่ `use-categories.ts` แยกเป็น `categoriesApi` object + ใช้ `QUERY_KEYS.CATEGORIES.LIST(params)` | อ่าน 2 ไฟล์เทียบกัน | บังคับใช้รูปแบบ `use-categories.ts` (มี `<feature>-api.ts` แยก + ใช้ `QUERY_KEYS`) ให้ทุก feature |
| P1-2 | `src/constants/permissions.ts` (380 บรรทัด) | **Permission catalog มี 2 รูปแบบปะปนกัน** — โค้ดเก่าใช้ `"user.view"` (lowercase.dot) แต่ของใหม่ใช้ `"USER_VIEW"` (UPPER.UNDERSCORE) เช่น `UNIT_VIEW`, `PRODUCTS_VIEW` ทำให้เกิด inconsistency ในการ map ไปยัง backend permission | อ่าน constants/permissions.ts | เลือก 1 รูปแบบ แล้ว migrate อีกรูปแบบให้หมด (แนะนำ UPPER.UNDERSCORE เพราะ backend ใช้) |
| P1-3 | `src/features/<feature>/components/` ไม่มี barrel export (ยกเว้น `materials/`) | **Import paths ยาวและไม่สม่ำเสมอ** — มีแค่ `materials/components/index.ts` ที่ export รวม ทำให้การเพิ่ม feature ใหม่ไม่รู้ว่าควร export ผ่านไฟล์เดียวหรือ deep import | ดูเฉพาะ materials ที่มี index.ts | เพิ่ม `<feature>/components/index.ts` ให้ทุก feature |
| P1-4 | `src/hooks/use-permission.ts` vs `src/hooks/use-debounce.ts` vs `src/utils/permission-utils.ts` vs `src/stores/auth-store.ts` (selectors) | **Permission logic กระจาย 4 ที่** — `hasPermission` มีทั้งใน `use-permission.ts`, `utils/permission-utils.ts`, `auth-store.ts` (selectors) และใน store action เอง — แต่ละที่ implement super admin check ต่างกันเล็กน้อย | grep `hasPermission\|isSuperAdmin` | รวมไว้ที่เดียว — แนะนำให้ `use-permission.ts` เป็น hook หลัก + `utils/permission-utils.ts` เก็บ pure helpers เท่านั้น (ไม่มี store access) |
| P1-5 | `src/app/(admin)/permissions/permission-department-summary.tsx` + `permission-department-summary.test.tsx` | **Component ของ feature อยู่ในโฟลเดอร์ route** — เป็น component ที่ใช้แค่กับ `permissions/page.tsx` แต่วางไว้ใน `app/` (Next.js convention คือ `app/` เป็น routing layer เท่านั้น) | path convention | ย้ายไป `src/features/permissions/components/permission-department-summary.tsx` |
| P1-6 | 18 จาก 22 features ไม่มีหน้า test เลย | **Test coverage ต่ำมากในเชิง page-level** — โดยเฉพาะ features ใหญ่อย่าง `products`, `users`, `materials-receiving`, `materials-disbursement` ที่มี business logic ซับซ้อนแต่ไม่มี page test | `Get-ChildItem page.test.tsx` → 11 จาก 49 | เพิ่ม test ให้ครอบคลุม **public contract** ของแต่ละ page (render, loading state, error state, primary action) |
| P1-7 | `src/components/ui/permission-guard.tsx` | **Feature component อยู่ใน shared layer** — ใช้ logic เฉพาะของ permissions feature แต่อยู่ใน `components/ui/` ซึ่งควรเป็น primitive ไร้ logic ทางธุรกิจ | path + dependency | ย้ายไป `src/features/permissions/components/permission-guard.tsx` แล้ว re-export ผ่าน `components/ui/index.ts` ถ้าต้องการ backward-compat |
| P1-8 | `src/types/permission.ts` (Permission, PermissionMenuRef, PermissionDepartmentRef) | **Type ของ feature อยู่นอก features/** — ควรย้ายไป `features/permissions/types.ts` | path | ย้ายตามแผน P0-8 |
| P1-9 | `src/features/categories/components/category-list.presenter.tsx` ถูกประกาศ `export interface CategoryListPresenterProps` ที่ page ไม่ได้ใช้ | **Type export ที่ไม่จำเป็น** — เป็น dead public API เพราะ page ไม่ได้ import presenter | grep `CategoryListPresenterProps` → 0 external matches | ถ้าจะเก็บ presenter ไว้ ให้ migrate page ก่อน (เชื่อมโยง P0-3) |

### 🟡 P2 — ปรับปรุงคุณภาพ (nice to have)

| # | ตำแหน่ง | ปัญหา | หลักฐาน | วิธีแก้ |
|---|---|---|---|---|
| P2-1 | `src/lib/patterns.ts` + `src/lib/state-wrapper.tsx` | JSDoc comment ที่อธิบาย pattern ยาวมากแต่ไม่มี enforce | ไฟล์ docs | แทนที่ด้วย Storybook หรือ `/docs/architecture/container-presenter.md` |
| P2-2 | `src/types/common.ts` | มี type ผสมทั้ง generic (`ApiResponse`) และ specific (`PermissionAction`, `PermissionCode`) — specific ส่วนควรย้ายไป `features/permissions/types.ts` | type definitions | แยก generic vs feature-specific |
| P2-3 | `src/components/forms/icon-picker.tsx` (ยังไม่ได้ดู) | ควรตรวจว่า logic เป็น shared หรือ feature-specific | ไฟล์ | ตรวจเพิ่มเติม |
| P2-4 | `src/hooks/use-recent-paths.ts` | Hook ที่ side-effect (record recents) แต่ไม่มี test | ไม่มี `.test.ts` | เพิ่ม unit test (logic ง่ายแต่ critical UX) |
| P2-5 | `src/components/tables/data-table.tsx` | ตรวจว่าใช้ `@tanstack/react-table` v8 API ถูกต้องและ generics ครบ | ยังไม่ได้ดู | ตรวจเพิ่มเติม |
| P2-6 | `src/app/(admin)/materials/page.test.tsx` vs `materials/hooks/use-materials.test.tsx` | Test ซ้ำซ้อนระหว่าง page-level กับ hook-level — ดีถ้า cover contract แต่ต้องดูว่า overlap มากไปไหม | 2 test files | ตรวจ coverage report |
| P2-7 | `src/app/403, 404, 500, session-expired, unauthorized, coming-soon, maintenance` | หน้า error ทั้งหมดเป็น page.tsx ตรง — ดีแล้ว แต่ควร share layout กลาง | folder structure | ใช้ `error.tsx` + `not-found.tsx` ของ Next.js แทน (App Router convention) |
| P2-8 | `src/middleware.ts` อยู่ที่ `src/middleware.ts` (Next.js รองรับ) | ตรวจว่าใช้ `middleware.ts` หรือ `proxy.ts` (Next.js 16 เปลี่ยนชื่อ) | file location | ตรวจ Next.js 16 docs |

### ⚪ P3 — สิ่งที่ดีอยู่แล้ว (เก็บไว้ ไม่ต้องแก้)

| # | ตำแหน่ง | สิ่งที่ดี |
|---|---|---|
| ✅-1 | `src/features/<x>/api/`, `components/`, `hooks/`, `schemas/` | **Feature-sliced structure** โดยรวมดีมาก — มีการแยก api/components/hooks/schemas ชัดเจน |
| ✅-2 | `src/components/ui/*` (shadcn primitives) | ใช้ pattern shadcn ตามมาตรฐาน + มี `index.ts` barrel ที่ดี |
| ✅-3 | `src/components/feedback/*`, `forms/*`, `layout/*`, `tables/*` | แยก domain ของ shared components ดี ไม่ปะปนกับ `ui/` |
| ✅-4 | `src/lib/providers.tsx` + `src/lib/query-client.ts` | Wiring ระหว่าง Zustand ↔ apiClient ↔ react-query ทำดี |
| ✅-5 | `src/stores/auth-store.ts` | Persist + partialize + selectors ครบถ้วน |
| ✅-6 | `src/stores/sidebar-store.ts` | แยกเป็น feature store แทนที่จะยัดใน ui-store |
| ✅-7 | `src/services/api-client.ts` | 401 retry + coalesced refresh + mock support ออกแบบดี |
| ✅-8 | `src/config/env.ts` + `src/config/menu-overrides.ts` | Config แยกจาก constants ชัดเจน |
| ✅-9 | `src/constants/app.ts` (QUERY_KEYS) | Centralised query keys (แต่ใช้ไม่ครบทุก feature — ดู P1-1) |
| ✅-10 | `src/utils/storage.ts` | Safe localStorage wrapper — ดี |
| ✅-11 | `src/utils/icon.ts` | Icon resolution ที่รับหลาย format — ดี |
| ✅-12 | `src/mocks/handlers/*` | แยก handler ตาม domain ดี |
| ✅-13 | `next.config.ts` rewrites | Two URL shape support + uploads proxy + headers — ดี |
| ✅-14 | `tsconfig.json` strict + `noUncheckedIndexedAccess` | TS config เข้มงวดดี |
| ✅-15 | `eslint`, `prettier` พร้อม tailwind plugin | Tooling ครบ |

---

## 3. โครงสร้าง Folder ที่เหมาะสม (เป้าหมายหลัง refactor)

### 3.1 แนวคิดหลัก

1. **Feature-Sliced Design** (รากฐาน Next.js App Router)
2. **Vertical ownership**: แต่ละ feature เป็นเจ้าของ type / hook / component / schema ของตัวเองครบ
3. **Shared layer เป็น primitive เท่านั้น** — ไม่มี business logic
4. **Single entry point** สำหรับ API (`apiClient`) และ utilities (`@/utils`)

### 3.2 โครงสร้างเป้าหมาย

```
src/
├── app/                              # Next.js App Router (routing ONLY)
│   ├── (admin)/
│   │   ├── layout.tsx                # <AdminShell>
│   │   ├── dashboard/page.tsx
│   │   ├── master-data/
│   │   │   ├── page.tsx
│   │   │   └── <sub>/page.tsx        # แต่ละหน้า render <XContainer />
│   │   ├── materials/...
│   │   ├── operations/...
│   │   ├── permissions/
│   │   │   └── page.tsx              # → import { PermissionsContainer } from "@/features/permissions"
│   │   ├── products/...
│   │   ├── reports/...
│   │   ├── sessions/page.tsx
│   │   ├── system/...
│   │   └── user-management/...
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── ...
│   ├── error.tsx                     # global error (แทน 500/page.tsx)
│   ├── not-found.tsx                 # 404 (แทน 404/page.tsx)
│   ├── global-error.tsx
│   ├── layout.tsx                    # root <Providers>
│   └── page.tsx                      # root redirect
│
├── features/                         # ⭐ Domain features (vertical slice)
│   ├── auth/
│   │   ├── api/
│   │   │   └── auth-api.ts
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   ├── select-department-form.tsx
│   │   │   └── index.ts              # barrel
│   │   ├── hooks/
│   │   │   └── use-auth.ts
│   │   ├── schemas/
│   │   │   └── auth-schema.ts
│   │   └── types.ts                  # ⭐ ย้ายจาก types/auth.ts
│   │
│   ├── users/
│   │   ├── api/users-api.ts
│   │   ├── components/
│   │   │   ├── user-list.container.tsx
│   │   │   ├── user-list.presenter.tsx
│   │   │   ├── user-form-dialog.tsx
│   │   │   ├── user-menu-access.tsx
│   │   │   └── index.ts
│   │   ├── hooks/
│   │   │   ├── use-users.ts
│   │   │   └── use-departments.ts    # ⭐ ย้ายมาจาก features/users/hooks/
│   │   ├── schemas/user-schema.ts
│   │   └── types.ts                  # ⭐ ย้ายจาก types/user-assignment.ts
│   │
│   ├── departments/                  # เจ้าของ departments ทั้งหมด
│   │   ├── api/departments-api.ts
│   │   ├── components/
│   │   │   ├── department-list.container.tsx
│   │   │   ├── department-list.presenter.tsx
│   │   │   ├── department-form-dialog.tsx
│   │   │   └── index.ts
│   │   ├── hooks/use-departments.ts  # ⭐ รวมศูนย์ที่นี่
│   │   ├── schemas/department-schema.ts
│   │   └── types.ts
│   │
│   ├── permissions/                  # ⭐ รวมศูนย์ permission logic
│   │   ├── api/permissions-api.ts
│   │   ├── components/
│   │   │   ├── permissions-page.container.tsx
│   │   │   ├── permissions-page.presenter.tsx
│   │   │   ├── permission-form-dialog.tsx
│   │   │   ├── department-permission-dialog.tsx
│   │   │   ├── permission-department-summary.tsx  # ⭐ ย้ายจาก app/
│   │   │   ├── permission-guard.tsx                # ⭐ ย้ายจาก components/ui/
│   │   │   └── index.ts
│   │   ├── hooks/use-permissions.ts
│   │   ├── schemas/permission-schema.ts
│   │   └── types.ts                  # ⭐ ย้ายจาก types/permission.ts
│   │
│   ├── products/
│   │   ├── api/products-api.ts
│   │   ├── components/...
│   │   ├── hooks/use-products.ts      # ใช้ productsApi + QUERY_KEYS
│   │   ├── utils.ts
│   │   └── types.ts
│   │
│   ├── materials/
│   │   ├── api/materials-api.ts
│   │   ├── components/
│   │   │   ├── materials-list.container.tsx        # ⭐ ใช้แล้ว
│   │   │   ├── materials-list.presenter.tsx
│   │   │   ├── material-table.tsx
│   │   │   ├── material-form-dialog.tsx
│   │   │   ├── material-form-dialog.test.tsx
│   │   │   └── index.ts
│   │   ├── hooks/use-materials.ts
│   │   ├── utils.ts
│   │   └── types.ts
│   │
│   └── ... (ทุก feature ใช้ pattern เดียวกัน)
│
├── components/                       # ⭐ Shared primitives เท่านั้น
│   ├── ui/                           # shadcn primitives (ไม่มี business logic)
│   │   ├── button.tsx, dialog.tsx, ...
│   │   └── index.ts
│   ├── forms/                        # shared form building blocks
│   │   ├── form-field.tsx
│   │   ├── form-section.tsx
│   │   ├── confirm-dialog.tsx
│   │   └── icon-picker.tsx
│   ├── tables/                       # shared table building blocks
│   │   ├── data-table.tsx
│   │   └── action-menu.tsx
│   ├── layout/                       # shared layout primitives
│   │   ├── admin-shell.tsx
│   │   ├── sidebar.tsx
│   │   ├── top-nav.tsx
│   │   ├── page-header.tsx
│   │   └── command-palette.tsx
│   └── feedback/                     # shared error/loading UI
│       ├── error-page.tsx
│       └── loading-skeleton.tsx
│
├── hooks/                            # ⭐ Shared hooks เท่านั้น (ไม่มี feature logic)
│   ├── use-debounce.ts
│   ├── use-media-query.ts
│   ├── use-is-client.ts
│   └── use-recent-paths.ts
│
├── lib/                              # App-level wiring
│   ├── providers.tsx
│   ├── query-client.ts
│   ├── theme-provider.tsx
│   └── toast.ts
│
├── services/                         # ⭐ Single API entry point
│   └── api-client.ts                 # apiClient + ApiClient + ApiClientError
│
├── stores/                           # Global Zustand stores
│   ├── auth-store.ts
│   ├── sidebar-store.ts
│   └── ui-store.ts
│
├── types/                            # ⭐ Shared types เท่านั้น (ไม่มี feature types)
│   └── common.ts                     # ApiResponse, PaginatedResponse, BaseEntity, …
│
├── utils/                            # Pure utilities
│   ├── cn.ts
│   ├── date.ts
│   ├── format.ts
│   ├── storage.ts
│   └── icon.ts
│
├── config/                           # Build-time config
│   ├── env.ts
│   └── menu-overrides.ts
│
├── constants/                        # App-wide constants
│   ├── app.ts                        # APP_NAME, QUERY_KEYS, SESSION_STORAGE_KEYS
│   └── permissions.ts                # ⚠️ รอ standardize format (P1-2)
│
├── mocks/                            # MSW handlers
│   ├── db.ts
│   ├── handlers/
│   │   ├── auth.ts, users.ts, ...
│   │   └── index.ts
│   └── index.ts
│
└── middleware.ts                     # Next.js middleware
```

### 3.3 สรุปการเปลี่ยนแปลงสำคัญ

| เลิกใช้ | ใช้แทน | เหตุผล |
|---|---|---|
| `src/infra/**` | `src/services/api-client.ts` | มีอยู่แล้วและทุกไฟล์ใช้ |
| `src/lib/utils/**` | `src/utils/**` | เหมือนกันเป๊ะ |
| `src/lib/server/**` | (ลบทิ้ง หรือใช้ npm `server-only`/`client-only`) | ไม่มีผู้ใช้ |
| `src/lib/patterns.ts`, `state-wrapper.tsx` | (ลบทิ้ง) | ไม่มีผู้ใช้ |
| `src/types/auth.ts`, `department.ts`, `master-data.ts`, `permission.ts`, `role.ts`, `menu.ts`, `session.ts`, `ticket.ts`, `user-assignment.ts`, `dashboard.ts`, `notification.ts`, `activity-log.ts`, `audit-log.ts` | `src/features/<x>/types.ts` | Feature isolation |
| `src/components/ui/permission-guard.tsx` | `src/features/permissions/components/permission-guard.tsx` (re-export ผ่าน `ui/index.ts` ได้) | ไม่ใช่ primitive |
| `src/app/(admin)/permissions/permission-department-summary.tsx` | `src/features/permissions/components/permission-department-summary.tsx` | Route folder ไม่ควรมี component |
| `src/features/users/hooks/use-departments.ts` | `src/features/departments/hooks/use-departments.ts` | Single source of truth |
| `src/features/materials-receiving/components/materials-receiving-form-dialog-old.tsx` | (ลบ) | Dead file |
| `src/app/403, 404, 500, .../page.tsx` | `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx` | Next.js convention |

---

## 4. ตัวอย่าง Before / After

### 4.1 Before / After: ลบ dead re-export layer

**Before — มี 4 ชั้นของ apiClient**
```
// src/infra/api/client.ts
export { apiClient, ApiClient, ... } from "@/services/api-client";

// src/infra/api/index.ts
export { apiClient, ApiClient } from "./client";
export type { ... } from "./types";
export { endpoints, buildEndpoint } from "./endpoints";

// src/infra/index.ts
export * from "./api";

// src/services/api-client.ts
export class ApiClient { ... }
export const apiClient = new ApiClient(...);
```
**อาการ:** มี 4 path ให้เลือก import แต่ทุกไฟล์ใช้แค่ `@/services/api-client`

**After — Single source of truth**
```ts
// src/services/api-client.ts (ไม่เปลี่ยน)
export class ApiClient { ... }
export const apiClient = new ApiClient(...);

// src/infra/ → ลบทิ้ง
// src/lib/utils/ → ลบทิ้ง
```
**ใช้งาน:**
```ts
// ทุกที่ในโปรเจกต์
import { apiClient, ApiClientError } from "@/services/api-client";
```

### 4.2 Before / After: Container/Presenter pattern

**Before — มี container แต่ page ไม่ใช้**
```tsx
// src/features/categories/components/category-list.container.tsx (200 บรรทัด)
export function CategoryListContainer({ className }) {
  // logic ทั้งหมด: state, queries, mutations, handlers
  return <CategoryListPresenter ... />;
}

// src/features/categories/components/category-list.presenter.tsx (200 บรรทัด)
export function CategoryListPresenter({ items, isLoading, onEdit, ... }) {
  return <PageContainer>...</PageContainer>;
}

// src/app/(admin)/master-data/categories/page.tsx (108 บรรทัด) ❌
"use client";
export default function CategoriesPage() {
  // COPY-PASTE ทุก logic จาก container มาไว้ที่นี่
  const [page, setPage] = React.useState(1);
  const createM = useCreateCategory();
  // ... ซ้ำ 100+ บรรทัด
  return <PageContainer>...</PageContainer>;
}
```

**After — Page render แค่ Container**
```tsx
// src/features/categories/components/category-list.container.tsx (ไม่เปลี่ยน)
export function CategoryListContainer({ className }) { ... }

// src/app/(admin)/master-data/categories/page.tsx ✅ (10 บรรทัด)
import { CategoryListContainer } from "@/features/categories";

export default function CategoriesPage() {
  return <CategoryListContainer />;
}

// src/features/categories/index.ts (barrel)
export { CategoryListContainer } from "./components/category-list.container";
```

### 4.3 Before / After: Feature types

**Before — types ใน root**
```ts
// src/types/department.ts
export interface Department extends BaseEntity {
  id: string;
  code: string;
  nameTh: string;
  // ...
}

// import path ที่กระจายอยู่:
import type { Department } from "@/types/department";
import type { Role } from "@/types/role";
import type { User } from "@/types/auth";  // auth.ts มี User แต่ไม่ใช่ feature auth
```

**After — types อยู่กับ feature**
```ts
// src/features/departments/types.ts
export interface Department extends BaseEntity { ... }

// src/features/users/types.ts
export interface User extends BaseEntity { ... }

// import path ที่สื่อความหมาย:
import type { Department } from "@/features/departments";
import type { User } from "@/features/users";
```

### 4.4 Before / After: API access pattern ใน hook

**Before — `use-products.ts` (inconsistent)**
```ts
export function useProducts(params) {
  return useQuery({
    queryKey: ["products", params],  // ❌ hard-code key
    queryFn: () => {
      const q = {};
      // ... build query inline
      return apiClient.get<PaginatedProducts>("/products", { params: q });  // ❌ inline call
    },
  });
}
```

**After — ใช้ pattern เดียวกับ `use-categories.ts`**
```ts
// src/features/products/api/products-api.ts
export const productsApi = {
  list: (p: ListProductsParams) => {
    const q = toQueryParams(p);
    return apiClient.get<PaginatedList<Product>>("/products", { params: q });
  },
  get: (id: string) => apiClient.get<Product>(`/products/${id}`),
  // ...
};

// src/features/products/hooks/use-products.ts
import { QUERY_KEYS } from "@/constants/app";
import { productsApi } from "../api/products-api";

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.LIST(params),  // ✅ ใช้ QUERY_KEYS
    queryFn: () => productsApi.list(params),     // ✅ delegate to api object
  });
}
```

### 4.5 Before / After: Permission logic กระจาย

**Before — 4 ที่ implement ต่างกัน**
```ts
// src/hooks/use-permission.ts
export const hasPermission = (permissions, required) => {
  if (permissions.includes("*") || permissions.includes("SUPER_ADMIN")) return true;
  // ...
};

// src/utils/permission-utils.ts
// (มีแค่ helper สำหรับ UI rendering — ไม่มี store access)

// src/stores/auth-store.ts (selectors)
hasPermission: (permission) => {
  if (isSuperAdminUser(state.user, state.permissions)) return true;
  // ... different impl
},
```

**After — รวมศูนย์**
```ts
// src/features/permissions/utils/permission.ts (pure helpers, no store)
export const isSuperAdmin = (user: User | null, perms: string[]): boolean => {
  return user?.isSuperAdmin === true || perms.includes("*") || perms.includes("SUPER_ADMIN");
};

export const hasPermission = (perms: string[], required: string | string[]): boolean => {
  if (isSuperAdmin(null, perms)) return true;  // ไม่รู้จัก user — caller เช็คเอง
  // ...
};

// src/hooks/use-permission.ts (the only consumer-aware hook)
"use client";
import { useAuthStore } from "@/stores/auth-store";
import { hasPermission, isSuperAdmin as isSuperAdminPure } from "@/features/permissions/utils/permission";

export function usePermission() {
  const permissions = useAuthStore((s) => s.permissions);
  const user = useAuthStore((s) => s.user);
  const superAdmin = isSuperAdminPure(user, permissions);

  return {
    permissions,
    isSuperAdmin: () => superAdmin,
    hasPermission: (req) => superAdmin || hasPermission(permissions, req),
    // ...
  };
}

// auth-store.ts (selectors ใช้ helper เดียวกัน)
hasPermission: (permission) => {
  if (isSuperAdminPure(get().user, get().permissions)) return true;
  return get().permissions.includes(permission);
},
```

---

## 5. ลำดับขั้นตอน Refactor (Roadmap)

แบ่งเป็น 5 phase เพื่อให้ ship ค่อยๆ ได้ (ไม่ block feature dev)

### Phase 1 — "Spring Cleaning" (1–2 วัน, ลดเสี่ยง regression)
> ลบ dead code อย่างเดียว ไม่มี refactor logic ใดๆ

1. ลบ `src/infra/` ทั้งหมด (P0-1)
2. ลบ `src/lib/utils/` ทั้งหมด (P0-2)
3. ลบ `src/lib/server/` ทั้งหมด (P0-4)
4. ลบ `src/lib/patterns.ts` + `src/lib/state-wrapper.tsx` (P0-5)
5. ลบ `src/features/materials-receiving/components/materials-receiving-form-dialog-old.tsx` (P0-6)
6. รัน `pnpm type-check` + `pnpm test` ตรวจว่าไม่ break

> **Risk:** ต่ำมาก เพราะไม่มี consumer (verified ด้วย grep แล้ว)

### Phase 2 — "Single Source of Truth" (2–3 วัน)
> รวม type + hook ที่กระจายอยู่

1. ย้าย `src/types/*` (ยกเว้น `common.ts`) → `src/features/<x>/types.ts` (P0-8)
2. ย้าย `src/features/users/hooks/use-departments.ts` → `src/features/departments/hooks/use-departments.ts` แล้วลบของเดิม (P0-7)
3. ย้าย `src/components/ui/permission-guard.tsx` → `src/features/permissions/components/permission-guard.tsx` (P1-7) — re-export ผ่าน `components/ui/index.ts` ไว้ก่อน
4. ย้าย `src/app/(admin)/permissions/permission-department-summary.tsx` → `src/features/permissions/components/` (P1-5)
5. รัน test

> **Risk:** ปานกลาง — ต้อง update import paths ทั่วโปรเจกต์ ใช้ codemod หรือ IDE refactor

### Phase 3 — "Container Adoption" (3–5 วัน)
> บังคับใช้ Container/Presenter pattern ที่มีอยู่แล้ว

1. เริ่มจาก 1 feature ที่ง่ายที่สุด (แนะนำ `categories` หรือ `units`)
2. Refactor `app/(admin)/master-data/<x>/page.tsx` → render แค่ `<XContainer />`
3. ลบ logic ซ้ำออกจาก page
4. ทำต่อกับทุก feature ที่มี container อยู่ (10 features)
5. รัน test ทุกครั้ง

> **Risk:** ปานกลาง — แต่ละ feature มี business logic เฉพาะ ต้อง test

### Phase 4 — "API Pattern Consistency" (3–4 วัน)
> ทำให้ทุก feature ใช้ `<feature>-api.ts` + `QUERY_KEYS` เหมือนกัน

1. เริ่มจาก feature ใหญ่ (products, materials-receiving, materials-disbursement)
2. แยก `<feature>-api.ts` ออกมา (ถ้ายังไม่มี)
3. แก้ hook ให้ delegate ทุก `apiClient.get/post/...` → `<feature>Api.list/get/...`
4. เปลี่ยน query key hard-code → `QUERY_KEYS.<X>.<Y>()`
5. เพิ่ม `<feature>/components/index.ts` barrel ทุก feature (P1-3)

> **Risk:** ต่ำ–ปานกลาง

### Phase 5 — "Test Coverage & Quality" (ongoing)
> เพิ่ม test, รวม permission logic, standardize permission format

1. เพิ่ม page test ให้ครอบคลุมทุก page (P1-6)
2. รวม permission logic (P1-4) — ทำ pure helpers ใน `features/permissions/utils/`
3. Standardize permission code format (P1-2) — เลือก UPPER.UNDERSCORE แล้ว migrate lowercase.dot
4. เพิ่ม unit test สำหรับ global hooks (P2-4)

---

## 6. สิ่งที่ทำได้ดีและควรรักษาไว้ (What to keep)

1. **Feature-sliced structure โดยรวม** — แยก `api/components/hooks/schemas` ชัดเจน เป็นแนวปฏิบัติที่ดี
2. **shadcn/ui + Radix** เป็น primitive layer — แยก domain ออกจาก shared ดี
3. **Zustand stores แยกตาม concern** (`auth-store`, `sidebar-store`, `ui-store`) — ไม่ใช้ store เดียวใหญ่ๆ
4. **`apiClient` มี 401 retry + coalesced refresh** — ออกแบบดี
5. **`QUERY_KEYS` centralized** — มี concept ที่ดี แค่ใช้ไม่ครบ
6. **Zod schemas ต่อ feature** — validation แยกตาม feature
7. **`config/env.ts` ตรวจ env ตอน startup** — fail-fast ดี
8. **MSW handlers แยกตาม domain** — test/mock ได้สะอาด
9. **TypeScript strict + `noUncheckedIndexedAccess`** — เข้มงวดดี
10. **Tooling ครบ** (eslint, prettier, vitest, playwright, msw)
11. **`next.config.ts` rewrites + headers** — proxy /api + uploads + security headers ครบ
12. **Page-level tests 11 ไฟล์** — ถือว่ามี culture ของ test แล้ว แค่ต้องเพิ่มให้ครบ
13. **`mocks/handlers/*` + `mocks/db.ts`** — mock data layer แยกจาก handler ดี
14. **Container/Presenter pattern ถูกคิดมาแล้ว** — แค่ยัง adopt ไม่ครบ (แก้ด้วย Phase 3)
15. **JSDoc comments ที่ดี** หลายไฟล์ (เช่น `auth-store.ts` อธิบาย flow ชัดมาก) — รักษาไว้

---

## 7. สิ่งที่ต้องตรวจสอบเพิ่มเติม (Open questions)

จุดที่ผมไม่สามารถตัดสินได้จาก source อย่างเดียว ต้องการ input จากทีม:

| # | คำถาม | ทำไมสำคัญ |
|---|---|---|
| Q1 | **Container/Presenter pattern** — เจตนาเดิมคือให้ทุก feature ใช้ หรือเป็น opt-in เฉพาะบาง feature? | ถ้า opt-in → ลบ container ที่ไม่ใช้ออก, ถ้า enforce → migrate page ทั้งหมด (P0-3) |
| Q2 | **`infra/api`** — เคยวางแผนจะใช้ แต่ยังไม่ได้ migrate หรือเลิกใช้แล้ว? | มี comment "Following Vercel Best Practices" แต่ไม่มี consumer — ต้องการยืนยันเจตนา |
| Q3 | **`infra/api/endpoints.ts`** — มี centralised endpoint registry แต่ไม่มี consumer → ควร enforce ให้ทุก feature ใช้ หรือลบทิ้ง? | ถ้า enforce → ต้องแก้ 30+ ไฟล์ใน `features/*/api/*` เปลี่ยน path string เป็น `endpoints.x.y` |
| Q4 | **Permission format เก่า/ใหม่** — `user.view` vs `USER_VIEW` จะเก็บไว้ทั้งสองแบบเพื่อ compat หรือ migrate ให้เหลือแบบเดียว? | มีผลกับ backend และ permission seed data (P1-2) |
| Q5 | **`server-only` / `client-only` package** — มี `lib/server/server-only.ts` เป็น home-made implementation จะเปลี่ยนเป็น npm package มาตรฐานไหม? | ถ้าไม่ใช้จริง → ลบทิ้ง (P0-4) |
| Q6 | **Test framework สำหรับ page tests** — ปัจจุบันใช้ Vitest + Testing Library แต่ Next.js App Router มีข้อจำกัด ต้องการเปลี่ยนไปใช้ Playwright component test ไหม? | มีผลกับ test architecture |
| Q7 | **Page-level tests 11/49** — เป้าหมาย coverage เท่าไหร่? | ต้องรู้เพื่อจัด priority (P1-6) |
| Q8 | **Pre-commit hooks / Husky** — มีไหม? | ถ้าไม่มี แนะนำเพิ่มเพื่อ enforce lint/format |
| Q9 | **CI/CD** — มี pipeline ที่รัน lint + type-check + test ไหม? | มีผลกับความเสี่ยงในการ ship |
| Q10 | **`material-form-modal.tsx` vs `material-form-dialog.tsx`** — เป็นไฟล์คนละชุดกันหรือ duplicate? | ยังไม่ได้อ่านละเอียด — ตรวจเพิ่ม |

---

## 8. สรุปสั้น (TL;DR)

โปรเจกต์ **cps-app** เป็น Next.js 16 + React 19 + TypeScript admin template ที่มีโครงสร้าง feature-sliced ดีในระดับ macro แต่มี **dead code และ duplication ระดับ P0** อยู่พอสมควร (โดยเฉพาะ `infra/`, `lib/utils/`, `lib/server/`, `lib/patterns.ts`, `lib/state-wrapper.tsx`, `*-form-dialog-old.tsx`)

ปัญหาเชิง architecture ที่สำคัญที่สุดคือ **Container/Presenter pattern ถูกสร้างครึ่งๆ** (10 features มี container แต่ 0 page ใช้) และ **Feature types ถูก hoist ไปอยู่ที่ `src/types/`**

แนะนำเริ่มจาก **Phase 1: Spring Cleaning** (1–2 วัน, low risk) → **Phase 2: Single Source of Truth** (2–3 วัน) → **Phase 3: Container Adoption** (3–5 วัน) แล้วค่อยทำ Phase 4–5 ต่อ

สิ่งที่ดีอยู่แล้วให้รักษาไว้: shadcn primitives, feature-sliced structure, Zustand stores, apiClient design, MSW handlers, tooling, TS config

---

*จัดทำโดย Mavis (Senior React Developer review) — ไม่มีการแก้ไข source code ในขั้นนี้ ตามข้อจำกัดที่ระบุ*
