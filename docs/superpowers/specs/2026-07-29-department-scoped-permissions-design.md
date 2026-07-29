# Department-Scoped Permissions Design

**Date:** 2026-07-29

## Goal

Allow a permission to be restricted to one or more departments while preserving existing permission behavior. A permission with no active department mappings remains available to every department. Super Admin bypasses both permission grants and department restrictions.

## Scope

This change spans:

- Frontend repository: `C:\Users\USER\Desktop\minimax`
- Backend repository: `D:\project-cps\cps-api`
- Permission catalog UI at `/permissions`
- Permission list/detail/update APIs
- IAM database schema
- Effective permission calculation and request authorization

## Authorization Semantics

A non-Super-Admin user receives a permission only when at least one active, unexpired `user_department_roles` assignment satisfies both conditions:

1. The assignment's role grants the permission, or the assignment has a user-specific `ALLOW` for the permission.
2. The permission has no active department mappings, or the assignment's `department_id` is included in its active department mappings.

The grant and matching department must belong to the same assignment. A role grant from one assignment cannot be combined with a matching department from another assignment.

Within one assignment, a user-specific `DENY` overrides `ALLOW` for the same permission. Permission results are calculated per assignment and then unioned, so an allowed matching assignment is sufficient even when another assignment does not match or denies that permission.

Super Admin bypasses this calculation and can use every active permission regardless of department mappings.

## Database Design

Add migration `1700000000003-CreateDepartmentPermissions.ts` without modifying earlier migrations.

Create `iam.department_permissions` with:

| Column | Definition |
| --- | --- |
| `id` | `bigint`, generated primary key |
| `permission_id` | `bigint`, not null, foreign key to `iam.permissions(id)` |
| `department_id` | `bigint`, not null, foreign key to `iam.departments(id)` |
| `is_active` | `boolean`, not null, default `true` |
| `created_at` | `timestamp`, not null, default current timestamp |
| `updated_at` | `timestamp`, not null, default current timestamp |

Constraints and indexes:

- Unique constraint on `(permission_id, department_id)`.
- Index on `permission_id`.
- Index on `department_id`.
- Both foreign keys use `ON DELETE CASCADE` so existing hard-delete behavior for permissions and departments continues to work.

Add a `DepartmentPermission` TypeORM entity and relations to `Permission` and `Department`. Only mappings with `is_active = true` participate in API responses and authorization. Zero active mappings means unrestricted access across departments.

## Backend API Design

The existing controller-level `JwtAuthGuard`, `RolesGuard`, and `@Roles(RoleCode.SUPER_ADMIN)` protection remains in place, so only Super Admin can list, inspect, or change the permission catalog.

### `GET /permissions`

Keep the current pagination envelope. Each permission gains a `departments` array:

