# User Menu Access Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the menus an edited user can currently access, grouped by each saved department-and-role assignment.

**Architecture:** Add one aggregate, Super Admin-protected users endpoint that reuses the authentication permission and menu-tree services for every assignment. Add a typed React Query resource and a focused read-only component in the edit-user sheet; persisted access is reloaded after a successful assignment update.

**Tech Stack:** NestJS 11, TypeORM, Jest, Next.js 16, React 19, TypeScript, TanStack Query 5, Vitest, Testing Library, Tailwind CSS.

## Global Constraints

- Work in the existing frontend workspace `C:\Users\USER\Desktop\minimax` and backend workspace `D:\project-cps\cps-api`; do not create a Git worktree.
- Display access separately for every saved assignment; never union permissions across assignments.
- Treat the backend as the sole authority for effective permissions and visible menus.
- Display persisted access only; do not preview unsaved assignment edits.
- Reuse `EffectivePermissionService` and `MenuTreeService`, matching login behavior including explicit `ALLOW`/`DENY` resolution and Super Admin access.
- Inactive or expired assignments return and display no current access.
- Preserve all existing authentication and user API contracts.
- Do not add dependencies or database migrations.

---

## File Structure

### Backend: `D:\project-cps\cps-api`

- Create `src/modules/users/dto/user-access-summary.dto.ts`: response interfaces for the aggregate resource.
- Create `src/modules/users/user-access-summary.service.ts`: assignment loading, effective-permission calculation, menu-tree construction, and node counting.
- Create `src/modules/users/user-access-summary.service.spec.ts`: unit coverage for scoped permissions, Super Admin, disabled access, ordering, counts, and missing users.
- Modify `src/modules/users/users.controller.ts`: expose `GET /users/:id/access-summary` before the generic assignment routes and delegate to the focused service.
- Modify `src/modules/users/users.module.ts`: import `AccessControlModule` and register/export `UserAccessSummaryService`.
- Modify `API_ENDPOINTS.md`: document the new endpoint and response contract.

### Frontend: `C:\Users\USER\Desktop\minimax`

- Modify `src/constants/app.ts`: add the stable `QUERY_KEYS.USERS.ACCESS_SUMMARY(id)` key.
- Modify `src/features/users/api/users-api.ts`: define access-summary types and add `usersApi.getAccessSummary(id)`.
- Modify `src/features/users/api/users-api.test.ts`: verify the new GET route.
- Modify `src/features/users/hooks/use-users.ts`: add `useUserAccessSummary` and invalidate the summary after updates.
- Modify `src/features/users/hooks/use-users.test.tsx`: verify query wiring and access-summary invalidation.
- Create `src/features/users/components/user-menu-access.tsx`: render assignment cards, states, and recursive menu rows.
- Create `src/features/users/components/user-menu-access.test.tsx`: cover loading, errors/retry, grouping, nested menus, system scope, and unavailable assignments.
- Modify `src/features/users/components/user-form-dialog.tsx`: add the third tab and mount the access component for edit mode.
- Modify `src/features/users/components/user-form-dialog.test.tsx`: verify the new tab is present and passes the edited user ID.

---

### Task 1: Backend Aggregate Access Summary

**Files:**
- Create: `D:\project-cps\cps-api\src\modules\users\dto\user-access-summary.dto.ts`
- Create: `D:\project-cps\cps-api\src\modules\users\user-access-summary.service.ts`
- Create: `D:\project-cps\cps-api\src\modules\users\user-access-summary.service.spec.ts`
- Modify: `D:\project-cps\cps-api\src\modules\users\users.controller.ts`
- Modify: `D:\project-cps\cps-api\src\modules\users\users.module.ts`
- Modify: `D:\project-cps\cps-api\API_ENDPOINTS.md`

