# User Assignment Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the edit-user screen stage and atomically save profile plus assignment changes, enforce assignment invariants in the UI, API, and database, and invalidate the affected user's existing sessions.

**Architecture:** The frontend submits the complete desired assignment set through the existing `PATCH /users/:id` request. The NestJS service validates and diffs that set inside one TypeORM transaction, preserves retained assignment IDs and direct permissions, increments `permissionVersion` when assignments change, and relies on strengthened JWT validation to reject stale sessions.

**Tech Stack:** Next.js 16, React 19, React Hook Form, Zod 4, TanStack Query 5, Vitest, Testing Library, NestJS 11, TypeORM 0.3, PostgreSQL, Jest

## Global Constraints

- Frontend repository: `C:\Users\USER\Desktop\minimax`.
- Backend repository: `D:\project-cps\cps-api`.
- Preserve unrelated working-tree changes, including the backend's untracked `src/database/create-department-permissions-table.ts`.
- A user must retain at least one assignment.
- Uniqueness is the normalized `(departmentId, roleId)` pair, not department alone.
- Different roles in the same department are allowed.
- Normal roles require a department; system roles require `departmentId = null`.
- Retained assignment IDs retain their direct permission records.
- The last active `SUPER_ADMIN` cannot be removed or demoted.
- Profile and assignment writes from the edit screen commit or roll back together.
- Assignment changes force the affected user to log in again.
- Keep existing individual assignment endpoints for backward compatibility.
- Follow red-green-refactor for every production behavior.

---

## File Map

### Backend

- Create `src/database/migrations/1700000000004-AddUserAssignmentUniqueness.ts` — diagnose existing duplicates and add reversible database uniqueness enforcement.
- Create `src/database/migrations/1700000000004-AddUserAssignmentUniqueness.spec.ts` — verify migration SQL and rollback SQL.
- Modify `src/entities/iam/user-department-role.entity.ts` — type nullable system departments accurately.
- Modify `src/modules/users/dto/update-user.dto.ts` — define aggregate assignment input and nested validation.
- Create `src/modules/users/dto/update-user.dto.spec.ts` — exercise structural DTO validation.
- Modify `src/modules/users/users.service.ts` — perform aggregate validation, diff, atomic writes, permission-version increment, and final-super-admin protection.
- Modify `src/modules/users/users.service.spec.ts` — prove transaction, rollback-facing behavior, uniqueness, system roles, retained permissions, and permission-version behavior.
- Modify `src/modules/auth/strategies/jwt.strategy.ts` — validate current user, session, token version, and active assignment on every request.
- Create `src/modules/auth/strategies/jwt.strategy.spec.ts` — prove valid and stale session behavior.
- Modify `API_ENDPOINTS.md` — document the expanded `PATCH /users/:id` contract.

### Frontend

- Modify `src/types/auth.ts` — allow nullable system departments and expose assignment role scope.
- Modify `src/features/users/schemas/user-schema.ts` — define edit assignment form rows and aggregate validation.
- Modify `src/features/users/schemas/user-schema.test.ts` — cover minimum count, duplicate pairs, and system/department rules.
- Modify `src/features/users/api/users-api.ts` — send the aggregate update payload.
- Modify `src/features/users/hooks/use-users.ts` — invalidate all affected caches without per-row mutations.
- Create `src/features/users/components/edit-user-assignments.tsx` — render staged assignment rows and deletion confirmation.
- Create `src/features/users/components/edit-user-assignments.test.tsx` — exercise row editing and confirmation behavior.
- Modify `src/features/users/components/user-form-dialog.tsx` — use one edit form and one aggregate save.
- Create `src/features/users/components/user-form-dialog.test.tsx` — verify loading, payload, error retention, and self-logout behavior.
- Modify `src/mocks/handlers/users.ts` — support aggregate assignment updates in mock mode.
- Create `src/mocks/handlers/users.test.ts` — prove mock validation is atomic and mirrors the API contract.
- Modify `API_ENDPOINTS.md` — mirror the aggregate contract.

---

### Task 1: Add Database Assignment Uniqueness

**Files:**
- Create: `D:\project-cps\cps-api\src\database\migrations\1700000000004-AddUserAssignmentUniqueness.spec.ts`
- Create: `D:\project-cps\cps-api\src\database\migrations\1700000000004-AddUserAssignmentUniqueness.ts`
- Modify: `D:\project-cps\cps-api\src\entities\iam\user-department-role.entity.ts`

**Interfaces:**
- Produces: PostgreSQL constraint `uq_user_department_roles_user_department_role`.
- Produces: PostgreSQL partial index `uq_user_department_roles_user_system_role`.
- Consumes: `iam.user_department_roles(user_id, department_id, role_id)`.

- [ ] **Step 1: Write the failing migration test**

```ts
import { AddUserAssignmentUniqueness1700000000004 } from './1700000000004-AddUserAssignmentUniqueness';

describe('AddUserAssignmentUniqueness1700000000004', () => {
  it('checks duplicates and adds normal and system uniqueness', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddUserAssignmentUniqueness1700000000004();

    await migration.up({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('Duplicate user assignment pairs exist');
    expect(sql).toContain('uq_user_department_roles_user_department_role');
    expect(sql).toContain('DEFERRABLE INITIALLY DEFERRED');
    expect(sql).toContain('uq_user_department_roles_user_system_role');
    expect(sql).toContain('WHERE department_id IS NULL');
  });

  it('drops both uniqueness rules on rollback', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddUserAssignmentUniqueness1700000000004();

    await migration.down({ query } as never);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DROP INDEX IF EXISTS iam.uq_user_department_roles_user_system_role');
    expect(sql).toContain('DROP CONSTRAINT IF EXISTS uq_user_department_roles_user_department_role');
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm test -- --runInBand src/database/migrations/1700000000004-AddUserAssignmentUniqueness.spec.ts
```

