# Department Selection Login Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete multi-assignment login without a 401 and bind the returned session, permissions, menus, and selected context to the assignment chosen by the user.

**Architecture:** The NestJS authentication response will expose the selected `currentDepartmentRole` and resolve effective permissions with that assignment ID. The Next.js client will type that response explicitly and store the complete session directly, eliminating the unauthenticated `/auth/me` request between selection and token storage.

**Tech Stack:** NestJS, TypeORM, Jest, Next.js, React Query, Zustand, Vitest, TypeScript.

## Global Constraints

- Work in the existing frontend workspace `C:\Users\USER\Desktop\minimax`; do not create a Git worktree.
- Backend repository is `D:\project-cps\cps-api`.
- Preserve invalid/expired selection-token and invalid-assignment `401` behavior.
- Do not store partial authentication state when selection fails.
- Do not redesign department switching or token lifetime configuration.
- Use the selected assignment ID for effective permission resolution.

---

### Task 1: Return assignment-scoped authentication context

**Files:**
- Modify: `D:\project-cps\cps-api\src\modules\auth\auth.service.ts`
- Test: `D:\project-cps\cps-api\src\modules\auth\auth.service.permissions.spec.ts`

**Interfaces:**
- Consumes: `UserDepartmentRole | null` already passed to `AuthService.buildAuthenticationResponse`.
- Produces: response `data.currentDepartmentRole` and contextual fields in `data.accessControl`.
- Produces: `EffectivePermissionService.getEffectivePermissionCodes(userId, assignmentId, isSuperAdmin)` invocation.

- [ ] **Step 1: Add a failing backend response test**

Extend `auth.service.permissions.spec.ts` with a service harness that invokes the existing private response builder through a narrow test type:

```ts
it('builds authentication for the selected assignment only', async () => {
  const assignment = {
    id: '76',
    userId: '46',
    departmentId: '2',
    roleId: '3',
    isActive: true,
    assignedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    department: { id: '2', code: 'OPS', nameTh: 'ฝ่ายปฏิบัติการ' },
    role: { id: '3', code: 'USER', nameTh: 'ผู้ใช้งาน' },
  } as UserDepartmentRole;
  const user = {
    id: '46', username: 'page.render', firstName: 'Page', lastName: 'Render',
    email: 'page.render@test.local',
  } as User;
  const service = createAuthenticationResponseHarness([assignment]);

  const response = await service.buildAuthenticationResponse(
    user,
    assignment,
    'access-token',
    'refresh-token',
  );

  expect(
    service.effectivePermissionService.getEffectivePermissionCodes,
  ).toHaveBeenCalledWith('46', '76', false);
  expect(response.data.currentDepartmentRole).toMatchObject({
    id: '76',
    userId: '46',
    departmentId: '2',
    departmentCode: 'OPS',
    roleId: '3',
    roleCode: 'USER',
  });
  expect(response.data.accessControl).toMatchObject({
    userDepartmentRoleId: '76',
    departmentId: '2',
    roleId: '3',
  });
});
```

The harness must mock the assignment query builder, effective permission service,
menu loader, menu tree builder, and config lookup; it must not connect to a database.

- [ ] **Step 2: Run the backend test and verify RED**

Run:

```powershell
pnpm.cmd test --runInBand src/modules/auth/auth.service.permissions.spec.ts
```

Expected: FAIL because permission resolution receives `undefined` and the response has no `currentDepartmentRole`.

- [ ] **Step 3: Implement selected-assignment response mapping**

In `buildAuthenticationResponse`, resolve permissions with the selected assignment:

```ts
const permissionCodes =
  await this.effectivePermissionService.getEffectivePermissionCodes(
    user.id,
    assignment?.id,
    isSuperAdmin,
  );
```

Create the response context once:

```ts
const currentDepartmentRole = assignment
  ? {
      id: assignment.id,
      userId: assignment.userId,
      departmentId: assignment.departmentId,
      departmentName: assignment.department?.nameTh ?? null,
      departmentCode: assignment.department?.code ?? null,
      roleId: assignment.roleId,
      roleName: assignment.role.nameTh,
      roleCode: assignment.role.code,
      isPrimary: false,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    }
  : null;
```

Add it and its identifiers to the returned `data`:

```ts
currentDepartmentRole,
accessControl: {
  menus: menuTree,
  permissions: permissionCodes,
  userDepartmentRoleId: assignment?.id ?? null,
  departmentId: assignment?.departmentId ?? null,
  roleId: assignment?.roleId ?? null,
},
```

