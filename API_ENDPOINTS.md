# API Endpoints - Frontend Reference

> Base URL: ตัวแปร `baseUrl` เช่น `http://localhost:3001/api/v1`
> Authorization: ส่ง `Authorization: Bearer <accessToken>` สำหรับ endpoints ที่ต้อง authentication

## Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | เข้าสู่ระบบ (`username`, `password`) |
| POST | `/auth/select-department` | Public (ต้องใช้ `departmentSelectionToken` จาก `/auth/login` + `userDepartmentRoleId`) | เลือก department/role หลัง login |
| POST | `/auth/switch-department` | Bearer | เปลี่ยน department/role ระหว่างใช้งาน (`userDepartmentRoleId`) |
| POST | `/auth/refresh` หรือ `/auth/refresh-token` | Public | refresh access token ด้วย `refreshToken` (ทั้งสอง path เป็น alias) |
| POST | `/auth/logout` | Bearer | ออกจากระบบ (revoke session ปัจจุบัน) |
| GET | `/auth/me` | Bearer | ข้อมูลผู้ใช้ปัจจุบัน รวม departments, roles และ `accessControl: { menus, permissions }` |
| GET | `/auth/me/menus` | Bearer | ดึงเมนูของผู้ใช้ปัจจุบัน |
| GET | `/auth/me/permissions` | Bearer | ดึงสิทธิ์ของผู้ใช้ปัจจุบัน |

## Users (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users` | Bearer + SUPER_ADMIN | รายการผู้ใช้ (รองรับ `page`, `limit`, `search`) |
| GET | `/users/:id` | Bearer + SUPER_ADMIN | ข้อมูลผู้ใช้ตาม id |
| POST | `/users` | Bearer + SUPER_ADMIN | สร้างผู้ใช้ใหม่ |
| PATCH | `/users/:id` | Bearer + SUPER_ADMIN | แก้ไขข้อมูลผู้ใช้ |
| PATCH | `/users/:id/status` | Bearer + SUPER_ADMIN | อัปเดตสถานะผู้ใช้ (active/locked) |
| POST | `/users/:id/reset-password` | Bearer + SUPER_ADMIN | รีเซ็ตรหัสผ่าน |
| GET | `/users/:id/assignments` | Bearer + SUPER_ADMIN | ดึง assignments ของผู้ใช้ |
| POST | `/users/:id/assignments` | Bearer + SUPER_ADMIN | สร้าง assignment ใหม่ |

### PATCH `/users/:id` — Aggregate Assignment Update

ส่งข้อมูลส่วนตัวพร้อม `assignments` ซึ่งเป็นสถานะปลายทางทั้งหมดของผู้ใช้ใน request เดียว:

```json
{
  "firstName": "Somchai",
  "lastName": "Jaidee",
  "email": "somchai@example.com",
  "telephone": "0812345678",
  "assignments": [
    { "id": "12", "departmentId": "3", "roleId": "5" },
    { "departmentId": null, "roleId": "1" }
  ]
}
```

- Assignment เดิมที่ต้องการคงไว้หรือแก้ไขให้ส่ง `id`; รายการใหม่ไม่ต้องส่ง `id`
- Assignment เดิมที่ไม่อยู่ใน array จะถูกลบ โดยผู้ใช้ต้องเหลืออย่างน้อย 1 รายการ
- ห้ามมีคู่ `(departmentId, roleId)` ซ้ำกัน
- System role ใช้ `departmentId: null`; department role ต้องระบุ `departmentId`
- Backend ตรวจสอบและเพิ่ม/แก้ไข/ลบ Assignment พร้อมข้อมูลส่วนตัวภายใน transaction เดียว
- เมื่อชุด Assignment เปลี่ยน `permissionVersion` จะเพิ่มขึ้น ทำให้ access token เดิมใช้ไม่ได้และต้อง login ใหม่

## Departments (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/departments` | Bearer + SUPER_ADMIN | รายการแผนก (รองรับ `page`, `limit`, `search`) |
| GET | `/departments/:id` | Bearer + SUPER_ADMIN | ข้อมูลแผนก |
| POST | `/departments` | Bearer + SUPER_ADMIN | สร้างแผนก |
| PATCH | `/departments/:id` | Bearer + SUPER_ADMIN | แก้ไขแผนก |
| DELETE | `/departments/:id` | Bearer + SUPER_ADMIN | ลบแผนก |

