# Material CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver permission-aware CRUD for the company-wide Material Master, including suppliers, images, server-side querying, soft delete/restore, and production frontend screens.

**Architecture:** `D:\project-cps\cps-api` owns a dedicated NestJS MaterialsModule whose service treats Material and SupplierMaterial as one transactional aggregate. `C:\Users\USER\Desktop\minimax` owns a feature-scoped React Query client and UI; Backend remains the permission authority for the active Assignment.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL 14+, Jest 30, Next.js 16, React 19, TanStack Query 5, React Hook Form 7, Zod 4, Vitest 4

## Global Constraints

- Material is company-wide and has no departmentId.
- Required fields are code, name, and unitId.
- Store one image path/URL; never store binary or Base64 in PostgreSQL.
- Suppliers come from active Supplier Master rows and synchronize through master.supplier_materials.
- Delete means isActive=false, preserves relationships, and supports restore.
- Material and SupplierMaterial changes use one database transaction.
- Permission codes are exactly MATERIAL_VIEW, MATERIAL_CREATE, MATERIAL_UPDATE, and MATERIAL_DELETE and use the active Assignment.
- Stock, lots, price, warehouse, purchasing, and stock movements are out of scope.
- Preserve unrelated frontend untracked files.

---

### Task 1: Backend constraints and permissions

**Files:**
- Create: `D:\project-cps\cps-api\src\database\migrations\1700000000006-AddMaterialCodeCaseInsensitiveIndex.ts`
- Test: `D:\project-cps\cps-api\src\database\migrations\1700000000006-AddMaterialCodeCaseInsensitiveIndex.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\materials\material-permissions.ts`
- Test: `D:\project-cps\cps-api\src\modules\materials\material-permissions.spec.ts`
- Modify: `D:\project-cps\cps-api\src\database\seeds\seed.ts`

**Interfaces:** Produces MATERIAL_PERMISSIONS and database-enforced uniqueness on LOWER(code).

- [ ] **Step 1: Write failing tests**

~~~ts
expect(sql).toContain('CREATE UNIQUE INDEX uq_materials_code_ci');
expect(sql).toContain('ON master.materials (LOWER(code))');
expect(MATERIAL_PERMISSIONS).toEqual({
  VIEW: 'MATERIAL_VIEW',
  CREATE: 'MATERIAL_CREATE',
  UPDATE: 'MATERIAL_UPDATE',
  DELETE: 'MATERIAL_DELETE',
});
~~~

- [ ] **Step 2: Verify failure**

~~~powershell
pnpm.cmd test database/migrations/1700000000006-AddMaterialCodeCaseInsensitiveIndex.spec.ts modules/materials/material-permissions.spec.ts --runInBand
~~~

Expected: FAIL because both production files are absent.

- [ ] **Step 3: Implement the migration, constants, and idempotent seed data**

Map MATERIAL_VIEW to action READ and the remaining permission codes to same-named actions. Attach all four to the MATERIALS_MANAGEMENTS menu at /materials, creating the menu only if absent. Leave department restrictions configurable through the existing permission UI.

- [ ] **Step 4: Pass tests and commit**

~~~powershell
pnpm.cmd test database/migrations/1700000000006-AddMaterialCodeCaseInsensitiveIndex.spec.ts modules/materials/material-permissions.spec.ts --runInBand
git add src/database/migrations/1700000000006-AddMaterialCodeCaseInsensitiveIndex.ts src/database/migrations/1700000000006-AddMaterialCodeCaseInsensitiveIndex.spec.ts src/modules/materials/material-permissions.ts src/modules/materials/material-permissions.spec.ts src/database/seeds/seed.ts
git commit -m "feat: add material CRUD permissions"
~~~

### Task 2: Backend DTOs and read service