- [ ] **Step 4: Run focused backend tests and verify GREEN**

Run:

```powershell
pnpm.cmd test --runInBand src/modules/auth/auth.service.permissions.spec.ts src/modules/auth/strategies/jwt.strategy.spec.ts
```

Expected: PASS; permissions and token validation use the same assignment context.

- [ ] **Step 5: Commit the backend contract**

```powershell
git add src/modules/auth/auth.service.ts src/modules/auth/auth.service.permissions.spec.ts
git commit -m "fix: scope selected department login response"
```

---

### Task 2: Type and build a selected-department session

**Files:**
- Modify: `C:\Users\USER\Desktop\minimax\src\types\auth.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\stores\auth-store.ts`
- Test: `C:\Users\USER\Desktop\minimax\src\stores\auth-store.test.ts`

**Interfaces:**
- Produces: `AuthenticationSuccessResponse` shared by one-step login and department selection.
- Produces: `SelectDepartmentResponse.currentDepartmentRole: UserDepartmentRole`.
- Produces: `buildAuthSessionFromDepartmentSelection(response): AuthSession`.

- [ ] **Step 1: Add a failing session-builder test**

Add to `auth-store.test.ts`:

```ts
it('builds a session from the selected department response', () => {
  const response: SelectDepartmentResponse = {
    authentication: {
      accessToken: 'selected-access',
      refreshToken: 'selected-refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
    },
    user: testUser,
    currentDepartmentRole: testDepartmentRole,
    accessControl: {
      menus: [],
      permissions: ['ticket.read'],
      userDepartmentRoleId: testDepartmentRole.id,
      departmentId: testDepartmentRole.departmentId ?? undefined,
      roleId: testDepartmentRole.roleId,
    },
  };

  expect(buildAuthSessionFromDepartmentSelection(response)).toMatchObject({
    user: testUser,
    currentDepartmentRole: testDepartmentRole,
    accessToken: 'selected-access',
    refreshToken: 'selected-refresh',
    accessControl: response.accessControl,
  });
});
```

- [ ] **Step 2: Run the store test and verify RED**

Run:

```powershell
npx.cmd vitest run src/stores/auth-store.test.ts --reporter=verbose
```

Expected: FAIL because `SelectDepartmentResponse` is still the legacy flat shape and the builder does not exist.

- [ ] **Step 3: Align auth response types and add the builder**

Define a shared success type in `auth.ts`:

```ts
export interface AuthenticationSuccessResponse {
  authentication: {
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: number | string;
  };
  user: User;
  accessControl: AccessControl;
  currentDepartmentRole?: UserDepartmentRole | null;
}

export type LoginResponse =
  | AuthenticationSuccessResponse
  | BackendLoginRequiresDepartmentSelection;

export interface SelectDepartmentResponse
  extends AuthenticationSuccessResponse {
  currentDepartmentRole: UserDepartmentRole;
}
```

Add to `auth-store.ts`:

```ts
export const buildAuthSessionFromDepartmentSelection = (
  response: SelectDepartmentResponse,
): AuthSession => ({
  user: response.user,
  currentDepartmentRole: response.currentDepartmentRole,
  accessControl: response.accessControl,
  accessToken: response.authentication.accessToken,
  refreshToken: response.authentication.refreshToken,
  expiresAt:
    Date.now() + parseExpiresInMs(response.authentication.expiresIn),
});
```

- [ ] **Step 4: Run store tests and type-check**

Run:

```powershell
npx.cmd vitest run src/stores/auth-store.test.ts --reporter=verbose
npm.cmd run type-check
```

Expected: PASS.

- [ ] **Step 5: Commit frontend response typing**

```powershell
git add src/types/auth.ts src/stores/auth-store.ts src/stores/auth-store.test.ts
git commit -m "fix: model selected department sessions"
```

---

### Task 3: Store the selection response without `/auth/me`

**Files:**
- Modify: `C:\Users\USER\Desktop\minimax\src\features\auth\hooks\use-auth.ts`
- Create: `C:\Users\USER\Desktop\minimax\src\features\auth\hooks\use-auth.test.tsx`

**Interfaces:**
- Consumes: `buildAuthSessionFromDepartmentSelection(response)` from Task 2.
- Changes: `useSelectDepartment` performs one API request and then `setSession`.