Expected: FAIL because the migration class does not exist.

- [ ] **Step 3: Implement the migration**

Use a diagnostic block before adding constraints:

```ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAssignmentUniqueness1700000000004
  implements MigrationInterface
{
  name = 'AddUserAssignmentUniqueness1700000000004';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM iam.user_department_roles
          GROUP BY user_id, department_id, role_id
          HAVING COUNT(*) > 1
        ) THEN
          RAISE EXCEPTION 'Duplicate user assignment pairs exist; resolve them before migration';
        END IF;
      END $$;
    `);
    await queryRunner.query(`
      ALTER TABLE iam.user_department_roles
      ADD CONSTRAINT uq_user_department_roles_user_department_role
      UNIQUE (user_id, department_id, role_id)
      DEFERRABLE INITIALLY DEFERRED
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_user_department_roles_user_system_role
      ON iam.user_department_roles (user_id, role_id)
      WHERE department_id IS NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS iam.uq_user_department_roles_user_system_role
    `);
    await queryRunner.query(`
      ALTER TABLE iam.user_department_roles
      DROP CONSTRAINT IF EXISTS uq_user_department_roles_user_department_role
    `);
  }
}
```

- [ ] **Step 4: Align the entity's nullable TypeScript fields**

The database column is already nullable. Update only its TypeScript shape and
relation shape:

```ts
@Column({ name: 'department_id', type: 'bigint', nullable: true })
departmentId: string | null;

@ManyToOne(() => Department, { nullable: true })
@JoinColumn({ name: 'department_id' })
department: Department | null;
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```powershell
pnpm test -- --runInBand src/database/migrations/1700000000004-AddUserAssignmentUniqueness.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the backend migration**

```powershell
git add src/database/migrations/1700000000004-AddUserAssignmentUniqueness.ts src/database/migrations/1700000000004-AddUserAssignmentUniqueness.spec.ts src/entities/iam/user-department-role.entity.ts
git commit -m "feat: enforce unique user assignments"
```

---

### Task 2: Define the Aggregate Backend DTO

**Files:**
- Create: `D:\project-cps\cps-api\src\modules\users\dto\update-user.dto.spec.ts`
- Modify: `D:\project-cps\cps-api\src\modules\users\dto\update-user.dto.ts`

**Interfaces:**
- Produces: `UpdateUserAssignmentInputDto`.
- Produces: `UpdateUserDto.assignments?: UpdateUserAssignmentInputDto[]`.
- Consumes: existing optional profile fields.

- [ ] **Step 1: Write failing DTO validation tests**

```ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('accepts retained, new, and system assignments', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      firstName: 'Somchai',
      assignments: [
        { id: '10', departmentId: '3', roleId: '4' },
        { departmentId: '3', roleId: '5' },
        { id: '20', departmentId: null, roleId: '1' },
      ],
    });
    expect(await validate(dto)).toEqual([]);
  });

  it('rejects an included empty assignment array', async () => {
    const dto = plainToInstance(UpdateUserDto, { assignments: [] });
    expect(await validate(dto)).not.toEqual([]);
  });

  it('rejects an assignment without a role', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      assignments: [{ departmentId: '3' }],
    });
    expect(await validate(dto)).not.toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm test -- --runInBand src/modules/users/dto/update-user.dto.spec.ts
```

Expected: FAIL because `assignments` has no nested DTO validation.

- [ ] **Step 3: Implement the nested DTO**

```ts
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class UpdateUserAssignmentInputDto {
  @IsString()
  @IsOptional()
  id?: string;

  @ValidateIf((_object, value) => value !== null)
  @IsString()
  departmentId: string | null;

  @IsString()
  @IsNotEmpty()
  roleId: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  telephone?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserAssignmentInputDto)
  @IsOptional()
  assignments?: UpdateUserAssignmentInputDto[];
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
pnpm test -- --runInBand src/modules/users/dto/update-user.dto.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the DTO**

```powershell
git add src/modules/users/dto/update-user.dto.ts src/modules/users/dto/update-user.dto.spec.ts
git commit -m "feat: accept aggregate user assignments"
```

---

### Task 3: Implement the Atomic Backend Update

**Files:**
- Modify: `D:\project-cps\cps-api\src\modules\users\users.service.spec.ts`
- Modify: `D:\project-cps\cps-api\src\modules\users\users.service.ts`

**Interfaces:**
- Consumes: `UpdateUserDto.assignments`.
- Produces: `UsersService.update(id, dto): Promise<User>`.
- Preserves: direct permissions for retained assignment IDs.
- Mutates: `User.permissionVersion` only when the normalized assignment set changes.

- [ ] **Step 1: Extend the repository test harness**

Add `Department`, `Role`, and transaction-bound repositories to the existing
stub manager:

```ts
import { Department } from '../../entities/iam/department.entity';
import { Role } from '../../entities/iam/role.entity';

const departments = repositoryStub<Department>();
const roles = repositoryStub<Role>();

const manager = {
  getRepository: (entity: unknown) => {
    if (entity === User) return users;
    if (entity === UserDepartmentRole) return assignments;
    if (entity === UserDepartmentPermission) return assignmentPermissions;
    if (entity === Department) return departments;
    if (entity === Role) return roles;
    throw new Error('Unexpected repository');
  },
};
```

- [ ] **Step 2: Write the failing atomic diff test**