## Roles (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/roles` | Bearer + SUPER_ADMIN | รายการบทบาท (รองรับ `page`, `limit`, `search`, `status` = `active`/`inactive`) |
| GET | `/roles/:id` | Bearer + SUPER_ADMIN | ข้อมูลบทบาท |
| POST | `/roles` | Bearer + SUPER_ADMIN | สร้างบทบาท |
| PATCH | `/roles/:id` | Bearer + SUPER_ADMIN | แก้ไขบทบาท |
| DELETE | `/roles/:id` | Bearer + SUPER_ADMIN | ลบบทบาท |

## Menus (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/menus` | Bearer + SUPER_ADMIN | รายการเมนู (รองรับ `page`, `limit`, `search`) |
| GET | `/menus/tree` | Bearer + SUPER_ADMIN | โครงสร้างเมนูแบบ tree |
| GET | `/menus/:id` | Bearer + SUPER_ADMIN | ข้อมูลเมนู |
| POST | `/menus` | Bearer + SUPER_ADMIN | สร้างเมนู |
| PATCH | `/menus/:id` | Bearer + SUPER_ADMIN | แก้ไขเมนู |
| DELETE | `/menus/:id` | Bearer + SUPER_ADMIN | ลบเมนู |

## Permissions (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/permissions` | Bearer + SUPER_ADMIN | รายการ permission (รองรับ `page`, `limit`, `search`) |
| GET | `/permissions/options` | Bearer + SUPER_ADMIN | รายการ menus + actions สำหรับ dropdown ในฟอร์ม |
| GET | `/permissions/:id` | Bearer + SUPER_ADMIN | ข้อมูล permission |
| POST | `/permissions` | Bearer + SUPER_ADMIN | สร้าง permission (`menuId`, `actionId`, `code`) |
| PATCH | `/permissions/:id` | Bearer + SUPER_ADMIN | แก้ไข permission |
| DELETE | `/permissions/:id` | Bearer + SUPER_ADMIN | ลบ permission |

## Sessions (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/sessions` | Bearer + SUPER_ADMIN | รายการเซสชัน (รองรับ `page`, `limit`, `userId`) |
| GET | `/sessions/:id` | Bearer + SUPER_ADMIN | ข้อมูลเซสชัน |
| PATCH | `/sessions/:id/revoke` | Bearer + SUPER_ADMIN | revoke เซสชัน |
| POST | `/sessions/revoke-all/:userId` | Bearer + SUPER_ADMIN | revoke ทุกเซสชันของ user |

## Audit Logs (ต้องเป็น SUPER_ADMIN)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/audit-logs` | Bearer + SUPER_ADMIN | รายการ audit logs (รองรับ `page`, `limit`, `userId`, `action`) |
| GET | `/audit-logs/:id` | Bearer + SUPER_ADMIN | ข้อมูล audit log |

## Materials Receiving (รับเข้าวัตถุดิบ + Stock Balance + QR Code)

> ต่างจาก Goods Receipt ตรงที่เป็น **single material per receiving** และ **update stock balance** ทันทีที่ confirm
> สิทธิ์ที่ใช้: `MATERIALS_RECEIVING_VIEW`, `MATERIALS_RECEIVING_CREATE`, `MATERIALS_RECEIVING_UPDATE`, `MATERIALS_RECEIVING_DELETE`, `MATERIALS_RECEIVING_CONFIRM`, `MATERIALS_RECEIVING_CANCEL`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| GET | `/materials-receiving` | `MATERIALS_RECEIVING_VIEW` | รายการรับเข้า (รองรับ `page`, `limit`, `search`, `status`, `supplierId`, `materialId`, `internalLotNo`, `receiveDateFrom`, `receiveDateTo`, `hasPackages`, `sortBy`, `sortOrder`) |
| GET | `/materials-receiving/lookups` | `MATERIALS_RECEIVING_VIEW` | ดึง suppliers / materials (พร้อม packingQuantity) / units |
| GET | `/materials-receiving/by-lot/:internalLotNo` | `MATERIALS_RECEIVING_VIEW` | ค้นหาด้วย Internal Lot No. (สำหรับ scan QR) |
| GET | `/materials-receiving/:id` | `MATERIALS_RECEIVING_VIEW` | รายละเอียดการรับเข้า + `packages[]` |
| POST | `/materials-receiving` | `MATERIALS_RECEIVING_CREATE` | สร้าง draft + generate lot no + package breakdown + QR (รองรับ `idempotencyKey`) |
| PATCH | `/materials-receiving/:id` | `MATERIALS_RECEIVING_UPDATE` | แก้ draft (ต้องส่ง `updatedAt` เพื่อทำ optimistic concurrency check) |
| DELETE | `/materials-receiving/:id` | `MATERIALS_RECEIVING_DELETE` | ลบ draft เท่านั้น |
| POST | `/materials-receiving/:id/confirm` | `MATERIALS_RECEIVING_CONFIRM` | ยืนยันการรับเข้า → update stock + บันทึก stock transaction |
| POST | `/materials-receiving/:id/cancel` | `MATERIALS_RECEIVING_CANCEL` | ยกเลิก (ถ้าเคย confirm จะ revert stock) |