```json
{
  "items": [
    {
      "id": "10",
      "code": "order.approve",
      "isActive": true,
      "departments": [
        {
          "id": "1",
          "code": "WE",
          "nameTh": "แผนก WE",
          "nameEn": "WE Department"
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

Fetch the requested permission page first, then load active department mappings for the returned permission IDs in one batch query. This avoids one-to-many joins changing pagination or counts.

### `GET /permissions/:id`

Return the existing permission detail plus the same active `departments` array. An empty array means all departments.

### `PUT /permissions/:id/departments`

Request:

```json
{
  "departmentIds": ["1", "2", "3"]
}
```

Validation:

- `departmentIds` is required.
- It must be an array of strings.
- Values must be unique.
- Every referenced department must exist.

Behavior:

1. Return `404` when the permission does not exist.
2. Return `400` with the invalid IDs when any department does not exist.
3. Start a transaction and lock the permission row for update.
4. Upsert the selected pairs as active.
5. Mark existing pairs omitted from the request as inactive.
6. Commit and return the complete permission detail with `departments`.

An empty `departmentIds` array deactivates every mapping and restores all-department access. Concurrent updates are serialized by the permission-row lock; the last successfully committed request is authoritative. Any failure rolls back the entire update.

Update the backend `API_ENDPOINTS.md` with the expanded responses and PUT contract.

## Access-Control Design

Extend effective permission rows with `assignmentId` and `departmentId`.

`AccessControlService` will:

1. Load every active, unexpired assignment for the user, or the requested assignment when an explicit assignment filter is intentionally used.
2. Batch-load the role-action grants for those assignments.
3. Batch-load user-specific permission entries for those assignments.
4. Batch-load active permissions and their active department mappings.
5. Emit role and user rows only when the permission is unrestricted or the row's assignment department is allowed.

`EffectivePermissionService` will group rows by assignment. Within each group it removes codes denied by a user-specific `DENY`, retains allowed codes, then returns the sorted unique union across groups.

`PermissionGuard` will calculate permissions across all assignments for non-Super-Admin users instead of limiting authorization to the currently selected assignment. The current active assignment remains available for business-context scoping but is not the only assignment considered for the department-permission rule.

Login, department switching, `/auth/me/permissions`, menu construction, and request authorization will all use the same effective-permission service so the client-visible permission set matches backend authorization. No department-permission result is embedded as an authoritative JWT claim; request authorization evaluates current database state.

## Frontend Design

### Permission Catalog

- Show the catalog only to Super Admin. Non-Super-Admin users retain the "My permissions" view without catalog editing controls.
- Add a "แผนกที่ใช้งานได้" column.
- Render an empty `departments` array as a "ทุกแผนก" badge.
- For restricted permissions, show the first two department names and a `+N` indicator for remaining departments.
- Add a visible "กำหนดแผนก" button to each permission row.

### Department Selection Modal

The modal:

- Loads departments from `GET /departments`.
- Initializes from the permission's current `departments`.
- Searches client-side by department code, Thai name, or English name.
- Supports selecting all departments matching the current search.
- Supports clearing all selections.
- Shows the selected count.
- Explains that no selection means every department can use the permission.
- Saves through `PUT /permissions/:id/departments`.
- Closes only after a successful response.
- Preserves the current selection and displays an error toast when saving fails.

After a successful update, invalidate permission list and detail query keys so the catalog refreshes immediately.

## Error Handling

- DTO validation failures return `400`.
- Missing permission returns `404`.
- Unknown department IDs return `400` and identify the invalid IDs.
- Database failures roll back all mapping changes.
- Frontend loading and saving states prevent duplicate submissions.
- Frontend save failures do not discard the user's selections.

## Testing Strategy

Follow test-driven development for all behavior changes.

Backend tests cover:

- The migration/entity mapping and unique pair behavior where repository-level testing is available.
- Permission list and detail responses with active departments.
- Empty mappings representing unrestricted permissions.
- PUT validation, activation, deactivation, idempotent reselection, rollback, and missing IDs.
- Role permission with a matching department.
- Role permission whose matching department belongs only to a different assignment.
- Multiple assignments where at least one complete assignment matches.
- User-specific `ALLOW` and per-assignment `DENY`.
- Inactive mappings and expired assignments.
- Super Admin bypass.
- Guard use of all assignments.

Frontend tests cover:

- "ทุกแผนก" rendering.
- Restricted-department summary rendering.
- Modal initialization and searching.
- Select-all for current search results.
- Clear-all behavior and the empty-array payload.
- PUT payload and query invalidation.
- Modal persistence on request failure.
- Hiding catalog mutation controls from non-Super-Admin users.

Verification commands:

Backend:

```text
pnpm test -- permissions
pnpm test -- access-control
pnpm test -- permission.guard
pnpm build
pnpm lint
```

Frontend:

```text
pnpm test
pnpm type-check
pnpm lint
pnpm build
```

Do not run the migration against a real database automatically. Run it only in an environment with approved database credentials after the build and automated tests pass.

## Acceptance Criteria Mapping

- Multiple departments per permission: unique active mappings plus multi-select modal.
- Save and display departments: PUT endpoint, expanded GET responses, and catalog column.
- Enforce departments before access: assignment-aware effective-permission calculation used by the guard.
- Preserve existing permissions: zero active mappings means every department.
- Super Admin only: controller guards plus frontend catalog/edit visibility.

