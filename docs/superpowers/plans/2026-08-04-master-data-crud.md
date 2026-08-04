# Master Data CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver permission-aware CRUD for all remaining Master Data modules across Backend and Frontend, following the same pattern proven by Material CRUD.

**Architecture:** `D:\project-cps\cps-api` adds one NestJS module per master (5 in Phase 1, 3 in Phase 2). `C:\Users\USER\Desktop\minimax` mirrors each with a feature-scoped React Query client + UI. Backend remains the permission authority.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL 14+, Jest 30, Next.js 16, React 19, TanStack Query 5, React Hook Form 7, Zod 4, Vitest 4

## Global Constraints

- Master Data is company-wide and has no departmentId.
- Required fields are `code` (Phase 1) or `code` + `name` (Phase 2 — to be aligned) and `nameTh` (Phase 1).
- `code` is unique per master (case-sensitive unique constraint).
- Delete means `is_active=false`, preserves relationships, supports restore.
- Every command runs in a database transaction.
- Permission codes follow `<MODULE>_<ACTION>` pattern and use the active Assignment.
- Soft delete uses `is_active` (Phase 1) or `status: active/inactive` (Phase 2) — **Phase 2 must align to `is_active` for consistency**.
- Preserve unrelated frontend untracked files.

## Pattern Reference

> Each task follows the same skeleton as the proven Material CRUD. Where the file list below shows `<master>`, substitute one of:
> **Phase 1**: `unit`, `supplier`, `material-model`, `delivery-type`, `loading-point`
> **Phase 2**: `category`, `status-item`, `organization`

| Concern | Reference |
|---|---|
| Permission constants shape | `cps-api/src/modules/materials/material-permissions.ts` |
| DTO + transform | `cps-api/src/modules/materials/dto/create-material.dto.ts` |
| Service with read + write | `cps-api/src/modules/materials/materials.service.ts` |
| Controller with guards | `cps-api/src/modules/materials/materials.controller.ts` |
| Module wiring | `cps-api/src/modules/materials/materials.module.ts` |
| Frontend API client | `minimax/src/features/materials/api/materials-api.ts` |
| Frontend hooks | `minimax/src/features/materials/hooks/use-materials.ts` |
| Form dialog | `minimax/src/features/materials/components/material-form-dialog.tsx` |
| List page wiring | `minimax/src/app/(admin)/materials/page.tsx` |

---

# Phase 1 — Master ที่มี entity แล้ว (5 modules)

## Task 1: Unit CRUD (Backend) — ใช้เป็น template

**Files:**
- Create: `D:\project-cps\cps-api\src\modules\units\unit-permissions.ts`
- Test: `D:\project-cps\cps-api\src\modules\units\unit-permissions.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\units\dto\create-unit.dto.ts`
- Create: `D:\project-cps\cps-api\src\modules\units\dto\update-unit.dto.ts`
- Create: `D:\project-cps\cps-api\src\modules\units\dto\list-units-query.dto.ts`
- Test: `D:\project-cps\cps-api\src\modules\units\dto\unit.dto.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\units\units.service.ts`
- Test: `D:\project-cps\cps-api\src\modules\units\units.service.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\units\units.controller.ts`
- Test: `D:\project-cps\cps-api\src\modules\units\units.controller.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\units\units.module.ts`
- Modify: `D:\project-cps\cps-api\src\app.module.ts`
- Modify: `D:\project-cps\cps-api\src\database\seeds\seed.ts`

**Interfaces:** Produces UNIT_PERMISSIONS, Create/Update/List DTOs, `findAll`/`findOne`/`create`/`update`/`deactivate`/`restore`.

- [ ] **Step 1: Write failing permission + DTO tests**

```ts
expect(UNIT_PERMISSIONS).toEqual({
  VIEW: 'UNIT_VIEW', CREATE: 'UNIT_CREATE',
  UPDATE: 'UNIT_UPDATE', DELETE: 'UNIT_DELETE',
});
const errors = await validateDto(CreateUnitDto, {
  code: ' PCS ', nameTh: ' ชิ้น ',
});
expect(errors).toHaveLength(0);
expect(dto.code).toBe('PCS');
expect(dto.nameTh).toBe('ชิ้น');
```

- [ ] **Step 2: Write failing read-service tests** for code/name search, pagination metadata, inactive rows, NotFound, uppercase normalize, audit IDs.