**Files:**
- Create: `D:\project-cps\cps-api\src\modules\materials\dto\create-material.dto.ts`
- Create: `D:\project-cps\cps-api\src\modules\materials\dto\update-material.dto.ts`
- Create: `D:\project-cps\cps-api\src\modules\materials\dto\list-materials-query.dto.ts`
- Test: `D:\project-cps\cps-api\src\modules\materials\dto\material.dto.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\materials\materials.service.ts`
- Test: `D:\project-cps\cps-api\src\modules\materials\materials.service.spec.ts`

**Interfaces:** Produces CreateMaterialDto, UpdateMaterialDto, ListMaterialsQueryDto, findAll(query), findOne(id), and getLookups(). UpdateMaterialDto.updatedAt is the ISO concurrency token.

- [ ] **Step 1: Write DTO tests** for trimmed required strings, empty optional strings becoming null, bigint IDs, duplicate supplierIds, page 1+, limit 1-100, allow-listed sort fields, and required updatedAt on update.

~~~ts
const errors = await validateDto(CreateMaterialDto, {
  code: ' MAT-001 ', name: ' Steel ', unitId: '1', supplierIds: ['2', '2'],
});
expect(errors).toContainEqual(expect.objectContaining({ property: 'supplierIds' }));
~~~

- [ ] **Step 2: Write read-service tests** for code/name search, every filter, fixed-column sorting, pagination metadata, relation mapping, inactive rows, NotFoundException, and active-only lookups sorted by code.

~~~ts
expect(await service.findAll({ page: 2, limit: 20, search: 'steel' })).toEqual({
  items: expect.any(Array),
  meta: { page: 2, limit: 20, totalItems: 21, totalPages: 2 },
});
~~~

- [ ] **Step 3: Verify both suites fail**

~~~powershell
pnpm.cmd test modules/materials/dto/material.dto.spec.ts modules/materials/materials.service.spec.ts --runInBand
~~~

- [ ] **Step 4: Implement DTO transforms and QueryBuilder reads**

List query fields are page, limit, search, isActive, unitId, modelId, deliveryTypeId, loadingPointId, supplierId, sortBy, and sortOrder. Map sortBy through a fixed object; never interpolate arbitrary input. Map active SupplierMaterial relations to a suppliers response array.

- [ ] **Step 5: Pass tests and commit**

~~~powershell
pnpm.cmd test modules/materials/dto/material.dto.spec.ts modules/materials/materials.service.spec.ts --runInBand
git add src/modules/materials/dto src/modules/materials/materials.service.ts src/modules/materials/materials.service.spec.ts
git commit -m "feat: query material master"
~~~

### Task 3: Transactional Material aggregate commands

**Files:**
- Modify: `D:\project-cps\cps-api\src\modules\materials\materials.service.ts`
- Test: `D:\project-cps\cps-api\src\modules\materials\materials.aggregate.spec.ts`

**Interfaces:** Produces create(dto,userId), update(id,dto,userId), deactivate(id,userId), and restore(id,userId).

- [ ] **Step 1: Write failing tests** for active foreign-key validation, case-insensitive code conflict, supplier insert/reactivate/deactivate diff, audit IDs, rollback, relationship-preserving soft delete, restore, and stale updatedAt conflict.

~~~ts
await expect(service.update('7', { ...payload, updatedAt: stale }, '9'))
  .rejects.toThrow(ConflictException);
expect(dataSource.transaction).toHaveBeenCalledTimes(1);
~~~

- [ ] **Step 2: Verify failure**

~~~powershell
pnpm.cmd test modules/materials/materials.aggregate.spec.ts --runInBand
~~~

- [ ] **Step 3: Implement one transaction per command**

Lock update/deactivate/restore rows with pessimistic_write. Compare updatedAt after locking. Validate each referenced active Master inside the transaction, normalize code to uppercase, save audit IDs, then diff SupplierMaterial rows. Reactivate an existing unique pair instead of inserting it; set removed pairs inactive instead of deleting them.

- [ ] **Step 4: Pass all Material service tests and commit**