```ts
it('updates profile and creates, updates, and deletes assignments in one transaction', async () => {
  const user = { id: '7', email: 'old@example.com', permissionVersion: 4 } as User;
  const current = [
    { id: '10', userId: '7', departmentId: '2', roleId: '4', isActive: true },
    { id: '11', userId: '7', departmentId: '2', roleId: '6', isActive: true },
  ] as UserDepartmentRole[];

  users.findOne!.mockResolvedValue(user);
  users.save!.mockImplementation(async (value: User) => value);
  assignments.find!.mockResolvedValue(current);
  assignments.save!.mockImplementation(async (value: UserDepartmentRole) => value);
  assignments.create!.mockImplementation((value: UserDepartmentRole) => value);
  assignments.delete!.mockResolvedValue({ affected: 1 });
  roles.find!.mockResolvedValue([
    { id: '5', code: 'APPROVER', scopeType: 'DEPARTMENT', isActive: true },
    { id: '8', code: 'AUDITOR', scopeType: 'DEPARTMENT', isActive: true },
  ]);
  departments.find!.mockResolvedValue([
    { id: '3', code: 'PROD', isActive: true },
  ]);
  const transaction = jest.fn(async (callback) => callback(manager));
  (users as { manager?: { transaction: jest.Mock } }).manager = { transaction };
  jest.spyOn(service, 'findOne').mockResolvedValue(user);

  await service.update('7', {
    email: 'new@example.com',
    assignments: [
      { id: '10', departmentId: '3', roleId: '5' },
      { departmentId: '3', roleId: '8' },
    ],
  });

  expect(transaction).toHaveBeenCalledTimes(1);
  expect(assignments.delete).toHaveBeenCalledWith({ id: expect.anything(), userId: '7' });
  expect(assignmentPermissions.delete).not.toHaveBeenCalledWith({
    userDepartmentRoleId: '10',
  });
  expect(user.permissionVersion).toBe(5);
  expect(user.email).toBe('new@example.com');
});
```

- [ ] **Step 3: Run the atomic diff test and verify RED**

Run:

```powershell
pnpm test -- --runInBand src/modules/users/users.service.spec.ts
```

Expected: FAIL because `update` does not process assignments in its transaction.

- [ ] **Step 4: Implement normalization and diff helpers**

Add focused private helpers with these exact contracts:

```ts
private assignmentKey(departmentId: string | null, roleId: string): string {
  return `${departmentId ?? 'SYSTEM'}:${roleId}`;
}

private assignmentsChanged(
  current: UserDepartmentRole[],
  requested: UpdateUserAssignmentInputDto[],
): boolean {
  const currentKeys = current
    .map((item) => `${item.id}:${this.assignmentKey(item.departmentId, item.roleId)}`)
    .sort();
  const requestedKeys = requested
    .map((item) => `${item.id ?? 'NEW'}:${this.assignmentKey(item.departmentId, item.roleId)}`)
    .sort();
  return currentKeys.length !== requestedKeys.length ||
    currentKeys.some((key, index) => key !== requestedKeys[index]);
}
```

Import `Department`, `Role`, `EntityManager`, and
`UpdateUserAssignmentInputDto`. Keep validation reads and all writes on
repositories obtained from the transaction's `EntityManager`.

- [ ] **Step 5: Implement aggregate validation inside the transaction**

The validation block must:

```ts
if (requested.length === 0) {
  throw new BadRequestException('User must have at least one assignment');
}

const keys = requested.map((item) =>
  this.assignmentKey(item.departmentId, item.roleId),
);
if (new Set(keys).size !== keys.length) {
  throw new BadRequestException('Duplicate department and role assignment');
}

const currentById = new Map(current.map((item) => [item.id, item]));
for (const item of requested) {
  if (item.id && !currentById.has(item.id)) {
    throw new NotFoundException('User assignment not found');
  }
}
```

Load all referenced roles and departments in sets. Reject missing or inactive
records. Enforce:

```ts
if (role.scopeType === 'SYSTEM' && item.departmentId !== null) {
  throw new BadRequestException('System role must not have a department');
}
if (role.scopeType !== 'SYSTEM' && item.departmentId === null) {
  throw new BadRequestException('Department role requires a department');
}
```

- [ ] **Step 6: Implement the transaction-bound writes**

For `assignments !== undefined`, replace the current `update` flow with:

```ts
await this.userRepository.manager.transaction(async (manager) => {
  const userRepository = manager.getRepository(User);
  const assignmentRepository = manager.getRepository(UserDepartmentRole);

  const user = await userRepository.findOne({
    where: { id },
    lock: { mode: 'pessimistic_write' },
  });
  if (!user) throw new NotFoundException('User not found');

  const current = await assignmentRepository.find({ where: { userId: id } });
  await this.validateAggregateAssignments(manager, id, current, assignments);
  await this.assertFinalSuperAdminState(manager, id, current, assignments);

  const changed = this.assignmentsChanged(current, assignments);
  Object.assign(user, profileData);
  if (user.email) user.email = user.email.toLowerCase();
  if (changed) user.permissionVersion += 1;
  await userRepository.save(user);

  const requestedIds = new Set(
    assignments.flatMap((item) => (item.id ? [item.id] : [])),
  );
  for (const existing of current) {
    if (!requestedIds.has(existing.id)) {
      await assignmentRepository.delete({ id: existing.id, userId: id });
    }
  }
  for (const item of assignments) {
    if (item.id) {
      const existing = current.find((candidate) => candidate.id === item.id)!;
      existing.departmentId = item.departmentId;
      existing.roleId = item.roleId;
      await assignmentRepository.save(existing);
    } else {
      await assignmentRepository.save(assignmentRepository.create({
        userId: id,
        departmentId: item.departmentId,
        roleId: item.roleId,
        isActive: true,
        assignedAt: new Date(),
      }));
    }
  }
});
```

