# User Assignment Management Design

## Goal

Allow an administrator to edit a user's general information and complete
assignment set in one save. Each assignment consists of a department and a
role. The backend must apply the profile and assignment changes atomically and
invalidate the affected user's existing authentication immediately.

The frontend repository is `C:\Users\USER\Desktop\minimax`. The backend
repository is `D:\project-cps\cps-api`.

## Confirmed Business Rules

- A user must have at least one assignment.
- A user may have multiple assignments.
- A user may have different roles in the same department.
- The pair `(departmentId, roleId)` must be unique per user.
- A normal role requires a department.
- A system role uses `departmentId = null`; the UI labels this department as
  `ทุกแผนก (System)`.
- Removing or changing the final active `SUPER_ADMIN` assignment is forbidden.
- Editing an assignment must preserve its direct permissions when its existing
  assignment ID remains in the submitted set.
- Assignment changes invalidate all existing authentication for the affected
  user. The user must log in again.

## API Contract

The edit screen uses the existing user update route as one aggregate endpoint:

```http
PATCH /users/:id
Content-Type: application/json
Authorization: Bearer <access-token>
```

Example request:

```json
{
  "firstName": "สมชาย",
  "lastName": "ใจดี",
  "email": "somchai@example.com",
  "telephone": "0812345678",
  "assignments": [
    {
      "id": "12",
      "departmentId": "3",
      "roleId": "5"
    },
    {
      "departmentId": "3",
      "roleId": "8"
    },
    {
      "id": "20",
      "departmentId": null,
      "roleId": "1"
    }
  ]
}
```

An assignment with an `id` updates an existing record. An assignment without
an `id` creates a record. An existing assignment omitted from the submitted
array is deleted. An existing ID that does not belong to the route user is
rejected.

The response remains compatible with the current `PATCH /users/:id` user
response and includes the user's latest `permissionVersion`. Existing
per-assignment POST, PATCH, and DELETE endpoints remain available for backward
compatibility, but the edit-user screen no longer uses them.

## Frontend Design

### Form State

The edit dialog loads the user detail and assignments, then initializes one
React Hook Form model containing the general fields and the complete assignment
array. Adding, changing, and removing rows only updates local form state.
Nothing is persisted until the administrator presses Save.

Each row contains a role selector and either:

- a department selector for a normal role; or
- a disabled `ทุกแผนก (System)` department value for a system role.

New rows do not include an assignment ID. Existing rows retain their ID so the
backend can preserve the row's direct permission associations.

### Validation

The frontend validates:

- the existing general user rules;
- at least one assignment;
- a selected role for every row;
- a department for every normal role;
- `departmentId = null` for a system role; and
- no duplicate normalized `(departmentId, roleId)` pair.

Duplicate errors identify the affected assignment rows. The backend repeats all
business validation because client validation is not authoritative.

### Deletion

Selecting Delete opens the shared confirmation dialog and names the department
and role being removed. Confirming removes only the local form row. Cancelling
leaves the row unchanged. The delete action is disabled when only one
assignment remains, with explanatory text that a user must retain at least one
assignment.

### Save and Errors

Save submits one `PATCH /users/:id` request containing the general fields and
complete assignment set. Controls are disabled while the request is pending to
prevent duplicate submissions.

On success, the dialog closes, the user list, user detail, and assignment
caches are invalidated, and one success toast appears. If the administrator
edited their own assignments, the frontend clears authentication and redirects
to Login after displaying the successful save result.

On failure, the dialog remains open with its staged values. The frontend shows
the backend message for duplicate assignments, invalid references, invalid
system-role combinations, or final-super-admin protection. No partial state can
be visible because the backend rolls back the aggregate update.

## Backend Design

### DTO Validation

`UpdateUserDto` accepts an optional `assignments` array in addition to the
existing optional profile fields. Keeping the field optional preserves
compatibility for clients that only update profile data. The edit-user screen
always includes the array, and an included array must not be empty. Each member
accepts:

```ts
interface UpdateUserAssignmentInput {
  id?: string;
  departmentId: string | null;
  roleId: string;
}
```