- [ ] **Step 3: Write failing aggregate tests** for active FK validation, duplicate code conflict, audit IDs, rollback, soft delete preserves row, restore, stale updatedAt.

- [ ] **Step 4: Write controller metadata tests** proving JwtAuthGuard, ActiveAssignmentGuard, PermissionGuard active and each route requires its matching UNIT_* permission.

- [ ] **Step 5: Verify all suites fail**

```powershell
Set-Location D:\project-cps\cps-api
pnpm.cmd test modules/units --runInBand
```

- [ ] **Step 6: Implement permissions, DTOs, service, controller, module**

Map UNIT_VIEW→READ. Attach all four to a new menu `MASTER_DATA` at `/master-data/units` (or extend existing MASTER_DATA menu). Use `code` as a case-sensitive unique; normalize to uppercase.

- [ ] **Step 7: Register Unit entity in app.module.ts and pass tests**

```powershell
pnpm.cmd test modules/units --runInBand
pnpm.cmd run build
git add src/modules/units src/app.module.ts src/database/seeds/seed.ts
git commit -m "feat: add unit CRUD"
```

## Task 2: Supplier CRUD (Backend)

**Files:** Same shape as Task 1 under `src/modules/suppliers/`

**Interfaces:** Produces SUPPLIER_PERMISSIONS, `findAll`/`findOne`/`create`/`update`/`deactivate`/`restore`. Supplier has more optional fields: `taxId`, `contactName`, `telephone`, `email`, `address`.

- [ ] Repeat Task 1's pattern. Use SUPPLIER_* permission codes. Menu: `/master-data/suppliers`.
- [ ] **Step 1: Tests** for DTO (email format optional validation, all optional fields become `null` if empty), service (read + write + duplicate code + restore), controller metadata.
- [ ] **Step 2: Implement and verify**

```powershell
pnpm.cmd test modules/suppliers --runInBand
pnpm.cmd run build
git add src/modules/suppliers src/app.module.ts src/database/seeds/seed.ts
git commit -m "feat: add supplier CRUD"
```

> ⚠️ **Note**: Supplier has FK from `master.supplier_materials` → soft delete must check no active materials reference it, or return a friendly error.

## Task 3: MaterialModel CRUD (Backend)

**Files:** Same shape as Task 1 under `src/modules/material-models/`

**Interfaces:** Produces MATERIAL_MODEL_PERMISSIONS, `findAll`/`findOne`/`create`/`update`/`deactivate`/`restore`. Fields: `code`, `nameTh`, `nameEn`, `description`.

- [ ] Repeat Task 1's pattern. Use `MATERIAL_MODEL_*` permission codes (snake-case since "Material Model" is two words). Menu: `/master-data/material-models`.
- [ ] **Step 1: Tests** + **Step 2: Implement and verify** + **Step 3: Commit**

```powershell
pnpm.cmd test modules/material-models --runInBand
git add src/modules/material-models src/app.module.ts src/database/seeds/seed.ts
git commit -m "feat: add material model CRUD"
```

## Task 4: DeliveryType CRUD (Backend)

**Files:** Same shape as Task 1 under `src/modules/delivery-types/`

**Interfaces:** Produces DELIVERY_TYPE_PERMISSIONS, same endpoints. Menu: `/master-data/delivery-types`.

- [ ] Repeat Task 1's pattern. Use `DELIVERY_TYPE_*` permission codes.
- [ ] Tests + implement + verify + commit

```powershell
pnpm.cmd test modules/delivery-types --runInBand
git add src/modules/delivery-types src/app.module.ts src/database/seeds/seed.ts
git commit -m "feat: add delivery type CRUD"
```

## Task 5: LoadingPoint CRUD (Backend)

**Files:** Same shape as Task 1 under `src/modules/loading-points/`

**Interfaces:** Produces LOADING_POINT_PERMISSIONS, same endpoints. Menu: `/master-data/loading-points`.

- [ ] Repeat Task 1's pattern. Use `LOADING_POINT_*` permission codes.
- [ ] Tests + implement + verify + commit

```powershell
pnpm.cmd test modules/loading-points --runInBand
git add src/modules/loading-points src/app.module.ts src/database/seeds/seed.ts
git commit -m "feat: add loading point CRUD"
```

## Task 6: Unit CRUD (Frontend) — ใช้เป็น template