Delete direct permissions explicitly before a removed assignment only if the
deployed foreign key does not cascade. Never delete permissions for a retained
ID.

- [ ] **Step 7: Write and run the remaining RED/GREEN service cases**

Add one test at a time, run the focused file after each RED, then implement the
minimum branch needed:

```ts
it.each([
  ['empty set', []],
  ['duplicate pair', [
    { departmentId: '3', roleId: '5' },
    { departmentId: '3', roleId: '5' },
  ]],
])('rejects %s', async (_label, requested) => {
  await expect(service.update('7', { assignments: requested }))
    .rejects.toBeInstanceOf(BadRequestException);
});

it('allows different roles in the same department', async () => {
  await expect(service.update('7', {
    assignments: [
      { departmentId: '3', roleId: '5' },
      { departmentId: '3', roleId: '8' },
    ],
  })).resolves.toBeDefined();
});

it('requires null department for a system role', async () => {
  await expect(service.update('7', {
    assignments: [{ departmentId: '3', roleId: '1' }],
  })).rejects.toBeInstanceOf(BadRequestException);
});

it('does not increment permissionVersion for profile-only or unchanged assignment updates', async () => {
  await service.update('7', {
    firstName: 'Updated',
    assignments: [{ id: '10', departmentId: '3', roleId: '5' }],
  });
  expect(user.permissionVersion).toBe(4);
});
```

Add cases for foreign assignment IDs, inactive/missing role and department,
retained direct permissions, rollback propagation, and final-super-admin
removal. Refactor `assertAssignmentCanStopBeingSuperAdmin` so the aggregate
path's `assertFinalSuperAdminState(manager, ...)` locks active super-admin rows
with `pessimistic_write` and evaluates the submitted final state.

- [ ] **Step 8: Run the backend user tests**

Run:

```powershell
pnpm test -- --runInBand src/modules/users/users.service.spec.ts src/modules/users/dto/update-user.dto.spec.ts
```

Expected: PASS with no warnings.

- [ ] **Step 9: Commit the atomic service**

```powershell
git add src/modules/users/users.service.ts src/modules/users/users.service.spec.ts
git commit -m "feat: atomically update user assignments"
```

---

### Task 4: Reject Stale Access Tokens

**Files:**
- Create: `D:\project-cps\cps-api\src\modules\auth\strategies\jwt.strategy.spec.ts`
- Modify: `D:\project-cps\cps-api\src\modules\auth\strategies\jwt.strategy.ts`

**Interfaces:**
- Consumes: `JwtPayload`.
- Produces: current `CurrentUserWithAssignment` only for a live user/session/version/assignment combination.
- Throws: `UnauthorizedException` for stale authentication.

- [ ] **Step 1: Write the failing valid-session test**

```ts
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AuthSession } from '../../../entities/iam/auth-session.entity';
import { User } from '../../../entities/iam/user.entity';
import { UserDepartmentRole } from '../../../entities/iam/user-department-role.entity';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
  const users = { findOne: jest.fn() };
  const sessions = { findOne: jest.fn() };
  const assignments = { findOne: jest.fn() };
  const payload = {
    sub: '7',
    sessionId: '9',
    userDepartmentRoleId: '10',
    departmentId: '3',
    roleCode: 'MANAGER',
    permissionVersion: 4,
  };

  const strategy = new JwtStrategy(
    config,
    users as unknown as Repository<User>,
    sessions as unknown as Repository<AuthSession>,
    assignments as unknown as Repository<UserDepartmentRole>,
  );

  it('returns current context for a live matching session', async () => {
    users.findOne.mockResolvedValue({
      id: '7', isActive: true, isLocked: false, permissionVersion: 4,
    });
    sessions.findOne.mockResolvedValue({
      id: '9', userId: '7', revokedAt: null, expiresAt: new Date(Date.now() + 60_000),
    });
    assignments.findOne.mockResolvedValue({
      id: '10', userId: '7', departmentId: '3', role: { code: 'MANAGER' },
    });

    await expect(strategy.validate(payload as never)).resolves.toMatchObject({
      id: '7',
      sessionId: '9',
      activeUserDepartmentRoleId: '10',
      permissionVersion: 4,
    });
  });
});
```

- [ ] **Step 2: Run the strategy test and verify RED**

Run:

```powershell
pnpm test -- --runInBand src/modules/auth/strategies/jwt.strategy.spec.ts
```

Expected: FAIL because `JwtStrategy` does not accept repositories or query
current state.

- [ ] **Step 3: Implement current-state validation**

Inject the three repositories:

```ts
constructor(
  configService: ConfigService,
  @InjectRepository(User) private readonly userRepository: Repository<User>,
  @InjectRepository(AuthSession)
  private readonly sessionRepository: Repository<AuthSession>,
  @InjectRepository(UserDepartmentRole)
  private readonly assignmentRepository: Repository<UserDepartmentRole>,
) { /* existing Passport strategy options */ }
```

In `validate`, load and check:

```ts
const [user, session] = await Promise.all([
  this.userRepository.findOne({ where: { id: payload.sub } }),
  this.sessionRepository.findOne({
    where: { id: payload.sessionId, userId: payload.sub },
  }),
]);

if (
  !user ||
  !user.isActive ||
  user.isLocked ||
  user.permissionVersion !== payload.permissionVersion ||
  !session ||
  session.revokedAt ||
  session.expiresAt <= new Date()
) {
  throw new UnauthorizedException('Session is no longer valid');
}
```