~~~powershell
pnpm.cmd test modules/materials/materials.service.spec.ts modules/materials/materials.aggregate.spec.ts --runInBand
git add src/modules/materials/materials.service.ts src/modules/materials/materials.aggregate.spec.ts
git commit -m "feat: save material aggregate transactionally"
~~~

### Task 4: Backend image storage, controller, and module

**Files:**
- Create: `D:\project-cps\cps-api\src\modules\materials\material-image-storage.service.ts`
- Test: `D:\project-cps\cps-api\src\modules\materials\material-image-storage.service.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\materials\materials.controller.ts`
- Test: `D:\project-cps\cps-api\src\modules\materials\materials.controller.spec.ts`
- Create: `D:\project-cps\cps-api\src\modules\materials\materials.module.ts`
- Modify: `D:\project-cps\cps-api\src\app.module.ts`

**Interfaces:** stage(file) returns { imagePath, previewUrl }; promote(imagePath) returns permanent path; discard(path) is idempotent. Accept JPEG, PNG, and WebP up to 5 MiB.

- [ ] **Step 1: Write storage tests** for MIME allow-list, byte limit, generated filename, traversal rejection, promotion, and cleanup after persistence failure.

- [ ] **Step 2: Write controller metadata tests** proving JwtAuthGuard, ActiveAssignmentGuard, and PermissionGuard are active and each route requires its matching MATERIAL_* permission.

~~~ts
expect(requiredPermission(MaterialsController.prototype.create)).toEqual(['MATERIAL_CREATE']);
expect(requiredPermission(MaterialsController.prototype.remove)).toEqual(['MATERIAL_DELETE']);
~~~

Upload must accept users holding MATERIAL_CREATE or MATERIAL_UPDATE. Extend PermissionGuard with explicit any-permission metadata and tests rather than requiring both.

- [ ] **Step 3: Implement eight endpoints**

GET /materials, GET /materials/lookups, GET /materials/:id, POST /materials, PATCH /materials/:id, DELETE /materials/:id, PATCH /materials/:id/restore, and POST /materials/images. Use FileInterceptor('file') for upload. Accept only server-generated temporary paths or the Material's current permanent path. Promote before commit and perform compensating deletion if the transaction rejects.

- [ ] **Step 4: Register all seven Master entities and AccessControlModule, then verify**

~~~powershell
pnpm.cmd test modules/materials common/guards/permission.guard.spec.ts --runInBand
pnpm.cmd run build
git add src/modules/materials src/common/guards/permission.guard* src/common/decorators src/app.module.ts
git commit -m "feat: expose protected material API"
~~~

### Task 5: Frontend API and hooks

**Files:**
- Create: `src/features/materials/api/materials-api.ts`
- Test: `src/features/materials/api/materials-api.test.ts`
- Create: `src/features/materials/hooks/use-materials.ts`
- Test: `src/features/materials/hooks/use-materials.test.tsx`
- Modify: `src/constants/app.ts`

**Interfaces:** Produces Material, MaterialLookups, MaterialPayload, ListMaterialsParams, materialsApi, and query/mutation hooks.

- [ ] **Step 1: Write failing API tests** for exact endpoints, query mapping, JSON payloads, multipart upload, deactivate, restore, and response types.

~~~ts
expect(mock.get).toHaveBeenCalledWith('/materials', {
  params: { page: 1, limit: 20, search: 'MAT', isActive: true },
});
~~~

- [ ] **Step 2: Write failing hook tests** for stable QUERY_KEYS.MATERIALS, list/detail invalidation, Thai success/error messages, and mutation pending state.

- [ ] **Step 3: Implement and pass tests**

~~~powershell
pnpm.cmd test src/features/materials/api/materials-api.test.ts src/features/materials/hooks/use-materials.test.tsx
git add src/features/materials/api src/features/materials/hooks src/constants/app.ts
git commit -m "feat: connect material API"
~~~

### Task 6: Frontend form and list components

