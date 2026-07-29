# Department-Scoped Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-department restrictions to permissions, expose them through the permission APIs and UI, and enforce them against a user's active assignments.

**Architecture:** Store restrictions in `iam.department_permissions`; no active rows means unrestricted. The backend calculates grants per user-department-role assignment, applies department matching and per-assignment DENY precedence, then unions allowed codes. The Next.js permission catalog reads the expanded permission shape and saves selections through a dedicated PUT endpoint.

**Tech Stack:** PostgreSQL, TypeORM 0.3, NestJS 11, Jest 30, Next.js 16, React 19, TanStack Query 5, Radix UI, Vitest 4, Testing Library.

## Global Constraints

- A grant and matching department must come from the same active, unexpired assignment.
- A permission with zero active department mappings is available to every department.
- User-specific `DENY` overrides `ALLOW` only inside the same assignment.
- Super Admin bypasses permission and department restrictions.
- Only Super Admin can read or mutate the permission catalog.
- Do not modify existing backend migrations.
- Do not run migrations against a real database without approved credentials.
- Preserve unrelated changes in both repositories.

---

## File Map

### Backend: `D:\project-cps\cps-api`

- `src/database/migrations/1700000000003-CreateDepartmentPermissions.ts`: create/drop the join table and indexes.
- `src/entities/iam/department-permission.entity.ts`: TypeORM mapping for restriction rows.
- `src/entities/iam/department-permission.entity.spec.ts`: metadata regression test.
- `src/entities/iam/permission.entity.ts`: permission-to-restriction relation.
- `src/entities/iam/department.entity.ts`: department-to-restriction relation.
- `src/modules/permissions/dto/update-permission-departments.dto.ts`: PUT payload validation.
- `src/modules/permissions/permissions.controller.ts`: new PUT route.
- `src/modules/permissions/permissions.service.ts`: batched reads and transactional replacement.
- `src/modules/permissions/permissions.service.spec.ts`: list/detail/update behavior tests.
- `src/modules/permissions/permissions.module.ts`: repository registration.
- `src/modules/access-control/access-control.service.ts`: assignment-aware restricted grant rows.
- `src/modules/access-control/access-control.service.spec.ts`: matching-department tests.
- `src/modules/access-control/services/effective-permission.service.ts`: per-assignment DENY and union.
- `src/modules/access-control/services/effective-permission.service.spec.ts`: effective-code tests.
- `src/modules/access-control/access-control.module.ts`: restriction repository registration.
- `src/common/guards/permission.guard.ts`: evaluate all assignments.
- `src/common/guards/permission.guard.spec.ts`: guard call/bypass tests.
- `src/modules/auth/auth.controller.ts`: pass user ID to effective permission detail lookup.
- `src/modules/auth/auth.service.ts`: reuse effective permissions for `/auth/me/permissions`.
- `API_ENDPOINTS.md`: document response and PUT contract.

### Frontend: `C:\Users\USER\Desktop\minimax`

- `src/types/permission.ts`: department summary in `Permission`.
- `src/features/permissions/api/permissions-api.ts`: departments list and PUT request.
- `src/features/permissions/api/permissions-api.test.ts`: request contract tests.
- `src/features/permissions/hooks/use-permissions.ts`: update mutation and invalidation.
- `src/features/permissions/components/department-permission-dialog.tsx`: searchable multi-select.
- `src/features/permissions/components/department-permission-dialog.test.tsx`: modal interactions.
- `src/app/(admin)/permissions/page.tsx`: column, summaries, button, Super Admin visibility.
- `src/app/(admin)/permissions/permission-department-summary.tsx`: focused summary renderer.
- `src/app/(admin)/permissions/permission-department-summary.test.tsx`: unrestricted/restricted rendering.
- `src/mocks/handlers/permissions.ts`: mock PUT behavior.
- `src/mocks/db.ts`: ensure seeded permissions have department arrays.

---

### Task 1: Backend Schema and Entity

**Files:**

