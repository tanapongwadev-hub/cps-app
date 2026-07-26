# Backend Menu Path Alignment

Align the backend's menu table with the frontend's route table so that
clicking a sidebar item lands on a real page.

## Current mismatch (from real backend response)

| Menu code              | Backend path        | Frontend route              | Action                          |
| ---------------------- | ------------------- | --------------------------- | ------------------------------- |
| `MATERIALS_MANAGEMENTS`| `/materials`        | (none — placeholder)        | Add page **OR** keep + override |
| `MENU_MANAGEMENT`      | `/menus`            | `/system/menu-management`   | **Update path**                 |
| `USER_MANAGEMENTS`     | `null` (group)      | group                       | Keep                            |
| `USER_LIST`            | `/user-management/users` | `/user-management/users` | ✓ Already correct               |
| `DEPARTMENT_MANAGEMENT`| `/departments`      | `/user-management/departments` | **Update path**              |
| `DEPARTMENT_LIST`      | `/departments`      | `/user-management/departments` | **Update path**              |
| `ROLE_MANAGEMENT`      | `/roles`            | `/user-management/roles`    | **Update path**                 |
| `PERMISSION_MANAGEMENT`| `/permissions`      | (none — use `/system/settings`) | Add page **OR** keep + override |
| `SESSION_MANAGEMENT`   | `/sessions`         | (none — use `/system/settings`) | Add page **OR** keep + override |
| `AUDIT_LOG`            | `/audit-logs`       | `/system/activity-logs`     | **Update path**                 |

## Option 1 — Update the backend (recommended)

Run this SQL against the menu table to align paths with the frontend:

```sql
-- Align with frontend route table
UPDATE menus SET path = '/system/menu-management'
  WHERE code = 'MENU_MANAGEMENT';

UPDATE menus SET path = '/user-management/departments'
  WHERE code = 'DEPARTMENT_MANAGEMENT';

UPDATE menus SET path = '/user-management/departments'
  WHERE code = 'DEPARTMENT_LIST';

UPDATE menus SET path = '/user-management/roles'
  WHERE code = 'ROLE_MANAGEMENT';

UPDATE menus SET path = '/system/activity-logs'
  WHERE code = 'AUDIT_LOG';

-- For menus without a real page yet, point at the placeholder
-- so the sidebar still works end-to-end
UPDATE menus SET path = '/coming-soon?feature=MATERIALS_MANAGEMENTS'
  WHERE code = 'MATERIALS_MANAGEMENTS';

UPDATE menus SET path = '/coming-soon?feature=PERMISSION_MANAGEMENT'
  WHERE code = 'PERMISSION_MANAGEMENT';

UPDATE menus SET path = '/coming-soon?feature=SESSION_MANAGEMENT'
  WHERE code = 'SESSION_MANAGEMENT';
```

If your backend seeds menus from a TypeScript/JS file instead of SQL,
update the seed data the same way.

After running, verify with:

```bash
node scripts/test-api-menus.cjs
```

All 8 menus should now show their final path.

## Option 2 — Keep backend as-is, override in frontend (already done)

If you don't want to touch the backend right now, the frontend already
ships with a path-override map at `src/config/menu-overrides.ts`:

```ts
export const MENU_PATH_OVERRIDES: Record<string, string | null> = {
  USER_LIST:            "/user-management/users",
  ROLE_MANAGEMENT:      "/user-management/roles",
  DEPARTMENT_LIST:      "/user-management/departments",
  MENU_MANAGEMENT:      "/system/menu-management",
  AUDIT_LOG:            "/system/activity-logs",
  PERMISSION_MANAGEMENT: "/system/settings",
  SESSION_MANAGEMENT:   "/system/settings",
  MATERIALS_MANAGEMENTS: "/coming-soon?feature=MATERIALS_MANAGEMENTS",
};
```

The sidebar resolves the path as `override ?? backend.path` at render time.
No backend change needed.

## Adding a real page for a placeholder

When you build a new page that matches a backend menu:

1. Create `src/app/(admin)/<path>/page.tsx`
2. Remove the entry from `MENU_PATH_OVERRIDES`
3. Done — sidebar will now link to the real page

For `MATERIALS_MANAGEMENTS`, you'd build `src/app/(admin)/materials/page.tsx`
and remove that override entry.