If `payload.userDepartmentRoleId` is non-null, load that assignment with its
role and reject it when missing, inactive, expired, owned by another user, or
its department/role no longer matches the payload. Build the returned active
department and role context from the current assignment, not stale payload
fields.

- [ ] **Step 4: Add failing cases one at a time and make each GREEN**

```ts
it.each([
  ['permission version changed', { userVersion: 5 }],
  ['session revoked', { revokedAt: new Date() }],
  ['session expired', { expiresAt: new Date(Date.now() - 1) }],
  ['user inactive', { isActive: false }],
  ['user locked', { isLocked: true }],
  ['assignment removed', { assignment: null }],
])('rejects when %s', async (_label, override) => {
  // Arrange the corresponding repository result from override.
  await expect(strategy.validate(payload as never))
    .rejects.toBeInstanceOf(UnauthorizedException);
});
```

Run the focused test after every new case.

- [ ] **Step 5: Run auth and user regression tests**

Run:

```powershell
pnpm test -- --runInBand src/modules/auth/strategies/jwt.strategy.spec.ts src/modules/users/users.service.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit JWT invalidation**

```powershell
git add src/modules/auth/strategies/jwt.strategy.ts src/modules/auth/strategies/jwt.strategy.spec.ts
git commit -m "fix: reject stale assignment sessions"
```

---

### Task 5: Define the Frontend Aggregate Form Schema

**Files:**
- Modify: `C:\Users\USER\Desktop\minimax\src\types\auth.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\schemas\user-schema.test.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\schemas\user-schema.ts`

**Interfaces:**
- Produces: `EditUserAssignmentValues`.
- Produces: `UpdateUserFormValues.assignments`.
- Changes: `UserAssignment.departmentId` to `string | null`.
- Changes: assignment role reference to include `scopeType`.

- [ ] **Step 1: Write failing aggregate schema tests**

Replace the obsolete test that says assignments are managed separately:

```ts
const validUpdate = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  telephone: '0812345678',
  assignments: [
    {
      id: '10',
      departmentId: 'dept-1',
      roleId: 'role-1',
      roleScopeType: 'DEPARTMENT' as const,
    },
  ],
};

it('requires at least one edit assignment', () => {
  expect(updateUserSchema.safeParse({
    ...validUpdate,
    assignments: [],
  }).success).toBe(false);
});

it('rejects duplicate department and role pairs', () => {
  expect(updateUserSchema.safeParse({
    ...validUpdate,
    assignments: [
      validUpdate.assignments[0],
      { ...validUpdate.assignments[0], id: '11' },
    ],
  }).success).toBe(false);
});

it('allows different roles in the same department', () => {
  expect(updateUserSchema.safeParse({
    ...validUpdate,
    assignments: [
      validUpdate.assignments[0],
      { departmentId: 'dept-1', roleId: 'role-2', roleScopeType: 'DEPARTMENT' },
    ],
  }).success).toBe(true);
});

it('requires null department for a system role', () => {
  expect(updateUserSchema.safeParse({
    ...validUpdate,
    assignments: [
      { departmentId: 'dept-1', roleId: 'super', roleScopeType: 'SYSTEM' },
    ],
  }).success).toBe(false);
  expect(updateUserSchema.safeParse({
    ...validUpdate,
    assignments: [
      { departmentId: null, roleId: 'super', roleScopeType: 'SYSTEM' },
    ],
  }).success).toBe(true);
});
```

- [ ] **Step 2: Run schema tests and verify RED**

Run:

```powershell
pnpm test -- src/features/users/schemas/user-schema.test.ts
```

Expected: FAIL because `updateUserSchema` has no assignments.

- [ ] **Step 3: Implement edit assignment validation**

```ts
export const editUserAssignmentSchema = z
  .object({
    id: z.string().optional(),
    departmentId: z.string().min(1).nullable(),
    roleId: z.string().min(1, 'กรุณาเลือกบทบาท'),
    roleScopeType: z.enum(['SYSTEM', 'DEPARTMENT']),
  })
  .superRefine((assignment, ctx) => {
    if (assignment.roleScopeType === 'SYSTEM' && assignment.departmentId !== null) {
      ctx.addIssue({
        code: 'custom',
        path: ['departmentId'],
        message: 'System Role ต้องใช้ทุกแผนก',
      });
    }
    if (assignment.roleScopeType === 'DEPARTMENT' && !assignment.departmentId) {
      ctx.addIssue({
        code: 'custom',
        path: ['departmentId'],
        message: 'กรุณาเลือกแผนก',
      });
    }
  });
```

Add `assignments: z.array(editUserAssignmentSchema).min(1, ...)` to
`updateUserSchema`, then add a schema-level uniqueness refinement using
`${departmentId ?? 'SYSTEM'}:${roleId}` and attach duplicate issues to both
affected rows.

Update the type:

```ts
export interface UserAssignment {
  // existing fields
  departmentId: string | null;
  department?: UserDepartment | null;
  role?: UserRole & {
    nameTh?: string;
    nameEn?: string;
    scopeType?: 'SYSTEM' | 'DEPARTMENT';
  };
}