**Interfaces:**
- Consumes: `EffectivePermissionService.getEffectivePermissionCodes(userId: string, assignmentId?: string, isSuperAdmin?: boolean): Promise<string[]>`, `AccessControlService.getMenusWithPermissions()`, and `MenuTreeService.buildMenuTree(menus, permissionCodes, isSuperAdmin)`.
- Produces: `UserAccessSummaryService.getForUser(userId: string): Promise<UserAccessSummaryDto>` and `GET /users/:id/access-summary`.

- [ ] **Step 1: Define the response contract**

Create `user-access-summary.dto.ts` with exact serializable fields:

```ts
import { MenuResponse } from '../../access-control/services/menu-tree.service';

export interface UserAccessSummaryDepartmentDto {
  id: string;
  code: string;
  name: string;
}

export interface UserAccessSummaryRoleDto {
  id: string;
  code: string;
  name: string;
  scopeType: 'SYSTEM' | 'DEPARTMENT';
}

export interface UserAssignmentAccessDto {
  assignmentId: string;
  department: UserAccessSummaryDepartmentDto | null;
  role: UserAccessSummaryRoleDto;
  isActive: boolean;
  expiredAt: Date | null;
  permissions: string[];
  menus: MenuResponse[];
  menuCount: number;
}

export interface UserAccessSummaryDto {
  userId: string;
  assignments: UserAssignmentAccessDto[];
}
```

- [ ] **Step 2: Write failing service tests**

Create `user-access-summary.service.spec.ts`. Mock the user repository, assignment query builder, and three access-control services. Include these concrete assertions:

```ts
it('builds an independently scoped menu tree for every active assignment', async () => {
  effectivePermissions.getEffectivePermissionCodes
    .mockResolvedValueOnce(['production.read'])
    .mockResolvedValueOnce(['quality.read']);
  menuTree.buildMenuTree
    .mockReturnValueOnce([{ ...productionMenu, children: [productionChild] }])
    .mockReturnValueOnce([qualityMenu]);

  const result = await service.getForUser('7');

  expect(effectivePermissions.getEffectivePermissionCodes).toHaveBeenNthCalledWith(
    1, '7', '76', false,
  );
  expect(effectivePermissions.getEffectivePermissionCodes).toHaveBeenNthCalledWith(
    2, '7', '77', false,
  );
  expect(result.assignments[0]).toMatchObject({ assignmentId: '76', menuCount: 2 });
  expect(result.assignments[1]).toMatchObject({ assignmentId: '77', menuCount: 1 });
});

it('uses Super Admin permission and menu behavior for a SUPER_ADMIN assignment', async () => {
  await service.getForUser('7');
  expect(effectivePermissions.getEffectivePermissionCodes).toHaveBeenCalledWith(
    '7', '80', true,
  );
  expect(menuTree.buildMenuTree).toHaveBeenCalledWith(
    menuDefinitions, ['all.permissions'], true,
  );
});

it.each([
  { label: 'inactive', isActive: false, expiredAt: null },
  { label: 'expired', isActive: true, expiredAt: new Date('2026-08-01T00:00:00Z') },
])('returns no current access for an $label assignment', async ({ isActive, expiredAt }) => {
  assignments = [{ ...baseAssignment, isActive, expiredAt }];
  const result = await service.getForUser('7');
  expect(result.assignments[0]).toMatchObject({ permissions: [], menus: [], menuCount: 0 });
  expect(effectivePermissions.getEffectivePermissionCodes).not.toHaveBeenCalled();
});

it('throws NotFoundException when the target user does not exist', async () => {
  users.findOneBy.mockResolvedValue(null);
  await expect(service.getForUser('404')).rejects.toBeInstanceOf(NotFoundException);
});
```

Also assert that the assignment query uses `orderBy('udr.createdAt', 'ASC')` followed by `addOrderBy('udr.id', 'ASC')`, and that `getMenusWithPermissions()` runs once regardless of assignment count.

- [ ] **Step 3: Run the new test and confirm the expected failure**

Run from `D:\project-cps\cps-api`:

```powershell
npm test -- user-access-summary.service.spec.ts --runInBand
```