### Internal Lot No. & Supplier Lot No.

| ประเภท | Format | กฎ |
|---|---|---|
| Internal Lot No. | `CCI-YYYYMMDD-XXX` | reset ทุกวัน, running 3 หลัก, UNIQUE ในระบบ |
| Supplier Lot No. | `SUP-YYYYMMDD` | generate จาก supplier production date |

### Package Calculation

```
packageCount = CEIL(receiveQuantity / packingQuantity)
```

SUM ของทุก package = receiveQuantity เสมอ (package สุดท้ายอาจมีจำนวนน้อยกว่า `packingQuantity`)

### QR Code

Backend เก็บ QR เป็น **base64 PNG** ใน `qrCode` และ JSONB payload ใน `qrPayload` (version 1.0):
- `internalLotNo` (ค่าหลัก — ใช้ identify)
- `materialCode`
- `receiveQuantity`
- `supplierLotNo`

Frontend render: `<img src={receiving.qrCode} alt="..." />` (Data URL)

### Query Parameters ของ `GET /materials-receiving`

| Param | Type | Default | หมายเหตุ |
|---|---|---|---|
| `page` | int ≥ 1 | `1` | หน้าที่ต้องการ |
| `limit` | int 1–100 | `20` | จำนวนต่อหน้า |
| `search` | string | — | ค้นหา `internalLotNo`, `supplierLotNo`, `material.code` (ILIKE) |
| `status` | enum | — | `draft` \| `confirmed` \| `cancelled` |
| `supplierId` | string (positive int) | — | กรองตาม supplier |
| `materialId` | string (positive int) | — | กรองตาม material |
| `internalLotNo` | `CCI-YYYYMMDD-XXX` | — | match แบบ exact |
| `receiveDateFrom` / `receiveDateTo` | `YYYY-MM-DD` | — | ช่วงวันที่รับ |
| `hasPackages` | bool | — | กรองตามการมี/ไม่มี package detail |
| `sortBy` | enum | `receiveDate` | `internalLotNo` \| `receiveDate` \| `supplierLotNo` \| `createdAt` \| `updatedAt` |
| `sortOrder` | enum | `desc` | `asc` \| `desc` |

### `POST /materials-receiving`

```json
{
  "materialId": "3",
  "supplierId": "2",
  "receiveQuantity": "1000",
  "supplierProductionDate": "2026-08-01",
  "receiveDate": "2026-08-09",
  "idempotencyKey": "order-20260809-001",
  "remark": "ฝากรับที่จุด A"
}
```

- `idempotencyKey` (optional) — ถ้าส่ง ระบบจะคืนใบรับเดิมที่สร้างด้วย key นี้ (กันสร้างซ้ำจาก retry)
- `packingQuantityOverride` (optional) — ใช้กรณี materials.packing_quantity ว่าง
- ทุกครั้งที่สร้าง ระบบจะ: validate → snapshot packing → คำนวณ package → generate lot no (lock) → generate supplier lot → generate QR → save receiving + packages ภายใน transaction เดียว

### `POST /materials-receiving/:id/confirm`

ยืนยันการรับเข้า → update stock balance (lock + atomic) + บันทึก stock transaction (RECEIVE)

### `POST /materials-receiving/:id/cancel`

```json
{ "cancelReason": "รับผิด material" }
```

- ถ้าเคย confirm → revert stock + บันทึก stock transaction (ADJUST)
- ถ้าเป็น draft → เปลี่ยนสถานะอย่างเดียว

## Root

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | Hello message จาก `AppController` (default NestJS) |

## คำอธิบาย Auth

- **Public** — ไม่ต้องส่ง token
- **Bearer** — ต้องส่ง `Authorization: Bearer <accessToken>`
- **Bearer + SUPER_ADMIN** — ต้องส่ง token และผู้ใช้ต้องมี role `SUPER_ADMIN`

## Query Parameters ทั่วไป

สำหรับ endpoints รายการที่รองรับ pagination:
- `page` — หน้าที่ต้องการ (default: 1)
- `limit` — จำนวนต่อหน้า (default: 20)