**Files:**
- Create: `src/features/units/api/units-api.ts`
- Test: `src/features/units/api/units-api.test.ts`
- Create: `src/features/units/hooks/use-units.ts`
- Test: `src/features/units/hooks/use-units.test.tsx`
- Create: `src/features/units/schemas/unit-schema.ts`
- Test: `src/features/units/schemas/unit-schema.test.ts`
- Create: `src/features/units/components/unit-form-dialog.tsx`
- Test: `src/features/units/components/unit-form-dialog.test.tsx`
- Create: `src/features/units/components/unit-table.tsx`
- Create: `src/features/units/components/unit-filters.tsx`
- Create: `src/features/units/components/unit-status-dialog.tsx`
- Test: `src/features/units/components/unit-list.test.tsx`
- Modify: `src/constants/app.ts` (add `UNITS` to QUERY_KEYS)
- Modify: `src/constants/permissions.ts` (add UNIT_* to PERMISSIONS + PERMISSION_GROUPS)
- Create: `src/app/(admin)/master-data/units/page.tsx`
- Test: `src/app/(admin)/master-data/units/page.test.tsx`

- [ ] **Step 1: Write API client + hook + schema tests** (failing)

- [ ] **Step 2: Implement API client + hooks + schema + tests pass**

```powershell
pnpm.cmd test src/features/units
git add src/features/units src/constants/app.ts src/constants/permissions.ts
git commit -m "feat: connect unit API"
```

- [ ] **Step 3: Write form + list component tests** (failing)

- [ ] **Step 4: Implement form + list components + tests pass**

```powershell
pnpm.cmd test src/features/units/components
git add src/features/units/components
git commit -m "feat: build unit CRUD components"
```

- [ ] **Step 5: Wire page + permission guards + page test**

```powershell
pnpm.cmd test "src/app/(admin)/master-data/units"
git add "src/app/(admin)/master-data/units" "src/constants/permissions.ts"
git commit -m "feat: deliver unit CRUD page"
```

## Task 7: Supplier CRUD (Frontend)

**Files:** Same shape as Task 6 under `src/features/suppliers/` and `src/app/(admin)/master-data/suppliers/`

- [ ] **Step 1: API + hooks + schema** — supplier มี field เพิ่ม: taxId, contactName, telephone, email, address
- [ ] **Step 2: Form + list + table + filters + status dialog** — form มี tab/section "ข้อมูลติดต่อ" แยก
- [ ] **Step 3: Page + permission guards + page test**

```powershell
pnpm.cmd test src/features/suppliers "src/app/(admin)/master-data/suppliers"
git add src/features/suppliers "src/app/(admin)/master-data/suppliers" src/constants
git commit -m "feat: deliver supplier CRUD"
```

## Task 8: MaterialModel CRUD (Frontend)

**Files:** Same shape as Task 6 under `src/features/material-models/` and `src/app/(admin)/master-data/material-models/`

- [ ] API + hooks + schema + components + page + test → commit

```powershell
git commit -m "feat: deliver material model CRUD"
```

## Task 9: DeliveryType CRUD (Frontend)

**Files:** Same shape as Task 6 under `src/features/delivery-types/` and `src/app/(admin)/master-data/delivery-types/`

- [ ] API + hooks + schema + components + page + test → commit

```powershell
git commit -m "feat: deliver delivery type CRUD"
```

## Task 10: LoadingPoint CRUD (Frontend)

**Files:** Same shape as Task 6 under `src/features/loading-points/` and `src/app/(admin)/master-data/loading-points/`

- [ ] API + hooks + schema + components + page + test → commit

```powershell
git commit -m "feat: deliver loading point CRUD"
```

## Task 11: Material lookup wiring + E2E + smoke tests (Phase 1)

**Files:**
- Modify: `src/features/materials/hooks/use-materials.ts` (already has `useMaterialLookups` — verify it works against new endpoints)
- Modify: `src/features/materials/components/material-form-dialog.tsx` (verify lookup dropdown sources)
- Create: `tests/e2e/units.spec.ts`
- Create: `scripts/smoke-units.cjs`
- Create: `scripts/smoke-suppliers.cjs`
- Create: `scripts/smoke-material-models.cjs`
- Create: `scripts/smoke-delivery-types.cjs`
- Create: `scripts/smoke-loading-points.cjs`

- [ ] **Step 1: Verify Material lookups pull from new CRUD endpoints** (units, suppliers, models, deliveryTypes, loadingPoints)