export interface UserDepartmentRole extends BaseEntity {
  // existing fields
  departmentId: string | null;
  departmentName: string;
  departmentCode: string;
}
```

- [ ] **Step 4: Run schema tests and verify GREEN**

Run:

```powershell
pnpm test -- src/features/users/schemas/user-schema.test.ts
pnpm type-check
```

Expected: schema tests PASS; type-check may expose downstream nullable
department call sites, which must be narrowed rather than cast.

- [ ] **Step 5: Commit frontend schema and types**

```powershell
git add src/types/auth.ts src/features/users/schemas/user-schema.ts src/features/users/schemas/user-schema.test.ts
git commit -m "feat: validate editable user assignments"
```

---

### Task 6: Send One Aggregate Frontend Mutation

**Files:**
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\api\users-api.ts`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\hooks\use-users.ts`
- Create: `C:\Users\USER\Desktop\minimax\src\features\users\api\users-api.test.ts`
- Create: `C:\Users\USER\Desktop\minimax\src\features\users\hooks\use-users.test.tsx`

**Interfaces:**
- Produces: `UpdateUserAssignmentPayload`.
- Changes: `UpdateUserPayload.assignments`.
- Preserves: `usersApi.update(id, data)` route and method.

- [ ] **Step 1: Write the failing API payload test**

```ts
import { beforeEach, expect, it, vi } from 'vitest';
import { apiClient } from '@/services/api-client';
import { usersApi } from './users-api';

vi.mock('@/services/api-client', () => ({
  apiClient: { patch: vi.fn() },
}));

it('patches profile and complete assignment state in one request', async () => {
  const payload = {
    firstName: 'Somchai',
    lastName: 'Jaidee',
    email: 'somchai@example.com',
    assignments: [
      { id: '10', departmentId: '3', roleId: '5' },
      { departmentId: null, roleId: '1' },
    ],
  };

  await usersApi.update('7', payload);

  expect(apiClient.patch).toHaveBeenCalledWith('/users/7', payload);
});
```

- [ ] **Step 2: Run the API test and verify RED**

Run:

```powershell
pnpm test -- src/features/users/api/users-api.test.ts
```

Expected: TypeScript/Vitest FAIL because `UpdateUserPayload` does not accept
assignments.

- [ ] **Step 3: Implement payload types**

```ts
export interface UpdateUserAssignmentPayload {
  id?: string;
  departmentId: string | null;
  roleId: string;
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
  assignments: UpdateUserAssignmentPayload[];
}
```

Keep `usersApi.update` as a single PATCH. Remove edit-screen dependence on
`useAddUserAssignment`; retain the exported individual mutation for
backward-compatible callers.

- [ ] **Step 4: Write the failing cache invalidation test**

Render `useUpdateUser` with a real `QueryClientProvider`, invoke the mutation
against a mocked `usersApi.update`, and assert invalidation keys:

```ts
expect(invalidateQueries).toHaveBeenCalledWith({
  queryKey: QUERY_KEYS.USERS.ALL,
});
expect(invalidateQueries).toHaveBeenCalledWith({
  queryKey: QUERY_KEYS.USERS.DETAIL('7'),
});
expect(invalidateQueries).toHaveBeenCalledWith({
  queryKey: [...QUERY_KEYS.USERS.ALL, 'assignments', '7'],
});
```

- [ ] **Step 5: Implement the missing assignment invalidation and verify GREEN**

Add the assignment query invalidation to `useUpdateUser.onSuccess`, then run:

```powershell
pnpm test -- src/features/users/api/users-api.test.ts src/features/users/hooks/use-users.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit the aggregate client**

```powershell
git add src/features/users/api/users-api.ts src/features/users/api/users-api.test.ts src/features/users/hooks/use-users.ts src/features/users/hooks/use-users.test.tsx
git commit -m "feat: save user assignments in one request"
```

---

### Task 7: Build the Staged Assignment Editor

**Files:**
- Create: `C:\Users\USER\Desktop\minimax\src\features\users\components\edit-user-assignments.test.tsx`
- Create: `C:\Users\USER\Desktop\minimax\src\features\users\components\edit-user-assignments.tsx`

**Interfaces:**
- Consumes: `UseFormReturn<UpdateUserFormValues>`, departments, roles, and loading state.
- Mutates: only React Hook Form's `assignments` field array.
- Produces: no network requests.

- [ ] **Step 1: Write the failing staged-add test**

Render the component inside a test form with one assignment. Select Add and
assert that a second row appears while mocked mutation functions remain
untouched:

```tsx
it('adds a local assignment row without calling an API', async () => {
  const user = userEvent.setup();
  render(<AssignmentEditorHarness initialAssignments={[normalAssignment]} />);

  await user.click(screen.getByRole('button', { name: 'เพิ่ม Assignment' }));

  expect(screen.getAllByTestId('assignment-row')).toHaveLength(2);
  expect(mockAddAssignment).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the component test and verify RED**

Run:

```powershell
pnpm test -- src/features/users/components/edit-user-assignments.test.tsx
```

Expected: FAIL because the staged editor does not exist.

- [ ] **Step 3: Implement the field-array shell**

Use `useFieldArray({ control: form.control, name: 'assignments' })` and render
each row with `data-testid="assignment-row"`. Add rows as:

```ts
append({
  departmentId: '',
  roleId: '',
  roleScopeType: 'DEPARTMENT',
});
```

When a role changes, find it in the role options and set all dependent fields:

```ts
form.setValue(`assignments.${index}.roleId`, role.id, { shouldValidate: true });
form.setValue(
  `assignments.${index}.roleScopeType`,
  role.scopeType === 'SYSTEM' ? 'SYSTEM' : 'DEPARTMENT',
  { shouldValidate: true },
);
if (role.scopeType === 'SYSTEM') {
  form.setValue(`assignments.${index}.departmentId`, null, {
    shouldValidate: true,
  });
}
```

Display a disabled “ทุกแผนก (System)” field for system roles and the normal
department selector otherwise.

- [ ] **Step 4: Write the failing deletion confirmation tests**

```tsx
it('does not remove a row until deletion is confirmed', async () => {
  const user = userEvent.setup();
  render(<AssignmentEditorHarness initialAssignments={[first, second]} />);

  await user.click(screen.getAllByRole('button', { name: /ลบ Assignment/ })[0]);
  expect(screen.getByText(/ยืนยันการลบ/)).toBeInTheDocument();
  expect(screen.getAllByTestId('assignment-row')).toHaveLength(2);

  await user.click(screen.getByRole('button', { name: 'ลบ' }));
  expect(screen.getAllByTestId('assignment-row')).toHaveLength(1);
});