Expected: FAIL because `UserAccessSummaryService` does not exist.

- [ ] **Step 4: Implement the focused service**

Create `UserAccessSummaryService` with injected repositories and services. Use this control flow:

```ts
@Injectable()
export class UserAccessSummaryService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(UserDepartmentRole)
    private readonly assignments: Repository<UserDepartmentRole>,
    private readonly effectivePermissions: EffectivePermissionService,
    private readonly accessControl: AccessControlService,
    private readonly menuTree: MenuTreeService,
  ) {}

  async getForUser(userId: string): Promise<UserAccessSummaryDto> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const assignments = await this.assignments
      .createQueryBuilder('udr')
      .leftJoinAndSelect('udr.department', 'department')
      .leftJoinAndSelect('udr.role', 'role')
      .where('udr.userId = :userId', { userId })
      .orderBy('udr.createdAt', 'ASC')
      .addOrderBy('udr.id', 'ASC')
      .getMany();
    const menus = await this.accessControl.getMenusWithPermissions();
    const now = new Date();

    return {
      userId,
      assignments: await Promise.all(assignments.map(async (assignment) => {
        const available = assignment.isActive &&
          (!assignment.expiredAt || assignment.expiredAt > now);
        const isSuperAdmin = assignment.role.code === RoleCode.SUPER_ADMIN;
        const permissions = available
          ? await this.effectivePermissions.getEffectivePermissionCodes(
              userId, assignment.id, isSuperAdmin,
            )
          : [];
        const tree = available
          ? this.menuTree.buildMenuTree(menus, permissions, isSuperAdmin)
          : [];

        return {
          assignmentId: assignment.id,
          department: assignment.department
            ? {
                id: assignment.department.id,
                code: assignment.department.code,
                name: assignment.department.nameTh,
              }
            : null,
          role: {
            id: assignment.role.id,
            code: assignment.role.code,
            name: assignment.role.nameTh,
            scopeType: assignment.role.scopeType,
          },
          isActive: assignment.isActive,
          expiredAt: assignment.expiredAt,
          permissions,
          menus: tree,
          menuCount: this.countMenus(tree),
        };
      })),
    };
  }

  private countMenus(items: MenuResponse[]): number {
    return items.reduce(
      (total, item) => total + 1 + this.countMenus(item.children),
      0,
    );
  }
}
```

- [ ] **Step 5: Wire the module and route**

Import `AccessControlModule` in `UsersModule`, add `UserAccessSummaryService` to `providers` and `exports`, inject it into `UsersController`, and add this route before `@Get(':id/assignments')`:

```ts
@Get(':id/access-summary')
getAccessSummary(@Param('id') id: string) {
  return this.userAccessSummaryService.getForUser(id);
}
```

The controller-level `JwtAuthGuard`, `RolesGuard`, and `@Roles(RoleCode.SUPER_ADMIN)` remain unchanged.

- [ ] **Step 6: Document the endpoint**

Under the Super Admin Users section in `API_ENDPOINTS.md`, add:

```markdown
### GET `/users/:id/access-summary`

Returns persisted, effective menu access grouped by assignment. Inactive or expired assignments are returned with empty `permissions`, `menus`, and `menuCount: 0`. System assignments have `department: null`.
```

Include the response example from the approved design spec.

- [ ] **Step 7: Run focused and module tests**

```powershell
npm test -- user-access-summary.service.spec.ts users.service.spec.ts users.aggregate-update.spec.ts --runInBand
npm run build
```

Expected: all selected suites PASS and Nest build exits with code 0.

- [ ] **Step 8: Commit the backend task**

```powershell
git add src/modules/users/dto/user-access-summary.dto.ts src/modules/users/user-access-summary.service.ts src/modules/users/user-access-summary.service.spec.ts src/modules/users/users.controller.ts src/modules/users/users.module.ts API_ENDPOINTS.md
git commit -m "feat: expose user menu access summary"
```

---

### Task 2: Frontend Access-Summary API and Query