Class-validator performs structural checks. Service validation resolves the
referenced assignments, departments, and roles and enforces role type,
activeness, ownership, uniqueness, and final-super-admin rules.

### Atomic Update

`UsersService.update` uses the TypeORM manager transaction and transaction-bound
repositories for every read and write in the operation:

1. Lock and load the target user and current assignments.
2. Normalize and validate the entire requested final state.
3. Lock the active super-admin assignment set and verify the final state leaves
   at least one active `SUPER_ADMIN`.
4. Update the general user fields.
5. Delete assignments absent from the submitted set. Their direct permissions
   are removed by the existing cascade or explicitly through the
   transaction-bound repository.
6. Update retained assignment rows without deleting their direct permissions.
7. Insert new assignment rows.
8. Increment `permissionVersion` only when the normalized assignment set
   differs from the persisted assignment set.
9. Commit and return the updated user, or roll back every change on any error.

All validation that participates in the update uses the same transaction
manager. No injected non-transaction repository writes occur inside the
transaction callback.

### Database Constraints

A new migration adds a deferrable uniqueness constraint for non-null department
assignments:

```text
(user_id, department_id, role_id)
```

It also adds a partial unique index for system assignments:

```text
(user_id, role_id) WHERE department_id IS NULL
```

The migration checks for existing duplicates before adding the constraints and
fails with a diagnostic rather than deleting or merging business data. The
deferrable constraint permits valid role swaps between retained assignments in
one transaction.

### Authentication Invalidation

Assignment changes increment `iam.users.permission_version` in the same
transaction as the profile and assignment writes.

`JwtStrategy` validates every authenticated request against current database
state:

- the user exists, is active, and is not locked;
- the session exists, belongs to the user, is not revoked, and is not expired;
- the token's `permissionVersion` equals the user's current version; and
- the token's active assignment still exists and belongs to the user when one
  is present.

A mismatch returns `401`. The existing refresh flow already rejects an old
permission version, so both access and refresh tokens become unusable. The
frontend interceptor clears local authentication and redirects to Login. This
also prevents a stale `SUPER_ADMIN` role embedded in an old access token from
continuing through `RolesGuard`.

## Error Handling

The backend returns:

- `400 Bad Request` for an empty assignment set, duplicate pairs, invalid
  system-role combinations, inactive references, or final-super-admin removal;
- `404 Not Found` for a missing user or referenced record;
- `401 Unauthorized` for stale authentication after a permission-version
  change; and
- `409 Conflict` for a database uniqueness race when applicable.

Messages follow the backend's existing English API style. The frontend presents
the backend message through the existing Thai toast/error patterns.

## Testing

### Backend

- Aggregate create, update, and delete operations commit in one transaction.
- A failure after one staged write rolls back the general and assignment
  changes.
- Zero assignments are rejected.
- Duplicate department-role pairs are rejected.
- Different roles in the same department are accepted.
- Foreign or nonexistent assignment IDs are rejected.
- Normal and system role department rules are enforced.
- Retained assignment direct permissions remain unchanged.
- The last active super admin cannot be removed or demoted.
- `permissionVersion` changes only when assignments change.
- Stale permission-version tokens, revoked sessions, expired sessions, invalid
  assignment contexts, inactive users, and locked users are rejected.

### Frontend

- Schema validation covers minimum count, duplicate pairs, and system roles.
- Assignment edits are staged without making per-row requests.
- Delete requires confirmation and cancelling preserves the row.
- The final row cannot be deleted.
- Save sends one aggregate payload with retained and new assignment identities.
- Successful save invalidates list, detail, and assignment queries.
- Self-assignment changes clear authentication and redirect to Login.
- Failed saves preserve form state and display the API error.

### Verification

Run focused tests first, followed by each repository's full test, type-check or
build, and lint commands. Database migration execution is performed only
against a configured development database after inspecting existing duplicate
data.

## Compatibility and Scope

- The individual assignment endpoints remain unchanged for other clients.
- Direct-permission editing is outside this screen's scope.
- Assignment ordering, primary assignment selection, and seamless token
  replacement are outside scope.
- Existing unrelated working-tree changes in either repository must be
  preserved.