- [ ] **Step 1: Write the failing hook regression test**

Create a React Query wrapper and mock `authApi`, `next/navigation`, and toast.
The success test must execute the real mutation hook:

```tsx
it('stores the selected session without calling auth me', async () => {
  vi.mocked(authApi.selectDepartment).mockResolvedValue(selectionResponse);
  const { result } = renderHook(() => useSelectDepartment(), { wrapper });

  await act(async () => {
    await result.current.mutateAsync({
      departmentSelectionToken: 'selection-token',
      userDepartmentRoleId: '76',
    });
  });

  await waitFor(() => {
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
  expect(authApi.me).not.toHaveBeenCalled();
  expect(useAuthStore.getState().accessToken).toBe('selected-access');
  expect(useAuthStore.getState().currentDepartmentRole?.id).toBe('76');
  expect(routerPush).toHaveBeenCalledWith('/dashboard');
});
```

Add a failure case:

```tsx
it('does not create a session when department selection fails', async () => {
  useAuthStore.getState().setPendingSelection({
    mode: 'select',
    departmentSelectionToken: 'expired-token',
    options: [],
  });
  vi.mocked(authApi.selectDepartment).mockRejectedValue(
    new ApiClientError('Unauthorized', { status: 401, code: 'HTTP_401' }),
  );
  const { result } = renderHook(() => useSelectDepartment(), { wrapper });

  await expect(
    result.current.mutateAsync({
      departmentSelectionToken: 'expired-token',
      userDepartmentRoleId: '76',
    }),
  ).rejects.toMatchObject({ status: 401 });
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
  expect(useAuthStore.getState().pendingSelection?.mode).toBe('select');
});
```

- [ ] **Step 2: Run the hook test and verify RED**

Run:

```powershell
npx.cmd vitest run src/features/auth/hooks/use-auth.test.tsx --reporter=verbose
```

Expected: FAIL because the current hook calls `authApi.me()` before `setSession`.

- [ ] **Step 3: Implement the direct session transition**

Replace the current async `onSuccess` body:

```ts
onSuccess: (response) => {
  const session = buildAuthSessionFromDepartmentSelection(response);
  setSession(session);
  showToast.success(
    'เลือกแผนกเรียบร้อย',
    `เข้าสู่ระบบในฐานะ ${response.currentDepartmentRole.roleName}`,
  );
  router.push('/dashboard');
},
```

Remove the obsolete `buildAuthSession` import if it has no remaining caller.
Do not clear `pendingSelection` in an error callback; `setSession` clears it only
after a successful selection.

- [ ] **Step 4: Run frontend focused tests and verify GREEN**

Run:

```powershell
npx.cmd vitest run src/features/auth/hooks/use-auth.test.tsx src/stores/auth-store.test.ts --reporter=verbose
npm.cmd run type-check
```

Expected: PASS with no unauthenticated `/auth/me` request.

- [ ] **Step 5: Commit the frontend login fix**

```powershell
git add src/features/auth/hooks/use-auth.ts src/features/auth/hooks/use-auth.test.tsx
git commit -m "fix: complete department selection login"
```

---

### Task 4: Verify both repositories

**Files:**
- No production file changes expected.

**Interfaces:**
- Verifies the shared `/auth/select-department` contract end to end at unit/integration boundaries.

- [ ] **Step 1: Run full backend verification**

From `D:\project-cps\cps-api`:

```powershell
pnpm.cmd test --runInBand
pnpm.cmd run build
git diff --check
git status --short
```

Expected: all Jest suites and Nest build pass; working tree contains no unintended changes.

- [ ] **Step 2: Run full frontend verification**

From `C:\Users\USER\Desktop\minimax`:

```powershell
npm.cmd test -- --maxWorkers=2 --no-file-parallelism
npm.cmd run type-check
npm.cmd run lint
npm.cmd run build
git diff --check
git status --short
```

Expected: all Vitest suites, TypeScript checking, and Next.js production build pass. Report existing lint warnings separately from new errors.

- [ ] **Step 3: Review the contract diff**

Backend:

```powershell
git diff HEAD~1..HEAD -- src/modules/auth
```

Frontend:

```powershell
git diff HEAD~2..HEAD -- src/types/auth.ts src/stores/auth-store.ts src/features/auth
```

Confirm that the selected assignment ID is identical in the JWT context,
permission resolver call, `currentDepartmentRole`, and frontend auth store.