**Files:**
- Modify: `C:\Users\USER\Desktop\minimax\src\constants\app.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\api\users-api.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\api\users-api.test.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\hooks\use-users.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\hooks\use-users.test.tsx`

**Interfaces:**
- Consumes: `GET /users/:id/access-summary` from Task 1 with its canonical `MAIN | SUB` menu-tree discriminator.
- Produces: `UserAccessMenuItem`, `UserAccessSummary`, `UserAssignmentAccess`, `usersApi.getAccessSummary(id)`, `QUERY_KEYS.USERS.ACCESS_SUMMARY(id)`, and `useUserAccessSummary(userId)`.

- [ ] **Step 1: Write failing API and hook tests**

Extend the API mock with `get: vi.fn()` and add:

```ts
it('gets the persisted access summary for one user', async () => {
  await usersApi.getAccessSummary('7');
  expect(apiClient.get).toHaveBeenCalledWith('/users/7/access-summary');
});
```

Extend the hook test mock with `getAccessSummary: vi.fn()`. Add a query test using `renderHook(() => useUserAccessSummary('7'), { wrapper })` that waits for success and asserts `usersApi.getAccessSummary('7')` was called once.

Update the existing mutation test to assert:

```ts
expect(invalidate).toHaveBeenCalledWith({
  queryKey: QUERY_KEYS.USERS.ACCESS_SUMMARY('7'),
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

```powershell
pnpm test src/features/users/api/users-api.test.ts src/features/users/hooks/use-users.test.tsx
```

Expected: FAIL because the access-summary API, key, and hook are not defined.

- [ ] **Step 3: Add typed API contracts and request**

In `users-api.ts`, define a response-specific menu type and shape matching `MenuResponse` from the backend:

```ts
export type UserAccessMenuType = 'MAIN' | 'SUB';

export interface UserAccessMenuItem {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  path: string | null;
  icon: string | null;
  menuType: UserAccessMenuType;
  sortOrder: number;
  permissions: string[];
  children: UserAccessMenuItem[];
}

export interface UserAssignmentAccess {
  assignmentId: string;
  department: { id: string; code: string; name: string } | null;
  role: {
    id: string;
    code: string;
    name: string;
    scopeType: 'SYSTEM' | 'DEPARTMENT';
  };
  isActive: boolean;
  expiredAt: string | null;
  permissions: string[];
  menus: UserAccessMenuItem[];
  menuCount: number;
}

export interface UserAccessSummary {
  userId: string;
  assignments: UserAssignmentAccess[];
}
```

Add to `usersApi`:

```ts
getAccessSummary: (id: string) =>
  apiClient.get<UserAccessSummary>(`/users/${id}/access-summary`),
