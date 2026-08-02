# User Menu Access Summary Design

**Date:** 2026-08-02

## Goal

Show, inside the edit-user sheet, which menus the selected user can currently access for each saved department-and-role assignment.

The display must use the same effective-permission rules as authentication. It is an informational view of persisted access, not a preview of unsaved assignment edits.

## Decisions

- Access is displayed separately for every assignment because permissions are assignment-scoped.
- The edit-user sheet gains a third tab named `เมนูที่เข้าถึงได้`.
- The frontend loads one aggregate backend resource rather than issuing one request per assignment.
- The summary represents the latest persisted state. After an assignment update succeeds, the frontend invalidates and reloads it.
- The backend remains the sole authority for effective permissions and menu visibility.
- No database migration is required.

## Backend API

Add a protected endpoint:

```http
GET /users/:id/access-summary
```

It uses the same controller guards as the existing user-management endpoints.

Suggested response shape after the existing response interceptor unwraps it:

```json
{
  "userId": "42",
  "assignments": [
    {
      "assignmentId": "76",
      "department": {
        "id": "2",
        "code": "PRODUCTION",
        "name": "ฝ่ายผลิต"
      },
      "role": {
        "id": "3",
        "code": "SUPERVISOR",
        "name": "หัวหน้างาน",
        "scopeType": "DEPARTMENT"
      },
      "isActive": true,
      "expiredAt": null,
      "permissions": ["ticket.read"],
      "menus": [],
      "menuCount": 4
    }
  ]
}
```

For a system-scoped assignment, `department` is `null`. The frontend labels it `ระดับระบบ / ทุกแผนก`.

`menus` uses the existing authentication menu-tree shape (`id`, `code`, `name`, `nameEn`, `path`, `icon`, `menuType`, `sortOrder`, `permissions`, and `children`). `menuCount` counts every included node in the tree so the UI does not have to derive it independently.

## Backend Processing

`UsersModule` imports `AccessControlModule`. `UsersService` receives the existing `EffectivePermissionService`, `AccessControlService`, and `MenuTreeService`.

For a requested user:

1. Verify the user exists with the existing `findOne` behavior.
2. Load saved assignments with their department and role relations in deterministic order.
3. Load the active/visible menu definitions and their permission mappings once.
4. For each active, non-expired assignment, calculate permission codes with `getEffectivePermissionCodes(userId, assignmentId, isSuperAdmin)`.
5. Build its menu tree with the existing `MenuTreeService` used by login.
6. For inactive or expired assignments, return an empty permission list and menu tree so the UI clearly communicates that the assignment grants no current access.

A Super Admin assignment passes `isSuperAdmin = true`, matching login behavior and returning all active permissions and visible menus.

The calculation must remain assignment-specific. Permissions from another assignment must never be merged into the displayed tree.

## Frontend UI

The edit-user sheet changes from two tabs to three:

1. `ข้อมูลทั่วไป`
2. `แผนก & บทบาท`
3. `เมนูที่เข้าถึงได้`

The access tab renders one bordered card per saved assignment. Each card contains:

- Department name, or `ระดับระบบ / ทุกแผนก`
- Role name
- Active, inactive, or expired status
- Total accessible-menu count
- A read-only hierarchical menu list that preserves backend ordering

Parent/group nodes are shown to retain navigation context. Leaf nodes show their route when present. The view does not expose permission-code editing controls.

## Loading, Empty, and Error States

- While loading, show skeleton assignment cards.
- If the user has no returned assignments, show an empty-state message.
- If an assignment is active but has no accessible menus, show `ไม่มีเมนูที่เข้าถึงได้` within that card.
- If the request fails, show an inline error with a retry action; the rest of the edit form remains usable.
- Inactive or expired assignments show a muted status explanation and no menu tree.

## Cache and Save Behavior

Add a dedicated React Query key under the users namespace, keyed by user ID. The query is enabled only while editing an existing user.

On a successful aggregate user update, invalidate:

- the users list,
- the user detail,
- the user assignments,
- the user's access summary.

The tab continues to show persisted access while the assignment form has unsaved changes. A short helper message states that menu access is based on the latest saved assignments.

## Compatibility and Security

- Existing user and authentication response contracts remain unchanged.
- The new endpoint does not alter token issuance or current-session behavior.
- Permission evaluation reuses established services; the frontend does not reconstruct access from role IDs.
- The API returns only menus the target user can access and does not expose unrelated role/permission configuration.

## Testing

Backend tests cover:

- one menu tree per assignment,
- no cross-assignment permission union,
- Super Admin behavior,
- inactive and expired assignments returning no access,
- user-not-found behavior,
- deterministic response ordering and menu counts.

Frontend tests cover:

- API and query wiring,
- loading, error, retry, and empty states,
- multiple assignment cards,
- nested menu rendering,
- system-scoped labels,
- inactive/expired states,
- access-summary cache invalidation after saving assignments.

## Out of Scope

- Previewing menus for unsaved assignment edits
- Editing permissions or menu configuration from the user sheet
- Combining all assignments into one unioned menu list
- Database schema changes