**Files:**
- Create: `src/features/materials/components/material-form-dialog.tsx`
- Test: `src/features/materials/components/material-form-dialog.test.tsx`
- Create: `src/features/materials/components/material-table.tsx`
- Create: `src/features/materials/components/material-filters.tsx`
- Create: `src/features/materials/components/material-status-dialog.tsx`
- Test: `src/features/materials/components/material-list.test.tsx`

**Interfaces:** Form emits the aggregate payload plus updatedAt on edit. List emits server query params and selected row actions.

- [ ] **Step 1: Write form tests** for all fields, required validation, Supplier multi-select uniqueness, image preview/replacement/removal, retained values after API error, dirty-close confirmation, 409 stale warning, and disabled submit while pending.

- [ ] **Step 2: Implement form with React Hook Form and Zod**

Upload a new image before the aggregate mutation and put the returned imagePath in the payload. Preserve the current imagePath when no replacement is selected.

- [ ] **Step 3: Write list tests** for approved columns, debounced search, all filters, sorting, pagination, loading/empty/error states, supplier display, and status confirmation containing code/name and soft-delete wording.

- [ ] **Step 4: Implement focused list components and verify**

~~~powershell
pnpm.cmd test src/features/materials/components/material-form-dialog.test.tsx src/features/materials/components/material-list.test.tsx
git add src/features/materials/components
git commit -m "feat: build material CRUD components"
~~~

### Task 7: Permission-aware page and full verification

**Files:**
- Modify: `src/constants/permissions.ts`
- Replace: `src/app/(admin)/materials/page.tsx`
- Create: `src/app/(admin)/materials/page.test.tsx`

**Interfaces:** Page requires MATERIAL_VIEW; create, edit/restore, and deactivate use MATERIAL_CREATE, MATERIAL_UPDATE, and MATERIAL_DELETE respectively.

- [ ] **Step 1: Write failing page tests** proving mock/stock content is absent, real hooks render, actions are hidden without their permission, and super admin sees all actions.

- [ ] **Step 2: Add exact constants and compose the page**

~~~ts
MATERIAL_VIEW: 'MATERIAL_VIEW',
MATERIAL_CREATE: 'MATERIAL_CREATE',
MATERIAL_UPDATE: 'MATERIAL_UPDATE',
MATERIAL_DELETE: 'MATERIAL_DELETE',
~~~

- [ ] **Step 3: Run frontend verification**

~~~powershell
pnpm.cmd test
pnpm.cmd run type-check
pnpm.cmd run build
~~~

- [ ] **Step 4: Run backend verification**

~~~powershell
Set-Location D:\project-cps\cps-api
pnpm.cmd test --runInBand
pnpm.cmd run build
pnpm.cmd exec eslint "src/modules/materials/**/*.ts" "src/database/migrations/1700000000006-*.ts"
~~~

- [ ] **Step 5: Run the active-Assignment E2E scenario**

Use one user holding both WE and PC Assignments. Select each department at login and verify /auth/me/permissions matches the selected Assignment. Verify VIEW-only and full CRUD roles; create/edit Supplier relations; reject duplicate code and stale update; deactivate and restore.

- [ ] **Step 6: Inspect both repositories and commit the frontend page**

~~~powershell
git -C D:\project-cps\cps-api status --short
git -C C:\Users\USER\Desktop\minimax status --short
git add src/constants/permissions.ts "src/app/(admin)/materials/page.tsx" "src/app/(admin)/materials/page.test.tsx"
git commit -m "feat: deliver material CRUD page"
~~~

Expected: only intended changes and the user's pre-existing unrelated frontend untracked files remain.

---

## Completion Criteria

- All eight endpoints enforce active-Assignment permissions in Backend.
- Material and SupplierMaterial writes roll back together on database failure.
- Case-insensitive code duplicates and stale updates return 409.
- Soft delete preserves SupplierMaterial rows and restore works.
- Image upload validates JPEG/PNG/WebP up to 5 MiB and cleans up failed writes.
- The Material page contains no stock concepts or mock data.
- Backend Jest/build/lint and Frontend Vitest/type-check/build pass.