```

- [ ] **Step 4: Add the query key, hook, and invalidation**

Add to `QUERY_KEYS.USERS`:

```ts
ACCESS_SUMMARY: (id: string) => ['users', 'access-summary', id] as const,
```

Add to `use-users.ts`:

```ts
export function useUserAccessSummary(userId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.ACCESS_SUMMARY(userId ?? ''),
    queryFn: () => usersApi.getAccessSummary(userId!),
    enabled: !!userId,
  });
}
```

In `useUpdateUser.onSuccess`, invalidate `QUERY_KEYS.USERS.ACCESS_SUMMARY(vars.id)` in addition to the existing list, detail, and assignments keys.

- [ ] **Step 5: Run the focused tests and type-check**

```powershell
pnpm test src/features/users/api/users-api.test.ts src/features/users/hooks/use-users.test.tsx
pnpm type-check
```

Expected: focused tests PASS and TypeScript exits with code 0.

- [ ] **Step 6: Commit the frontend data layer**

```powershell
git add src/constants/app.ts src/features/users/api/users-api.ts src/features/users/api/users-api.test.ts src/features/users/hooks/use-users.ts src/features/users/hooks/use-users.test.tsx
git commit -m "feat: load user menu access summary"
```

---

### Task 3: Read-Only Assignment Menu Tree UI

**Files:**
- Create: `C:\Users\USER\Desktop\minimax\src\features\users\components\user-menu-access.tsx`
- Create: `C:\Users\USER\Desktop\minimax\src\features\users\components\user-menu-access.test.tsx`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\components\user-form-dialog.tsx`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\components\user-form-dialog.test.tsx`

**Interfaces:**
- Consumes: `useUserAccessSummary(userId: string | null)` and `UserAssignmentAccess` from Task 2.
- Produces: `UserMenuAccess({ userId }: { userId: string })` and a third edit-user tab.

- [ ] **Step 1: Write failing component tests**

Mock `useUserAccessSummary`. Add tests with concrete data containing two assignments and a nested menu:

```ts
it('groups nested accessible menus by assignment', () => {
  mockSummary({
    userId: '7',
    assignments: [departmentAssignment, systemAssignment],
  });
  render(<UserMenuAccess userId="7" />);
  expect(screen.getByText('ฝ่ายผลิต')).toBeInTheDocument();
  expect(screen.getByText('ผู้จัดการ')).toBeInTheDocument();
  expect(screen.getByText('ระดับระบบ / ทุกแผนก')).toBeInTheDocument();
  expect(screen.getByText('จัดการผู้ใช้งาน')).toBeInTheDocument();
  expect(screen.getByText('/user-management/users')).toBeInTheDocument();
});
```

Add separate tests that assert:

- loading renders elements with `data-testid="menu-access-skeleton"`;
- error renders `ไม่สามารถโหลดเมนูที่เข้าถึงได้` and clicking `ลองใหม่` calls `refetch`;
- an empty assignment list renders `ไม่พบ Assignment ที่บันทึกไว้`;
- an active assignment with no menus renders `ไม่มีเมนูที่เข้าถึงได้`;
- inactive and expired assignments render `ไม่พร้อมใช้งาน` and do not render their supplied menu fixture.

Update `user-form-dialog.test.tsx` to mock `UserMenuAccess`, click the `เมนูที่เข้าถึงได้` tab, and assert the mock receives `userId="7"`.

- [ ] **Step 2: Run the component tests and confirm failure**

```powershell
pnpm test src/features/users/components/user-menu-access.test.tsx src/features/users/components/user-form-dialog.test.tsx
```

Expected: FAIL because `UserMenuAccess` and the third tab do not exist.

- [ ] **Step 3: Implement the access component states**

Create a client component with the public signature:

```tsx
export function UserMenuAccess({ userId }: { userId: string }) {
  const { data, isLoading, isError, refetch } = useUserAccessSummary(userId);

  if (isLoading) return <MenuAccessSkeleton />;
  if (isError) return <MenuAccessError onRetry={() => void refetch()} />;
  if (!data?.assignments.length) return <MenuAccessEmpty />;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        อ้างอิงจาก Assignment ที่บันทึกล่าสุด
      </p>
      {data.assignments.map((assignment) => (
        <AssignmentAccessCard
          key={assignment.assignmentId}
          assignment={assignment}
        />
      ))}
    </div>
  );
}
```

Use existing `Alert`, `Badge`, `Button`, and `Skeleton` components. Determine availability with:

```ts
const expired = !!assignment.expiredAt &&
  new Date(assignment.expiredAt).getTime() <= Date.now();
const available = assignment.isActive && !expired;
```

The header label is `assignment.department?.name ?? 'ระดับระบบ / ทุกแผนก'`; role uses `assignment.role.name`. Display `เมนู ${assignment.menuCount} รายการ` only for available assignments.

- [ ] **Step 4: Implement recursive menu rows**

Use a focused recursive renderer that preserves response order:

```tsx
function MenuRows({
  items,
  depth = 0,
}: {
  items: UserAccessMenuItem[];
  depth?: number;
}) {
  return items.map((item) => (
    <div key={item.id}>
      <div
        className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <Menu className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{item.name || item.nameEn}</span>
        {item.path && (
          <code className="ml-auto truncate text-[11px] text-muted-foreground">
            {item.path}
          </code>
        )}
      </div>
      {!!item.children?.length && <MenuRows items={item.children} depth={depth + 1} />}
    </div>
  ));
}
```

Do not add expand/collapse state: the requested view is read-only and the full hierarchy should be immediately visible.

- [ ] **Step 5: Add the edit-sheet tab**

In `user-form-dialog.tsx`, import `UserMenuAccess`, change the edit-mode `TabsList` to three equal columns, and add:

```tsx
<TabsTrigger value="menu-access" className="flex-1">
  เมนูที่เข้าถึงได้