- Create: `D:\project-cps\cps-api\src\entities\iam\department-permission.entity.spec.ts`
- Create: `D:\project-cps\cps-api\src\entities\iam\department-permission.entity.ts`
- Create: `D:\project-cps\cps-api\src\database\migrations\1700000000003-CreateDepartmentPermissions.ts`
- Modify: `D:\project-cps\cps-api\src\entities\iam\permission.entity.ts`
- Modify: `D:\project-cps\cps-api\src\entities\iam\department.entity.ts`

**Interfaces:**

- Produces: `DepartmentPermission { id, permissionId, departmentId, isActive, createdAt, updatedAt, permission, department }`.
- Produces: `Permission.departmentPermissions: DepartmentPermission[]`.
- Produces: `Department.departmentPermissions: DepartmentPermission[]`.

- [ ] **Step 1: Write the failing entity metadata test**

```ts
import { getMetadataArgsStorage } from 'typeorm';
import { DepartmentPermission } from './department-permission.entity';

describe('DepartmentPermission entity', () => {
  it('maps to iam.department_permissions with a unique permission/department pair', () => {
    const storage = getMetadataArgsStorage();
    const table = storage.tables.find((item) => item.target === DepartmentPermission);
    const unique = storage.indices.find(
      (item) =>
        item.target === DepartmentPermission &&
        item.options.unique === true &&
        JSON.stringify(item.columns) ===
          JSON.stringify(['permissionId', 'departmentId']),
    );

    expect(table).toMatchObject({
      name: 'department_permissions',
      schema: 'iam',
    });
    expect(unique).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```text
pnpm test -- department-permission.entity.spec.ts --runInBand
```

Expected: FAIL because `department-permission.entity.ts` does not exist.

- [ ] **Step 3: Add the entity and relations**

Use `@Entity('department_permissions', { schema: 'iam' })`, `@Index(['permissionId', 'departmentId'], { unique: true })`, bigint string IDs, snake_case columns, `@CreateDateColumn`, `@UpdateDateColumn`, and `@ManyToOne(..., { onDelete: 'CASCADE' })`.

Add matching `@OneToMany` relations to `Permission` and `Department`.

- [ ] **Step 4: Add the reversible migration**

The `up` method creates the table, unique constraint, indexes, and cascading foreign keys. The `down` method drops the table:

```ts
await queryRunner.query(`
  CREATE TABLE IF NOT EXISTS iam.department_permissions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    permission_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_department_permissions_permission_department
      UNIQUE (permission_id, department_id),
    CONSTRAINT fk_department_permissions_permission
      FOREIGN KEY (permission_id) REFERENCES iam.permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_department_permissions_department
      FOREIGN KEY (department_id) REFERENCES iam.departments(id) ON DELETE CASCADE
  )
`);
```

- [ ] **Step 5: Run the entity test and build**

Run:

```text
pnpm test -- department-permission.entity.spec.ts --runInBand
pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```text
git add src/entities/iam/department-permission.entity.ts src/entities/iam/department-permission.entity.spec.ts src/entities/iam/permission.entity.ts src/entities/iam/department.entity.ts src/database/migrations/1700000000003-CreateDepartmentPermissions.ts
git commit -m "feat: add department permission mapping"
```

### Task 2: Permission Read and Update API

**Files:**

- Create: `D:\project-cps\cps-api\src\modules\permissions\dto\update-permission-departments.dto.ts`
- Create: `D:\project-cps\cps-api\src\modules\permissions\permissions.service.spec.ts`
- Modify: `D:\project-cps\cps-api\src\modules\permissions\permissions.controller.ts`
- Modify: `D:\project-cps\cps-api\src\modules\permissions\permissions.service.ts`
- Modify: `D:\project-cps\cps-api\src\modules\permissions\permissions.module.ts`

**Interfaces:**

- Consumes: `DepartmentPermission`.
- Produces: `UpdatePermissionDepartmentsDto { departmentIds: string[] }`.
- Produces: `PermissionsService.updateDepartments(id: string, departmentIds: string[]): Promise<Permission>`.
- Produces: permission responses with `departments: Array<{ id, code, nameTh, nameEn }>`.