- [ ] **Step 2: Write E2E for units** — login → /master-data/units → create → edit → deactivate → restore

- [ ] **Step 3: Write smoke tests** for all 5 master — pattern from `scripts/smoke-departments.cjs`

- [ ] **Step 4: Run full verification**

```powershell
# Backend
Set-Location D:\project-cps\cps-api
pnpm.cmd test --runInBand
pnpm.cmd run build
pnpm.cmd exec eslint "src/modules/units/**/*.ts" "src/modules/suppliers/**/*.ts" "src/modules/material-models/**/*.ts" "src/modules/delivery-types/**/*.ts" "src/modules/loading-points/**/*.ts"

# Frontend
Set-Location C:\Users\USER\Desktop\minimax
pnpm.cmd test
pnpm.cmd run type-check
pnpm.cmd run lint
pnpm.cmd run build
pnpm.cmd run test:e2e -- units.spec.ts
node scripts/smoke-units.cjs
node scripts/smoke-suppliers.cjs
node scripts/smoke-material-models.cjs
node scripts/smoke-delivery-types.cjs
node scripts/smoke-loading-points.cjs

# Commit
git -C D:\project-cps\cps-api add -A
git -C D:\project-cps\cps-api commit -m "feat: complete master data CRUD phase 1"
git -C C:\Users\USER\Desktop\minimax add -A
git -C C:\Users\USER\Desktop\minimax commit -m "feat: complete master data CRUD phase 1"
```

---

# Phase 2 — Master ที่ต้องสร้าง entity + migration (3 modules)

> ⚠️ Phase 2 ต้องเริ่มด้วย **schema alignment decision** — แนะนำให้ Phase 2 ใช้ pattern เดียวกับ Phase 1 (เพิ่ม `nameTh/nameEn` แทน `name`, ใช้ `is_active` แทน `status`) เพื่อความ consistent

## Task 12: Backend migration + entities สำหรับ Phase 2

**Files:**
- Create: `D:\project-cps\cps-api\src\database\migrations\1700000000007-CreateAdditionalMasterTables.ts`
- Test: `D:\project-cps\cps-api\src\database\migrations\1700000000007-CreateAdditionalMasterTables.spec.ts`
- Create: `D:\project-cps\cps-api\src\entities\master\category.entity.ts`
- Create: `D:\project-cps\cps-api\src\entities\master\status-item.entity.ts`
- Create: `D:\project-cps\cps-api\src\entities\master\organization.entity.ts`

- [ ] **Step 1: Write migration tests** for table creation, FKs, indexes

- [ ] **Step 2: Implement migration** — tables: `master.categories`, `master.status_items`, `master.organizations` (พร้อม `parent_id` self-FK สำหรับ category และ organization)

- [ ] **Step 3: Implement entities** with relations

- [ ] **Step 4: Register entities in app.module.ts and verify**

```powershell
pnpm.cmd test database/migrations/1700000000007-CreateAdditionalMasterTables.spec.ts --runInBand
pnpm.cmd run build
git add src/database/migrations/1700000000007-CreateAdditionalMasterTables.ts src/database/migrations/1700000000007-CreateAdditionalMasterTables.spec.ts src/entities/master
git commit -m "feat: add category/status/organization entities"
```

## Task 13: Category CRUD (Backend + Frontend)

**Files:** Same shape as Task 1 + Task 6 under `src/modules/categories/` และ `src/features/categories/` และ `src/app/(admin)/master-data/categories/page.tsx`

> หน้า `master-data/categories/page.tsx` ที่มี stub → **replace** ด้วย implementation จริง

- [ ] **Step 1: Backend** — permission (CATEGORY_*), DTOs, service, controller, module, tests, seed
- [ ] **Step 2: Frontend** — types (อัพเดท `src/types/master-data.ts` ให้ใช้ `nameTh/nameEn/isActive`), API, hooks, schema, components, page, tests
- [ ] **Step 3: Verify + commit**

```powershell
git commit -m "feat: deliver category CRUD"
```

## Task 14: StatusItem CRUD (Backend + Frontend)

**Files:** Same shape as Task 13 under `src/modules/status-items/` และ `src/features/status-items/` และ `src/app/(admin)/master-data/statuses/page.tsx`

> หน้า `master-data/statuses/page.tsx` ที่มี stub → **replace** ด้วย implementation จริง

> ⚠️ StatusItem มี field พิเศษ: `color` (string), `module` (string), `isDefault` (boolean) — เพิ่มใน form และ DTO