it('disables deletion when only one assignment remains', () => {
  render(<AssignmentEditorHarness initialAssignments={[first]} />);
  expect(screen.getByRole('button', { name: /ลบ Assignment/ })).toBeDisabled();
  expect(screen.getByText(/อย่างน้อย 1 Assignment/)).toBeInTheDocument();
});
```

- [ ] **Step 5: Implement confirmation and row errors**

Use `ConfirmDialog` with a pending row index. Its description contains the
resolved department and role labels. Call `remove(pendingDeleteIndex)` only in
`onConfirm`; close without mutation on Cancel. Render row-level Zod errors below
the corresponding selectors and the array-level minimum/duplicate error above
the Add button.

- [ ] **Step 6: Add and pass system-role and duplicate-display tests**

Verify selecting a system role replaces the department selector with
“ทุกแผนก (System)” and duplicate rows show validation errors. Run:

```powershell
pnpm test -- src/features/users/components/edit-user-assignments.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit the staged editor**

```powershell
git add src/features/users/components/edit-user-assignments.tsx src/features/users/components/edit-user-assignments.test.tsx
git commit -m "feat: edit user assignments locally"
```

---

### Task 8: Integrate One Edit Form and Self-Logout

**Files:**
- Create: `C:\Users\USER\Desktop\minimax\src\features\users\components\user-form-dialog.test.tsx`
- Modify: `C:\Users\USER\Desktop\minimax\src\features\users\components\user-form-dialog.tsx`
- Modify: `C:\Users\USER\Desktop\minimax\src\mocks\handlers\users.ts`
- Create: `C:\Users\USER\Desktop\minimax\src\mocks\handlers\users.test.ts`

**Interfaces:**
- Consumes: `useUserAssignments`, role and department queries.
- Consumes: `EditUserAssignments`.
- Produces: one `useUpdateUser().mutateAsync` call.
- Side effect: self-assignment edits clear `useAuthStore` and navigate to `/login`.

- [ ] **Step 1: Write the failing hydration test**

Mock user assignments, departments, roles, and mutations. Open the edit dialog
and assert existing assignment values appear in the staged editor:

```tsx
it('hydrates the aggregate edit form from current assignments', async () => {
  render(<UserFormDialog open onOpenChange={vi.fn()} user={user} />);
  await screen.findByDisplayValue('ฝ่ายผลิต');
  expect(screen.getByDisplayValue('ผู้อนุมัติ')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the dialog test and verify RED**

Run:

```powershell
pnpm test -- src/features/users/components/user-form-dialog.test.tsx
```

Expected: FAIL because the current edit form keeps assignments outside its form
and cannot hydrate editable rows.

- [ ] **Step 3: Integrate the aggregate form**

Extend edit defaults:

```ts
{
  firstName: user?.firstName ?? '',
  lastName: user?.lastName ?? '',
  email: user?.email ?? '',
  telephone: user?.telephone ?? '',
  assignments: [],
}
```

When assignments and roles finish loading, reset once per opened user:

```ts
assignments: assignmentData.map((assignment) => ({
  id: assignment.id,
  departmentId: assignment.departmentId,
  roleId: assignment.roleId,
  roleScopeType:
    assignment.role?.scopeType === 'SYSTEM' || assignment.departmentId === null
      ? 'SYSTEM'
      : 'DEPARTMENT',
}))
```

Replace the current `AssignmentsTab` and immediate-add UI with
`EditUserAssignments`. Keep both tabs inside the same form and use the one
footer Save button.

- [ ] **Step 4: Write the failing single-payload test**

```tsx
it('sends one aggregate update after staged add, edit, and delete', async () => {
  // Stage the three operations through visible controls, then press Save.
  expect(updateMutateAsync).toHaveBeenCalledTimes(1);
  expect(updateMutateAsync).toHaveBeenCalledWith({
    id: '7',
    data: {
      firstName: 'Somchai',
      lastName: 'Jaidee',
      email: 'somchai@example.com',
      telephone: '0812345678',
      assignments: [
        { id: '10', departmentId: '3', roleId: '5' },
        { departmentId: null, roleId: '1' },
      ],
    },
  });
  expect(addAssignmentMutateAsync).not.toHaveBeenCalled();
});
```

- [ ] **Step 5: Implement payload mapping and failure retention**

Strip `roleScopeType` from each row:

```ts
assignments: values.assignments.map(({ roleScopeType: _scope, ...assignment }) =>
  assignment,
)
```

Do not reset or close in `catch`. Disable both tab controls and footer actions
while the aggregate mutation is pending.

- [ ] **Step 6: Write the failing self-logout test**

Set the auth store user ID to the edited user ID, submit changed assignments,
and assert:

```ts
expect(useAuthStore.getState().isAuthenticated).toBe(false);
expect(router.replace).toHaveBeenCalledWith('/login');
```

Add the paired case proving an administrator editing another user remains
authenticated.

- [ ] **Step 7: Implement self-logout after successful save**

Capture the current auth user ID before calling `logout`:

```ts
const editingSelf = useAuthStore.getState().user?.id === user.id;
const previousPermissionVersion = user.permissionVersion;
const updatedUser = await update.mutateAsync({ id: user.id, data: payload });
onOpenChange(false);
if (
  editingSelf &&
  updatedUser.permissionVersion !== previousPermissionVersion
) {
  useAuthStore.getState().logout();
  router.replace('/login');
}
```

This logs out a self-edit only when the backend confirms that the normalized
assignment set changed. A profile-only change or an unchanged assignment set
keeps the session active.

- [ ] **Step 8: Write the failing mock atomicity test**

Snapshot `mockDb.users` and `mockDb.userDepartmentRoles`, call
`setupUserMocks('/users/7', 'PATCH', ...)` with duplicate pairs, and assert a
400 response plus unchanged arrays. Add a success case that retains one ID,
removes one ID, creates one row, and increments `permissionVersion` exactly
once.

Run:

```powershell
pnpm test -- src/mocks/handlers/users.test.ts
```

Expected: FAIL because the mock PATCH handler ignores aggregate assignments.

- [ ] **Step 9: Update mock aggregate behavior**

Change the mock PATCH user handler to:

- reject an included empty assignment array;
- reject duplicate normalized pairs;
- update retained rows by ID;
- delete omitted rows;
- assign IDs to new rows;
- increment mock `permissionVersion` when the normalized set changes; and
- return an error without mutating mock data when validation fails.

Clone the affected mock arrays before validation and assign the completed
copies back to `mockDb` only after every check succeeds. Include `scopeType` in
the role object returned by the mock assignment GET handler.

- [ ] **Step 10: Run frontend focused tests**

Run:

```powershell
pnpm test -- src/features/users/components/user-form-dialog.test.tsx src/features/users/components/edit-user-assignments.test.tsx src/features/users/schemas/user-schema.test.ts src/features/users/api/users-api.test.ts src/features/users/hooks/use-users.test.tsx src/mocks/handlers/users.test.ts
```

Expected: PASS with no act warnings.

- [ ] **Step 11: Commit dialog integration**

```powershell
git add src/features/users/components/user-form-dialog.tsx src/features/users/components/user-form-dialog.test.tsx src/mocks/handlers/users.ts src/mocks/handlers/users.test.ts
git commit -m "feat: atomically edit user assignments"
```

---

### Task 9: Document and Verify Both Repositories

**Files:**
- Modify: `D:\project-cps\cps-api\API_ENDPOINTS.md`
- Modify: `C:\Users\USER\Desktop\minimax\API_ENDPOINTS.md`

**Interfaces:**
- Documents: aggregate PATCH request, assignment identity semantics, validation errors, and authentication invalidation.

- [ ] **Step 1: Update both endpoint maps**

Document this request body exactly:

```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "somchai@example.com",
  "telephone": "0812345678",
  "assignments": [
    { "id": "12", "departmentId": "3", "roleId": "5" },
    { "departmentId": null, "roleId": "1" }
  ]
}
```

State that an omitted existing ID is deleted, no ID creates a row, retained IDs
are updated, the array must contain at least one unique pair, and assignment
changes invalidate the affected user's tokens.

- [ ] **Step 2: Run backend focused and full verification**

From `D:\project-cps\cps-api`:

```powershell
pnpm test -- --runInBand src/database/migrations/1700000000004-AddUserAssignmentUniqueness.spec.ts src/modules/users/dto/update-user.dto.spec.ts src/modules/users/users.service.spec.ts src/modules/auth/strategies/jwt.strategy.spec.ts
pnpm test -- --runInBand
pnpm run build
pnpm exec eslint "{src,apps,libs,test}/**/*.ts"
git diff --check
git status --short
```

Expected: all tests and build pass; read-only lint completes without new errors; status
contains only intended changes plus the pre-existing untracked
`src/database/create-department-permissions-table.ts`.

- [ ] **Step 3: Inspect migration safety without mutating a database**

Before `pnpm migration:run`, run a read-only duplicate query against the
configured development database:

```sql
SELECT user_id, department_id, role_id, COUNT(*)
FROM iam.user_department_roles
GROUP BY user_id, department_id, role_id
HAVING COUNT(*) > 1;
```

If no development database is configured, do not run the migration and record
that limitation. If duplicates exist, stop and report the rows; do not delete
or merge them automatically.

- [ ] **Step 4: Run frontend focused and full verification**

From `C:\Users\USER\Desktop\minimax`:

```powershell
pnpm test -- src/features/users
pnpm test
pnpm type-check
pnpm lint
pnpm build
git diff --check
git status --short
```

Expected: all tests, type-check, lint, and build pass without new warnings.

- [ ] **Step 5: Commit documentation in each repository**

Backend:

```powershell
git add API_ENDPOINTS.md
git commit -m "docs: describe aggregate assignment updates"
```

Frontend:

```powershell
git add API_ENDPOINTS.md
git commit -m "docs: describe aggregate assignment updates"
```

- [ ] **Step 6: Review the complete diffs**

Backend:

```powershell
git diff HEAD~5..HEAD -- src/modules/users src/modules/auth/strategies src/database/migrations API_ENDPOINTS.md
```

Frontend:

```powershell
git diff HEAD~4..HEAD -- src/features/users src/types/auth.ts src/mocks/handlers/users.ts API_ENDPOINTS.md
```

Confirm every approved requirement maps to a test and no unrelated files are
included.