- [ ] **Step 1: Write failing service tests**

Cover these observable cases with repository/DataSource stubs:

```ts
it('returns active departments on permission detail', async () => {
  permissionRepository.findOne.mockResolvedValue(permission);
  mappingRepository.find.mockResolvedValue([
    { permissionId: '10', isActive: true, department },
  ]);

  await expect(service.findOne('10')).resolves.toMatchObject({
    id: '10',
    departments: [{ id: '1', code: 'WE' }],
  });
});

it('uses an empty departments array for an unrestricted permission', async () => {
  permissionRepository.findOne.mockResolvedValue(permission);
  mappingRepository.find.mockResolvedValue([]);

  await expect(service.findOne('10')).resolves.toMatchObject({
    departments: [],
  });
});

it('deactivates omitted mappings and activates selected mappings atomically', async () => {
  await service.updateDepartments('10', ['2']);
  expect(manager.getRepository(DepartmentPermission).save).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({ departmentId: '1', isActive: false }),
      expect.objectContaining({ departmentId: '2', isActive: true }),
    ]),
  );
});
```

Also test unknown permission (`404`), unknown department IDs (`400` containing the IDs), idempotent reselection, and empty-array deactivation.

- [ ] **Step 2: Run the tests and verify RED**

Run:

```text
pnpm test -- permissions.service.spec.ts --runInBand
```

Expected: FAIL because the mapping repository, DTO, and update method do not exist.

- [ ] **Step 3: Implement batched response enrichment**

Add a private method with this signature:

```ts
private async attachDepartments(
  permissions: Permission[],
): Promise<Array<Permission & { departments: DepartmentSummary[] }>>
```

It loads active mappings for all permission IDs with `In(permissionIds)`, includes `department`, groups by `permissionId`, and adds a stable code-sorted `departments` array. `findAll` enriches the already-paginated items; `findOne` enriches one permission.

- [ ] **Step 4: Implement DTO, PUT controller, and transaction**

DTO:

```ts
export class UpdatePermissionDepartmentsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  departmentIds: string[];
}
```

Controller:

```ts
@Put(':id/departments')
updateDepartments(
  @Param('id') id: string,
  @Body() dto: UpdatePermissionDepartmentsDto,
) {
  return this.permissionsService.updateDepartments(id, dto.departmentIds);
}
```

The service uses `DataSource.transaction`, locks the permission row with `pessimistic_write`, validates all IDs using `In(departmentIds)`, toggles existing rows, creates absent rows, saves once, and calls `findOne` after commit.

- [ ] **Step 5: Register repositories and run tests/build**

Add `Department` and `DepartmentPermission` to `TypeOrmModule.forFeature`.

Run:

```text
pnpm test -- permissions.service.spec.ts --runInBand
pnpm build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```text
git add src/modules/permissions src/entities/iam/department-permission.entity.ts
git commit -m "feat: manage permission departments"
```

### Task 3: Assignment-Aware Access Control

**Files:**

- Create: `D:\project-cps\cps-api\src\modules\access-control\access-control.service.spec.ts`
- Modify: `D:\project-cps\cps-api\src\modules\access-control\access-control.service.ts`
- Modify: `D:\project-cps\cps-api\src\modules\access-control\services\effective-permission.service.ts`
- Modify: `D:\project-cps\cps-api\src\modules\access-control\services\effective-permission.service.spec.ts`
- Modify: `D:\project-cps\cps-api\src\modules\access-control\access-control.module.ts`

**Interfaces:**

- Produces:

```ts
export interface EffectivePermissionRow {
  assignmentId: string;
  departmentId: string | null;
  code: string;
  effect: 'ALLOW' | 'DENY';
  source: 'ROLE' | 'USER';
}
```

- [ ] **Step 1: Extend effective-service tests first**

```ts
it('applies deny inside one assignment without blocking another assignment', async () => {
  const service = new EffectivePermissionService({
    getEffectivePermissionRows: jest.fn().mockResolvedValue([
      { assignmentId: 'a', departmentId: '1', code: 'order.approve', source: 'ROLE', effect: 'ALLOW' },
      { assignmentId: 'a', departmentId: '1', code: 'order.approve', source: 'USER', effect: 'DENY' },
      { assignmentId: 'b', departmentId: '2', code: 'order.approve', source: 'ROLE', effect: 'ALLOW' },
    ]),
  } as any);

  await expect(service.getEffectivePermissionCodes('u1')).resolves.toEqual([
    'order.approve',
  ]);
});
```

Add a second test showing a denied assignment contributes no code when no other assignment allows it.

- [ ] **Step 2: Add failing access-control tests**

Use two assignment stubs and verify:

- unrestricted permission emits rows for granting assignments;
- restricted permission emits a row only when the same granting assignment has a listed department;
- a matching department on a non-granting assignment cannot be combined with another assignment's grant;
- inactive mappings do not restrict;
- expired assignments are not loaded;
- direct ALLOW and DENY rows keep their assignment IDs.

- [ ] **Step 3: Run tests and verify RED**

Run:

```text
pnpm test -- effective-permission.service.spec.ts access-control.service.spec.ts --runInBand
```

Expected: FAIL because rows do not carry assignment identity and department mappings are not checked.

- [ ] **Step 4: Implement per-assignment row generation**

Load active/unexpired assignments with a QueryBuilder condition:

```text
assignment.isActive = true
AND (assignment.expiredAt IS NULL OR assignment.expiredAt > :now)
```

Batch-load role actions, active permissions with `departmentPermissions`, and direct entries with `permission.departmentPermissions`. Use:

```ts
private isAllowedInDepartment(
  permission: Permission,
  departmentId: string | null,
): boolean {
  const restrictedIds = (permission.departmentPermissions ?? [])
    .filter((mapping) => mapping.isActive)
    .map((mapping) => mapping.departmentId);
  return restrictedIds.length === 0 ||
    (departmentId !== null && restrictedIds.includes(departmentId));
}
```

Emit rows while iterating assignments so role grants and department IDs cannot cross assignments.

- [ ] **Step 5: Implement per-assignment DENY resolution**

Group rows by `assignmentId`, calculate denied codes per group, retain allowed non-denied codes, then return the sorted unique union.

- [ ] **Step 6: Register `DepartmentPermission` and verify**

Run:

```text
pnpm test -- effective-permission.service.spec.ts access-control.service.spec.ts --runInBand
pnpm build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```text
git add src/modules/access-control
git commit -m "feat: enforce permission departments"
```

### Task 4: Guard, Auth, and API Documentation Alignment

**Files:**

- Modify: `D:\project-cps\cps-api\src\common\guards\permission.guard.spec.ts`
- Modify: `D:\project-cps\cps-api\src\common\guards\permission.guard.ts`
- Modify: `D:\project-cps\cps-api\src\modules\auth\auth.controller.ts`
- Modify: `D:\project-cps\cps-api\src\modules\auth\auth.service.ts`
- Modify: `D:\project-cps\cps-api\API_ENDPOINTS.md`

**Interfaces:**

- Produces: `AuthService.getMyPermissions(userId: string, roleCode: RoleCode)`.
- Consumes: `EffectivePermissionService.getEffectivePermissionCodes(userId, undefined, isSuperAdmin)`.

- [ ] **Step 1: Write failing guard assertions**

Extend the allowed-user test:

```ts
expect(service.getEffectivePermissionCodes).toHaveBeenCalledWith(
  '1',
  undefined,
  false,
);
```

Add a Super Admin test proving the service is not called.

- [ ] **Step 2: Run guard test and verify RED**

Run:

```text
pnpm test -- permission.guard.spec.ts --runInBand
```

Expected: FAIL because the guard currently passes `activeUserDepartmentRoleId`.

- [ ] **Step 3: Evaluate all assignments in the guard**

Pass `undefined` as `assignmentId` for non-Super-Admin requests. Keep the existing early Super Admin return.