</TabsTrigger>
```

Inside the existing edit form, add:

```tsx
<TabsContent value="menu-access" className="mt-0 space-y-4">
  <FormSection title="สิทธิ์การเข้าถึงเมนู">
    <UserMenuAccess userId={user.id} />
  </FormSection>
</TabsContent>
```

Keep the shared Save and Cancel footer unchanged. The access tab is informational and does not add fields to the form payload.

- [ ] **Step 6: Run focused UI tests and type-check**

```powershell
pnpm test src/features/users/components/user-menu-access.test.tsx src/features/users/components/user-form-dialog.test.tsx
pnpm type-check
```

Expected: focused tests PASS and TypeScript exits with code 0.

- [ ] **Step 7: Commit the UI task**

```powershell
git add src/features/users/components/user-menu-access.tsx src/features/users/components/user-menu-access.test.tsx src/features/users/components/user-form-dialog.tsx src/features/users/components/user-form-dialog.test.tsx
git commit -m "feat: show user menus by assignment"
```

---

### Task 4: Cross-Repository Verification and Contract Review

**Files:**
- Verify: all files changed in Tasks 1-3
- Modify only if a verification failure is caused by this feature: the smallest affected production or test file from Tasks 1-3

**Interfaces:**
- Consumes: the completed backend endpoint and frontend tab.
- Produces: verified build/test evidence and clean repository states.

- [ ] **Step 1: Run the complete backend verification**

From `D:\project-cps\cps-api`:

```powershell
npm test -- --runInBand
npm run build
```

Expected: all Jest suites PASS and build exits with code 0.

- [ ] **Step 2: Run the frontend feature verification**

From `C:\Users\USER\Desktop\minimax`:

```powershell
pnpm test src/features/users
pnpm type-check
pnpm lint
pnpm build
```

Expected: user-feature tests PASS, type-check and build exit with code 0, and lint introduces no new errors. Record existing unrelated warnings separately.

- [ ] **Step 3: Attempt the complete frontend test suite**

```powershell
pnpm test
```

Expected for this feature: all new and modified suites PASS. If the already-known unrelated `src/features/roles/components/role-form-dialog.test.tsx` `ResizeObserver` constructor failure remains, report it verbatim and confirm no user-menu-access suite failed; do not modify that unrelated file under this plan.

- [ ] **Step 4: Review the API contract line by line**

Confirm these exact invariants from test output or fixture assertions:

```text
response.userId equals the requested user ID
every response assignment is a saved assignment for that user
permission calculation receives exactly one assignment ID at a time
inactive/expired assignments have permissions=[], menus=[], menuCount=0
system assignments have department=null
menuCount equals the recursive number of returned menu nodes
frontend GET path is /users/:id/access-summary
successful assignment update invalidates ACCESS_SUMMARY(id)
```

- [ ] **Step 5: Inspect repository state and diff hygiene**

Run in both repositories:

```powershell
git status --short
git diff --check HEAD~1 HEAD
```

Expected: no uncommitted feature files and no whitespace errors. Preserve all unrelated user changes if any appear.

- [ ] **Step 6: Make a verification-fix commit only when necessary**

If a feature-caused verification failure required a correction, stage only the corrected feature files and commit in the affected repository:

```powershell
git commit -m "fix: verify user menu access summary"
```

If no corrections were required, do not create an empty commit.