- [ ] Backend + Frontend + page rewrite + verify + commit

```powershell
git commit -m "feat: deliver status item CRUD"
```

## Task 15: Organization CRUD (Backend + Frontend)

**Files:** Same shape as Task 13 under `src/modules/organizations/` และ `src/features/organizations/` และ `src/app/(admin)/master-data/organizations/page.tsx`

> หน้า `master-data/organizations/page.tsx` ที่มี stub → **replace** ด้วย implementation จริง

> ⚠️ Organization มี field พิเศษ: `taxId`, `address`, `phone`, `email`, `website`, `logoUrl`, `type` (enum: headquarters/branch/subsidiary/department), `parentId` (self-FK)

- [ ] Backend + Frontend + page rewrite + verify + commit

```powershell
git commit -m "feat: deliver organization CRUD"
```

## Task 16: Master Data page refactor + Phase 2 tests

**Files:**
- Modify: `src/app/(admin)/master-data/page.tsx` (ลบ stub logic, route ไปยัง slug ที่ถูกต้อง)
- Delete (or keep as redirect): `src/app/(admin)/master-data/categories/page.tsx`, `organizations/page.tsx`, `statuses/page.tsx` stubs
- Create: `tests/e2e/categories.spec.ts`, `statuses.spec.ts`, `organizations.spec.ts`
- Create: `scripts/smoke-categories.cjs`, `smoke-statuses.cjs`, `smoke-organizations.cjs`
- Modify: `src/constants/permissions.ts` (add CATEGORY_*, STATUS_*, ORGANIZATION_*)

- [ ] **Step 1: Refactor master-data index page** — ให้แสดง nav card ไปยังแต่ละ master (categories, organizations, statuses, units, suppliers, models, deliveryTypes, loadingPoints) แทนการรับ slug

- [ ] **Step 2: E2E tests** สำหรับ categories/statuses/organizations (pattern เดียวกับ units)

- [ ] **Step 3: Smoke tests** สำหรับทั้ง 3 master

- [ ] **Step 4: Final verification**

```powershell
pnpm.cmd test
pnpm.cmd run type-check
pnpm.cmd run lint
pnpm.cmd run build
pnpm.cmd run test:e2e
```

---

## Completion Criteria (รวม Phase 1 + Phase 2)

- [ ] Backend มี CRUD module ครบ 8 master (5 + 3)
- [ ] Backend unit/integration tests ผ่าน 100%
- [ ] Backend build + lint ผ่าน
- [ ] Frontend มี types/API/hooks/components/page ครบ 8 master
- [ ] Frontend tests ผ่าน 100%
- [ ] Frontend type-check + lint + build ผ่าน
- [ ] Material CRUD ยังคงทำงาน + lookup ดึงจาก API จริง
- [ ] E2E tests ผ่านสำหรับอย่างน้อย 2 master (Unit, Category)
- [ ] Smoke tests ผ่านสำหรับทุก master
- [ ] Permission guards ทำงานครบทุก action (view/create/update/delete)
- [ ] หน้า `master-data/page.tsx` แสดง navigation cards ครบทุก master
- [ ] Stub pages (categories/organizations/statuses) ถูกแทนที่ด้วย implementation จริง

## Dependencies & Risks

| Risk | Mitigation |
|---|---|
| Supplier มี FK จาก `supplier_materials` → soft delete ต้อง guard | เช็คจำนวน active supplier_materials ก่อน soft delete และ return 409 พร้อม message ที่เข้าใจง่าย |
| Phase 2 schema ต้อง align กับ Phase 1 (`nameTh/nameEn` + `is_active`) | ตัดสินใจก่อนเริ่ม Task 12 — เปลี่ยน frontend `src/types/master-data.ts` ให้ตรงกัน |
| 8 modules = ~50-80 commits | ใช้ git commit message ที่ consistent + push ทุก Phase ไม่ใช้ branch ใหญ่ |
| Material lookup เปลี่ยน endpoint → Material form อาจ break | เช็ค use-materials.ts ว่า `useMaterialLookups` ดึงจาก `/materials/lookups` (มีอยู่แล้ว) ไม่ใช่แยก endpoint |
| Test coverage ต้องสูง | แต่ละ task มี test step — ห้ามข้าม |
| Backend migration conflict | ตรวจ migrations folder ก่อนเขียน 1700000000007 |