- [ ] **Step 4: Align `/auth/me/permissions`**

Change the controller to call:

```ts
return this.authService.getMyPermissions(
  user.id,
  user.activeRoleCode as RoleCode,
);
```

The service gets effective codes from `EffectivePermissionService` and fetches active permission entities by those codes with `menu` and `action` relations. Super Admin uses the effective service's existing all-active bypass.

- [ ] **Step 5: Document API examples**

Add the `departments` response property, empty-array semantics, PUT request/response, validation errors, and Super Admin requirement to `API_ENDPOINTS.md`.

- [ ] **Step 6: Run focused and broad backend verification**

Run:

```text
pnpm test -- permission.guard.spec.ts --runInBand
pnpm test -- --runInBand
pnpm build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```text
git add src/common/guards/permission.guard.ts src/common/guards/permission.guard.spec.ts src/modules/auth/auth.controller.ts src/modules/auth/auth.service.ts API_ENDPOINTS.md
git commit -m "fix: align auth with department permissions"
```

### Task 5: Frontend API Contract and Mutation

**Files:**

- Create: `C:\Users\USER\Desktop\minimax\src\features\permissions\api\permissions-api.test.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\types\permission.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\permissions\api\permissions-api.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\permissions\hooks\use-permissions.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\mocks\handlers\permissions.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\mocks\db.ts`

**Interfaces:**

- Produces:

```ts
export interface PermissionDepartmentRef {
  id: string;
  code: string;
  nameTh?: string;
  nameEn?: string;
}

export interface UpdatePermissionDepartmentsPayload {
  departmentIds: string[];
}
```

- Produces: `permissionsApi.updateDepartments(id, payload)`.
- Produces: `useUpdatePermissionDepartments()`.

- [ ] **Step 1: Write the failing API request test**

Mock `apiClient.put` and assert:

```ts
await permissionsApi.updateDepartments('10', {
  departmentIds: ['1', '2'],
});

expect(apiClient.put).toHaveBeenCalledWith(
  '/permissions/10/departments',
  { departmentIds: ['1', '2'] },
);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```text
pnpm test src/features/permissions/api/permissions-api.test.ts
```

Expected: FAIL because `updateDepartments` does not exist.

- [ ] **Step 3: Implement types, API, and mutation**

Add `departments: PermissionDepartmentRef[]` to `Permission`, defaulting mock records to `[]`.

Add:

```ts
updateDepartments: (
  id: string,
  payload: UpdatePermissionDepartmentsPayload,
) => apiClient.put<Permission>(`/permissions/${id}/departments`, payload)
```

The mutation invalidates `[PERMISSIONS_QUERY_KEY]` and shows Thai success/error toasts.

- [ ] **Step 4: Update mock PUT behavior**

Match `/permissions/:id/departments` before the generic detail handler, resolve department IDs from `mockDb.departments`, reject unknown IDs, and replace the permission's `departments` array.

- [ ] **Step 5: Run test/type-check**

Run:

```text
pnpm test src/features/permissions/api/permissions-api.test.ts
pnpm type-check
```

Expected: PASS.

- [ ] **Step 6: Commit**

```text
git add src/types/permission.ts src/features/permissions src/mocks
git commit -m "feat: add permission department client"
```

### Task 6: Department Multi-Select and Permission Table

**Files:**

- Create: `C:\Users\USER\Desktop\minimax\src\features\permissions\components\department-permission-dialog.test.tsx`
- Create: `C:\Users\USER\Desktop\minimax\src\features\permissions\components\department-permission-dialog.tsx`
- Create: `C:\Users\USER\Desktop\minimax\src\app\(admin)\permissions\permission-department-summary.test.tsx`
- Create: `C:\Users\USER\Desktop\minimax\src\app\(admin)\permissions\permission-department-summary.tsx`
- Modify: `C:\Users\USER\Desktop\minimax\src\app\(admin)\permissions\page.tsx`

**Interfaces:**

- Produces:

```ts
export interface DepartmentPermissionDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  permission: Permission | null;
}
```

