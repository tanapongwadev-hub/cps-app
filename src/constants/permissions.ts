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

  // Master Data — Lookup tables
  UNIT_VIEW: "UNIT_VIEW",
  UNIT_CREATE: "UNIT_CREATE",
  UNIT_UPDATE: "UNIT_UPDATE",
  UNIT_DELETE: "UNIT_DELETE",

  SUPPLIER_VIEW: "SUPPLIER_VIEW",
  SUPPLIER_CREATE: "SUPPLIER_CREATE",
  SUPPLIER_UPDATE: "SUPPLIER_UPDATE",
  SUPPLIER_DELETE: "SUPPLIER_DELETE",

  MATERIAL_MODEL_VIEW: "MATERIAL_MODEL_VIEW",
  MATERIAL_MODEL_CREATE: "MATERIAL_MODEL_CREATE",
  MATERIAL_MODEL_UPDATE: "MATERIAL_MODEL_UPDATE",
  MATERIAL_MODEL_DELETE: "MATERIAL_MODEL_DELETE",

  DELIVERY_TYPE_VIEW: "DELIVERY_TYPE_VIEW",
  DELIVERY_TYPE_CREATE: "DELIVERY_TYPE_CREATE",
  DELIVERY_TYPE_UPDATE: "DELIVERY_TYPE_UPDATE",
  DELIVERY_TYPE_DELETE: "DELIVERY_TYPE_DELETE",

  LOADING_POINT_VIEW: "LOADING_POINT_VIEW",
  LOADING_POINT_CREATE: "LOADING_POINT_CREATE",
  LOADING_POINT_UPDATE: "LOADING_POINT_UPDATE",
  LOADING_POINT_DELETE: "LOADING_POINT_DELETE",

  // Phase 2 — Additional Master Data
  CATEGORY_VIEW: "CATEGORY_VIEW",
  CATEGORY_CREATE: "CATEGORY_CREATE",
  CATEGORY_UPDATE: "CATEGORY_UPDATE",
  CATEGORY_DELETE: "CATEGORY_DELETE",

  STATUS_ITEM_VIEW: "STATUS_ITEM_VIEW",
  STATUS_ITEM_CREATE: "STATUS_ITEM_CREATE",
  STATUS_ITEM_UPDATE: "STATUS_ITEM_UPDATE",
  STATUS_ITEM_DELETE: "STATUS_ITEM_DELETE",

  ORGANIZATION_VIEW: "ORGANIZATION_VIEW",
  ORGANIZATION_CREATE: "ORGANIZATION_CREATE",
  ORGANIZATION_UPDATE: "ORGANIZATION_UPDATE",
  ORGANIZATION_DELETE: "ORGANIZATION_DELETE",

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

  // Materials Receiving (รับเข้าวัตถุดิบ + Stock Balance + QR Code)
  // ใช้ permission code เดียวกับ backend MATERIALS_RECEIVING_*
  MATERIALS_RECEIVING_VIEW: "MATERIALS_RECEIVING_VIEW",
  MATERIALS_RECEIVING_CREATE: "MATERIALS_RECEIVING_CREATE",
  MATERIALS_RECEIVING_UPDATE: "MATERIALS_RECEIVING_UPDATE",
  MATERIALS_RECEIVING_DELETE: "MATERIALS_RECEIVING_DELETE",
  MATERIALS_RECEIVING_CONFIRM: "MATERIALS_RECEIVING_CONFIRM",
  MATERIALS_RECEIVING_CANCEL: "MATERIALS_RECEIVING_CANCEL",

  // Reject Reason
  REJECT_REASON_VIEW: "REJECT_REASON_VIEW",
  REJECT_REASON_CREATE: "REJECT_REASON_CREATE",
  REJECT_REASON_UPDATE: "REJECT_REASON_UPDATE",
  REJECT_REASON_DELETE: "REJECT_REASON_DELETE",

  // Materials Disbursement (การจ่ายออกวัสดุ)
  MATERIALS_DISBURSEMENT_VIEW: "MATERIALS_DISBURSEMENT_VIEW",
  MATERIALS_DISBURSEMENT_CREATE: "MATERIALS_DISBURSEMENT_CREATE",
  MATERIALS_DISBURSEMENT_UPDATE: "MATERIALS_DISBURSEMENT_UPDATE",
  MATERIALS_DISBURSEMENT_DELETE: "MATERIALS_DISBURSEMENT_DELETE",
  MATERIALS_DISBURSEMENT_CONFIRM: "MATERIALS_DISBURSEMENT_CONFIRM",
  MATERIALS_DISBURSEMENT_CANCEL: "MATERIALS_DISBURSEMENT_CANCEL",

  // Products (ชิ้นส่วนยานยนต์)
  PRODUCTS_VIEW: "PRODUCTS_VIEW",
  PRODUCTS_CREATE: "PRODUCTS_CREATE",
  PRODUCTS_UPDATE: "PRODUCTS_UPDATE",
  PRODUCTS_DELETE: "PRODUCTS_DELETE",
  PRODUCTS_RESTORE: "PRODUCTS_RESTORE",

  // BOMs (Bill of Materials)
  BOMS_VIEW: "BOMS_VIEW",
  BOMS_CREATE: "BOMS_CREATE",
  BOMS_UPDATE: "BOMS_UPDATE",
  BOMS_DELETE: "BOMS_DELETE",
  BOMS_ACTIVATE: "BOMS_ACTIVATE",
  BOMS_DEACTIVATE: "BOMS_DEACTIVATE",
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
    module: "unit",
    label: "หน่วยนับ",
    permissions: [
      { key: "view", code: PERMISSIONS.UNIT_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.UNIT_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.UNIT_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.UNIT_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "supplier",
    label: "ผู้จัดจำหน่าย",
    permissions: [
      { key: "view", code: PERMISSIONS.SUPPLIER_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.SUPPLIER_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.SUPPLIER_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.SUPPLIER_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "material-model",
    label: "รุ่นวัสดุ",
    permissions: [
      { key: "view", code: PERMISSIONS.MATERIAL_MODEL_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.MATERIAL_MODEL_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.MATERIAL_MODEL_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.MATERIAL_MODEL_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "delivery-type",
    label: "ประเภทการจัดส่ง",
    permissions: [
      { key: "view", code: PERMISSIONS.DELIVERY_TYPE_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.DELIVERY_TYPE_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.DELIVERY_TYPE_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.DELIVERY_TYPE_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "loading-point",
    label: "จุดขนถ่าย",
    permissions: [
      { key: "view", code: PERMISSIONS.LOADING_POINT_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.LOADING_POINT_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.LOADING_POINT_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.LOADING_POINT_DELETE, label: "ลบ" },
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
  {
    module: "reject-reason",
    label: "เหตุผลการปฏิเสธ",
    permissions: [
      { key: "view", code: PERMISSIONS.REJECT_REASON_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.REJECT_REASON_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.REJECT_REASON_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.REJECT_REASON_DELETE, label: "ลบ" },
    ],
  },
  {
    module: "materials-receiving",
    label: "รับเข้าวัตถุดิบ (Materials Receiving)",
    permissions: [
      { key: "view", code: PERMISSIONS.MATERIALS_RECEIVING_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.MATERIALS_RECEIVING_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.MATERIALS_RECEIVING_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.MATERIALS_RECEIVING_DELETE, label: "ลบ" },
      { key: "confirm", code: PERMISSIONS.MATERIALS_RECEIVING_CONFIRM, label: "ยืนยันรับ" },
      { key: "cancel", code: PERMISSIONS.MATERIALS_RECEIVING_CANCEL, label: "ยกเลิก" },
    ],
  },
  {
    module: "materials-disbursement",
    label: "การจ่ายออกวัสดุ (Materials Disbursement)",
    permissions: [
      { key: "view", code: PERMISSIONS.MATERIALS_DISBURSEMENT_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.MATERIALS_DISBURSEMENT_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.MATERIALS_DISBURSEMENT_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.MATERIALS_DISBURSEMENT_DELETE, label: "ลบ" },
      { key: "confirm", code: PERMISSIONS.MATERIALS_DISBURSEMENT_CONFIRM, label: "ยืนยันจ่าย" },
      { key: "cancel", code: PERMISSIONS.MATERIALS_DISBURSEMENT_CANCEL, label: "ยกเลิก" },
    ],
  },
  {
    module: "products",
    label: "ชิ้นส่วนยานยนต์ (Products)",
    permissions: [
      { key: "view", code: PERMISSIONS.PRODUCTS_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.PRODUCTS_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.PRODUCTS_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.PRODUCTS_DELETE, label: "ลบ" },
      { key: "restore", code: PERMISSIONS.PRODUCTS_RESTORE, label: "กู้คืน" },
    ],
  },
  {
    module: "boms",
    label: "Bill of Materials (BOM)",
    permissions: [
      { key: "view", code: PERMISSIONS.BOMS_VIEW, label: "ดู" },
      { key: "create", code: PERMISSIONS.BOMS_CREATE, label: "สร้าง" },
      { key: "update", code: PERMISSIONS.BOMS_UPDATE, label: "แก้ไข" },
      { key: "delete", code: PERMISSIONS.BOMS_DELETE, label: "ลบ" },
      { key: "activate", code: PERMISSIONS.BOMS_ACTIVATE, label: "เปิดใช้งาน" },
      { key: "deactivate", code: PERMISSIONS.BOMS_DEACTIVATE, label: "ปิดใช้งาน" },
    ],
  },
] as const;
