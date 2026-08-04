/**
 * Permission Constants
 * Format: "<module>.<action>"
 */

export const PERMISSIONS = {
  // Super admin
  SUPER_ADMIN: "*",

  // User Management
  USER_VIEW: "user.view",
  USER_CREATE: "user.create",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  USER_EXPORT: "user.export",

  // Role Management
  ROLE_VIEW: "role.view",
  ROLE_CREATE: "role.create",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",

  // Department Management
  DEPARTMENT_VIEW: "department.view",
  DEPARTMENT_CREATE: "department.create",
  DEPARTMENT_UPDATE: "department.update",
  DEPARTMENT_DELETE: "department.delete",

  // Menu Management
  MENU_VIEW: "menu.view",
  MENU_MANAGE: "menu.manage",

  // Material Management
  MATERIAL_VIEW: "MATERIALS_PC_MANAGEMENTS.read",
  MATERIAL_CREATE: "MATERIALS_PC_MANAGEMENTS.create",
  MATERIAL_UPDATE: "MATERIALS_PC_MANAGEMENTS.update",
  MATERIAL_DELETE: "MATERIALS_PC_MANAGEMENTS.delete",

  // Ticket Management
  TICKET_VIEW: "ticket.view",
  TICKET_CREATE: "ticket.create",
  TICKET_UPDATE: "ticket.update",
  TICKET_DELETE: "ticket.delete",
  TICKET_ASSIGN: "ticket.assign",
  TICKET_EXPORT: "ticket.export",

  // Task Management
  TASK_VIEW: "task.view",
  TASK_CREATE: "task.create",
  TASK_UPDATE: "task.update",
  TASK_DELETE: "task.delete",

  // Approvals
  APPROVAL_VIEW: "approval.view",
  APPROVAL_APPROVE: "approval.approve",
  APPROVAL_REJECT: "approval.reject",

  // Master Data
  MASTER_DATA_VIEW: "master-data.view",
  MASTER_DATA_MANAGE: "master-data.manage",

  // Reports
  REPORT_VIEW: "report.view",
  REPORT_EXPORT: "report.export",

  // Activity Logs
  ACTIVITY_LOG_VIEW: "activity-log.view",
  ACTIVITY_LOG_EXPORT: "activity-log.export",

  // System Settings
  SYSTEM_SETTINGS_VIEW: "system-settings.view",
  SYSTEM_SETTINGS_UPDATE: "system-settings.update",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];

/**
 * Permission groups organized by module
 * Used to render the permission matrix
 */
export const PERMISSION_GROUPS = [
  {
    module: "user",
    label: "ผู้ใช้งาน",
    permissions: [
      { key: "view", code: PERMISSIONS.USER_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.USER_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.USER_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.USER_DELETE, label: "ลบ" },
      { key: "export", code: PERMISSIONS.USER_EXPORT, label: "ส่งออก" },
    ],
  },
  {
    module: "role",
    label: "บทบาท",
    permissions: [
      { key: "view", code: PERMISSIONS.ROLE_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.ROLE_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.ROLE_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.ROLE_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "department",
    label: "แผนก",
    permissions: [
      { key: "view", code: PERMISSIONS.DEPARTMENT_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.DEPARTMENT_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.DEPARTMENT_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.DEPARTMENT_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "menu",
    label: "เมนู",
    permissions: [
      { key: "view", code: PERMISSIONS.MENU_VIEW, label: "ดู" },
      { key: "manage", code: PERMISSIONS.MENU_MANAGE, label: "จัดการ" },
    ],
  },
  {
    module: "ticket",
    label: "คำขอ / ตั๋ว",
    permissions: [
      { key: "view", code: PERMISSIONS.TICKET_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.TICKET_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.TICKET_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.TICKET_DELETE, label: "ลบ" },
      { key: "assign", code: PERMISSIONS.TICKET_ASSIGN, label: "มอบหมาย" },
      { key: "export", code: PERMISSIONS.TICKET_EXPORT, label: "ส่งออก" },
    ],
  },
  {
    module: "task",
    label: "งาน",
    permissions: [
      { key: "view", code: PERMISSIONS.TASK_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.TASK_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.TASK_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.TASK_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "approval",
    label: "การอนุมัติ",
    permissions: [
      { key: "view", code: PERMISSIONS.APPROVAL_VIEW, label: "ดู" },
      { key: "approve", code: PERMISSIONS.APPROVAL_APPROVE, label: "อนุมัติ" },
      { key: "reject", code: PERMISSIONS.APPROVAL_REJECT, label: "ปฏิเสธ" },
    ],
  },
  {
    module: "master-data",
    label: "ข้อมูลหลัก",
    permissions: [
      { key: "view", code: PERMISSIONS.MASTER_DATA_VIEW, label: "ดู" },
      { key: "manage", code: PERMISSIONS.MASTER_DATA_MANAGE, label: "จัดการ" },
    ],
  },
  {
    module: "report",
    label: "รายงาน",
    permissions: [
      { key: "view", code: PERMISSIONS.REPORT_VIEW, label: "ดู" },
      { key: "export", code: PERMISSIONS.REPORT_EXPORT, label: "ส่งออก" },
    ],
  },
  {
    module: "activity-log",
    label: "บันทึกกิจกรรม",
    permissions: [
      { key: "view", code: PERMISSIONS.ACTIVITY_LOG_VIEW, label: "ดู" },
      { key: "export", code: PERMISSIONS.ACTIVITY_LOG_EXPORT, label: "ส่งออก" },
    ],
  },
  {
    module: "system-settings",
    label: "ตั้งค่าระบบ",
    permissions: [
      { key: "view", code: PERMISSIONS.SYSTEM_SETTINGS_VIEW, label: "ดู" },
      { key: "update", code: PERMISSIONS.SYSTEM_SETTINGS_UPDATE, label: "แก้ไข" },
    ],
  },
] as const;