- Produces: `PermissionDepartmentSummary({ departments })`.

- [ ] **Step 1: Write summary tests**

```tsx
it('shows every department for an empty restriction list', () => {
  render(<PermissionDepartmentSummary departments={[]} />);
  expect(screen.getByText('ทุกแผนก')).toBeInTheDocument();
});

it('shows two names and the remaining count', () => {
  render(<PermissionDepartmentSummary departments={threeDepartments} />);
  expect(screen.getByText('แผนก A')).toBeInTheDocument();
  expect(screen.getByText('แผนก B')).toBeInTheDocument();
  expect(screen.getByText('+1')).toBeInTheDocument();
});
```

- [ ] **Step 2: Write modal interaction tests**

With query/mutation hooks mocked, verify:

- current departments start checked;
- searching by code and Thai/English name filters rows;
- "เลือกทั้งหมด" selects all currently filtered rows;
- "ล้างทั้งหมด" clears selection;
- save calls the mutation with `{ id, departmentIds }`;
- failed save leaves the dialog open.

- [ ] **Step 3: Run component tests and verify RED**

Run:

```text
pnpm test src/app/(admin)/permissions/permission-department-summary.test.tsx src/features/permissions/components/department-permission-dialog.test.tsx
```

Expected: FAIL because both components do not exist.

- [ ] **Step 4: Implement the summary and modal**

Use existing `Dialog`, `Input`, `Checkbox`, `ScrollArea`, `Badge`, and `Button` components. Department labels use `nameTh ?? nameEn ?? name ?? code`. Search is case-insensitive. Reset local search and selection every time the modal opens or the permission changes.

Fetch all departments with:

```ts
apiClient.get<PaginatedList<Department>>('/departments', {
  params: { page: 1, limit: 1000 },
})
```

Save an empty array unchanged so it means unrestricted.

- [ ] **Step 5: Integrate with the table and Super Admin visibility**

Add local `departmentPermission` state, the new column, summary component, and a visible "กำหนดแผนก" button. Render the catalog tab and catalog content only when `usePermission().isSuperAdmin()` is true. Keep the "My permissions" tab for every authenticated user.

- [ ] **Step 6: Run component tests and frontend verification**

Run:

```text
pnpm test src/app/(admin)/permissions/permission-department-summary.test.tsx src/features/permissions/components/department-permission-dialog.test.tsx
pnpm test
pnpm type-check
pnpm lint
pnpm build
```

Expected: PASS with no TypeScript or lint errors.

- [ ] **Step 7: Commit**

```text
git add src/app/(admin)/permissions src/features/permissions src/types/permission.ts
git commit -m "feat: manage permission departments in UI"
```

### Task 7: Final Cross-Repository Verification

**Files:**

- Verify all modified files in both repositories.

**Interfaces:**

- Consumes: all preceding tasks.
- Produces: verified backend and frontend feature ready for database deployment.

- [ ] **Step 1: Inspect both worktrees**

Run:

```text
git -C D:\project-cps\cps-api status --short
git -C C:\Users\USER\Desktop\minimax status --short
git -C D:\project-cps\cps-api diff --check
git -C C:\Users\USER\Desktop\minimax diff --check
```

Expected: no unintended files and no whitespace errors.

- [ ] **Step 2: Run final backend verification**

Run:

```text
pnpm test -- --runInBand
pnpm build
pnpm lint
```

Working directory: `D:\project-cps\cps-api`.

Expected: PASS. If lint modifies files, inspect the exact diff and rerun tests/build.

- [ ] **Step 3: Run final frontend verification**

Run:

```text
pnpm test
pnpm type-check
pnpm lint
pnpm build
```

Working directory: `C:\Users\USER\Desktop\minimax`.

Expected: PASS.

- [ ] **Step 4: Report migration handoff**

Provide the approved deployment command without executing it:

```text
pnpm migration:run
```

Working directory: `D:\project-cps\cps-api`.

State that production database credentials and backup/rollback procedures must be confirmed before execution.

