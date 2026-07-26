# Role & Permission

## Permission Code Format

```
<module>.<action>
```

### Available Permissions

```ts
// User Management
USER_VIEW, USER_CREATE, USER_UPDATE, USER_DELETE, USER_EXPORT

// Role Management
ROLE_VIEW, ROLE_CREATE, ROLE_UPDATE, ROLE_DELETE

// Department
DEPARTMENT_VIEW, DEPARTMENT_CREATE, DEPARTMENT_UPDATE, DEPARTMENT_DELETE

// Menu
MENU_VIEW, MENU_MANAGE

// Ticket
TICKET_VIEW, TICKET_CREATE, TICKET_UPDATE, TICKET_DELETE,
TICKET_ASSIGN, TICKET_EXPORT

// Task
TASK_VIEW, TASK_CREATE, TASK_UPDATE, TASK_DELETE

// Approval
APPROVAL_VIEW, APPROVAL_APPROVE, APPROVAL_REJECT

// Master Data
MASTER_DATA_VIEW, MASTER_DATA_MANAGE

// Report
REPORT_VIEW, REPORT_EXPORT

// Activity Log
ACTIVITY_LOG_VIEW, ACTIVITY_LOG_EXPORT

// System
SYSTEM_SETTINGS_VIEW, SYSTEM_SETTINGS_UPDATE

// Super Admin
SUPER_ADMIN = "*"
```

## Roles

### Built-in Roles

| Code | Name | Description |
|------|------|-------------|
| `SUPER_ADMIN` | ผู้ดูแลระบบสูงสุด | สิทธิ์ทั้งหมด (`*`) |
| `ADMIN` | ผู้ดูแลระบบ | จัดการผู้ใช้งาน, ตั้งค่า |
| `MANAGER` | ผู้จัดการ | อนุมัติ, ดูรายงาน |
| `STAFF` | เจ้าหน้าที่ | สร้างคำขอ, ดูงาน |
| `VIEWER` | ผู้สังเกตการณ์ | ดูอย่างเดียว |

## How It Works

### 1. Define Permission

```ts
// src/constants/permissions.ts
export const PERMISSIONS = {
  USER_VIEW: "user.view",
  // ...
} as const;
```

### 2. Add to Permission Group (for Matrix UI)

```ts
export const PERMISSION_GROUPS = [
  {
    module: "user",
    label: "ผู้ใช้งาน",
    permissions: [
      { key: "view", code: PERMISSIONS.USER_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.USER_CREATE, label: "สร้าง" },
      // ...
    ],
  },
  // ...
];
```

### 3. Assign to Role

Backend จัดเก็บ permissions ใน role แต่ละ role แล้วส่งมาให้ frontend

### 4. Store in Frontend

```ts
// Auth Store
{
  user: { id, username, roleIds, ... },
  permissions: ["user.view", "user.create", ...]
}
```

### 5. Use in Component

```tsx
<PermissionGuard permission="user.create">
  <Button>เพิ่ม</Button>
</PermissionGuard>
```

หรือ
```tsx
const { hasPermission } = usePermission();
if (hasPermission("user.delete")) {
  // show delete button
}
```

## Super Admin

```ts
// ใน auth-store
hasPermission: (permission) => {
  if (permissions.includes("*")) return true; // super admin
  // ...
}
```

## Menu Permission

เมนูสามารถกำหนด `requiredPermissions` ได้:

```ts
{
  id: "menu-users",
  code: "USERS",
  name: "ผู้ใช้งาน",
  path: "/user-management/users",
  requiredPermissions: [PERMISSIONS.USER_VIEW], // ต้องมีสิทธิ์นี้ถึงจะเห็น
}
```

Sidebar จะ filter เมนูตาม permission อัตโนมัติ

## Route Guard

สำหรับ route protection นอกเหนือจาก auth check:

```tsx
// src/app/(admin)/admin-only/page.tsx
import { redirect } from "next/navigation";
import { PermissionGuard } from "@/components/ui/permission-guard";

export default function AdminOnlyPage() {
  return (
    <PermissionGuard
      permission="admin.access"
      fallback={<NotFoundPage />}
    >
      <Content />
    </PermissionGuard>
  );
}
```

## Backend Re-Check (CRITICAL!)

⚠️ **Backend ต้องตรวจสอบ Permission ทุก request**:

```ts
// NestJS example
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('user.create')
@Post('users')
async create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
```

Frontend guard เป็นเพียง UX improvement ไม่ใช่ security

## Multi-Role

User สามารถมีหลาย role:

```ts
{
  id: "user-001",
  roleIds: ["role-admin", "role-manager"],
}
```

Permissions จะถูก union กันอัตโนมัติ:
```
Admin permissions: [user.view, user.create, ...]
Manager permissions: [ticket.view, ticket.assign, ...]
User effective permissions: [user.view, user.create, ..., ticket.view, ticket.assign, ...]
```

## Adding New Permission

1. เพิ่มใน `src/constants/permissions.ts`
2. เพิ่มใน `PERMISSION_GROUPS` (ถ้าต้องการให้แสดงใน Matrix)
3. ส่ง permission code ใหม่ให้ backend
4. Backend update DB + API
5. ใช้ใน frontend

## Role Cloning

ใน Role Management สามารถ clone role เพื่อสร้าง role ใหม่ที่คล้ายกัน:

```ts
const clone = await apiClient.post(`/roles/${id}/clone`, {});
// → สร้าง role ใหม่ที่มี permissions เหมือนกัน แต่ code = "ORIGINAL_COPY"
```
