# Master Data CRUD Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this design task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Created:** 2026-08-04
**Status:** Design — awaiting implementation plan
**Related:** [2026-08-02-material-crud-design.md](2026-08-02-material-crud-design.md)

## เป้าหมาย

เพิ่มระบบ CRUD ครบทุก Master Data ที่เหลือในระบบ เพื่อให้ผู้ดูแลสามารถจัดการข้อมูลตั้งต้นทั้งหมดผ่าน UI ได้ โดยไม่ต้องไปแก้ใน Database โดยตรง

## ขอบเขตข้อมูล

Master Data ในระบบแบ่งเป็น 2 กลุ่ม ตามสถานะปัจจุบันของ Backend:

### Phase 1 — Master ที่มี entity และ migration แล้ว (ขาด CRUD)

ทั้ง 5 entity ถูกสร้างไว้ใน migration `1700000000005-CreateMaterialMaster` แล้ว แต่ยังไม่มี NestJS module/controller/service

| Entity | Table | Fields (required *) | ใช้กับ Material |
|---|---|---|---|
| **Unit** | `master.units` | `code`*, `nameTh`*, `nameEn`, `symbol`, `description` | lookup dropdown (unitId) |
| **Supplier** | `master.suppliers` | `code`*, `nameTh`*, `nameEn`, `taxId`, `contactName`, `telephone`, `email`, `address` | multi-select (supplierIds) |
| **MaterialModel** | `master.material_models` | `code`*, `nameTh`*, `nameEn`, `description` | lookup dropdown (modelId) |
| **DeliveryType** | `master.delivery_types` | `code`*, `nameTh`*, `nameEn`, `description` | lookup dropdown (deliveryTypeId) |
| **LoadingPoint** | `master.loading_points` | `code`*, `nameTh`*, `nameEn`, `description` | lookup dropdown (loadingPointId) |

รูปแบบตารางเหมือนกันทุกตัว: `id BIGINT PK`, unique `code`, ฟิลด์ชื่อ 2 ภาษา, `is_active`, audit fields

### Phase 2 — Master ที่ยังไม่มี entity/migration (ต้องสร้างใหม่)

Frontend มี type และหน้า stub อยู่แล้ว แต่ Backend ไม่มี entity/migration/module

| Type | ฟิลด์ที่ frontend ใช้ (จาก `src/types/master-data.ts`) |
|---|---|
| **Category** | `code`*, `name`*, `parentId?`, `sortOrder`, `description?`, `iconColor?`, `status: active/inactive` |
| **StatusItem** | `code`*, `name`*, `color`, `module`, `isDefault`, `sortOrder`, `description?`, `status` |
| **Organization** | `code`*, `name`*, `nameEn?`, `taxId?`, `address?`, `phone?`, `email?`, `website?`, `logoUrl?`, `parentId?`, `type: headquarters/branch/subsidiary/department`, `status` |

> ⚠️ **Phase 2 ต้องตัดสินใจ schema ใหม่**: ฟิลด์อาจปรับให้ตรงกับ pattern ของ Phase 1 (เพิ่ม `nameTh/nameEn` แทน `name`, ใช้ `is_active` แทน `status: string`) เพื่อความ consistent

### กฎร่วม

- ทุก Master ใช้ pattern เดียวกัน: เป็น company-wide ไม่มี `departmentId`
- `code` ต้องไม่ซ้ำ unique constraint (case-sensitive)
- `nameTh` เป็นชื่อหลัก, `nameEn` เป็นชื่อรอง (Phase 1)
- Delete เป็น soft delete (`is_active = false`), รักษา relationship, restore ได้
- Permission code ใช้ pattern `<MODULE>_<ACTION>` ตามที่ Backend ใช้
  - Phase 1: `UNIT_*`, `SUPPLIER_*`, `MATERIAL_MODEL_*`, `DELIVERY_TYPE_*`, `LOADING_POINT_*`
  - Phase 2: `CATEGORY_*`, `STATUS_*`, `ORGANIZATION_*`
- Permission ผูกกับ Role ของ Assignment ปัจจุบัน
- Backend เป็นผู้ตรวจ permission ทุก endpoint เสมอ
- ไม่รวม Stock, Lot, Price, Warehouse, Stock Movement ใน Master Data

## สถาปัตยกรรม

### Backend (NestJS)

แต่ละ Master มี module/controller/service ของตัวเอง แต่ใช้รูปแบบเดียวกัน:

```
src/modules/<master-name>/
├── <master-name>.module.ts
├── <master-name>.controller.ts
├── <master-name>.controller.spec.ts
├── <master-name>.service.ts
├── <master-name>.service.spec.ts
├── <master-name>-permissions.ts
├── <master-name>-permissions.spec.ts
└── dto/
    ├── create-<master-name>.dto.ts
    ├── update-<master-name>.dto.ts
    └── list-<master-name>-query.dto.ts
```

5 module ของ Phase 1 มีโครงสร้างเหมือนกันเป๊ะ ต่างแค่ entity class

### Frontend (Next.js)

แต่ละ Master มีโครงสร้างเหมือนกัน:

```
src/features/<master-name>/
├── api/
│   ├── <master-name>-api.ts
│   └── <master-name>-api.test.ts
├── hooks/
│   ├── use-<master-name>.ts
│   └── use-<master-name>.test.tsx
├── schemas/  (optional — ถ้าใช้ react-hook-form)
│   ├── <master-name>-schema.ts
│   └── <master-name>-schema.test.ts
└── components/
    ├── <master-name>-form-dialog.tsx
    ├── <master-name>-form-dialog.test.tsx
    ├── <master-name>-table.tsx
    └── <master-name>-list.test.tsx
```

หน้าเพจ: `src/app/(admin)/master-data/<slug>/page.tsx`

## API Contract

### Standard endpoints (ทุก master ใช้ pattern เดียวกัน)

| Method | Endpoint | Permission | Purpose |
|---|---|---|---|
| `GET` | `/<masters>` | `<MODULE>_VIEW` | list + filter + pagination |
| `GET` | `/<masters>/:id` | `<MODULE>_VIEW` | รายละเอียด 1 รายการ |
| `POST` | `/<masters>` | `<MODULE>_CREATE` | สร้าง |
| `PATCH` | `/<masters>/:id` | `<MODULE>_UPDATE` | แก้ไข (ต้องส่ง `updatedAt` เป็น concurrency token) |
| `DELETE` | `/<masters>/:id` | `<MODULE>_DELETE` | soft delete (`is_active = false`) |
| `PATCH` | `/<masters>/:id/restore` | `<MODULE>_UPDATE` | restore (เปิดใช้งานกลับ) |

### ตัวอย่อย request/response

**List query params**: `page`, `limit`, `search`, `isActive`, `sortBy`, `sortOrder`

**List response** (envelope pattern เดียวกับ Material):
```json
{
  "items": [
    {
      "id": "1",
      "code": "PCS",
      "nameTh": "ชิ้น",
      "nameEn": "Piece",
      "symbol": "ชิ้น",
      "description": null,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "...",
      "createdBy": "...",
      "updatedBy": null
    }
  ],
  "meta": { "page": 1, "limit": 20, "totalItems": 5, "totalPages": 1 }
}
```

**Create body** (Unit):
```json
{
  "code": "PCS",
  "nameTh": "ชิ้น",
  "nameEn": "Piece",
  "symbol": "ชิ้น",
  "description": null
}
```

**Update body** (ต้องมี `updatedAt`):
```json
{
  "nameTh": "ชิ้น (แก้ไข)",
  "updatedAt": "2026-08-04T00:00:00.000Z"
}
```

**Supplier** body มีฟิลด์เพิ่ม: `taxId`, `contactName`, `telephone`, `email`, `address`

## Validation และ Transaction

- ตัด whitespace หัวท้าย
- `code` uppercase normalize
- Empty optional string → `null`
- Duplicate `code` → `409 Conflict`
- Stale `updatedAt` → `409 Conflict`
- ทุก command ทำใน transaction เดียว (แม้จะเป็นแค่ table เดียว เพื่อ audit log)
- Soft delete: `is_active = false` เก็บ row เดิมไว้

## หน้าจอ Frontend

### List page (`/master-data/<slug>`)

- DataTable แสดง columns: code, nameTh, nameEn, status (active/inactive badge), createdAt
- Search box (debounced) ค้น code หรือ nameTh
- Filter `สถานะ` (active/inactive)
- Sort by code, nameTh, createdAt
- Pagination
- ปุ่ม "เพิ่ม" / "แก้ไข" / "ปิดใช้งาน" / "เปิดใช้งาน" ตาม permission

### Form dialog

- ใช้ React Hook Form + Zod
- Required: `code`, `nameTh`
- Optional: `nameEn`, description (และ field-specific เช่น symbol สำหรับ Unit, address/taxId สำหรับ Supplier)
- แสดง validation error ใกล้ช่องข้อมูล, รักษาค่าที่กรอกไว้หลัง API error
- ปิดปุ่มบันทึกระหว่าง submit
- ป้องกันการออกจาก dialog ขณะ dirty ด้วย confirmation

### Status dialog

- Confirm ปิดใช้งาน พร้อมแสดง code + nameTh
- แจ้งว่าเป็น soft delete, restore ได้

## Permission

### Phase 1 (5 modules)

| Module | Permission codes |
|---|---|
| Unit | `UNIT_VIEW`, `UNIT_CREATE`, `UNIT_UPDATE`, `UNIT_DELETE` |
| Supplier | `SUPPLIER_VIEW`, `SUPPLIER_CREATE`, `SUPPLIER_UPDATE`, `SUPPLIER_DELETE` |
| MaterialModel | `MATERIAL_MODEL_VIEW`, `MATERIAL_MODEL_CREATE`, `MATERIAL_MODEL_UPDATE`, `MATERIAL_MODEL_DELETE` |
| DeliveryType | `DELIVERY_TYPE_VIEW`, `DELIVERY_TYPE_CREATE`, `DELIVERY_TYPE_UPDATE`, `DELIVERY_TYPE_DELETE` |
| LoadingPoint | `LOADING_POINT_VIEW`, `LOADING_POINT_CREATE`, `LOADING_POINT_UPDATE`, `LOADING_POINT_DELETE` |

### Phase 2 (3 modules)

| Module | Permission codes |
|---|---|
| Category | `CATEGORY_VIEW`, `CATEGORY_CREATE`, `CATEGORY_UPDATE`, `CATEGORY_DELETE` |
| StatusItem | `STATUS_VIEW`, `STATUS_CREATE`, `STATUS_UPDATE`, `STATUS_DELETE` |
| Organization | `ORGANIZATION_VIEW`, `ORGANIZATION_CREATE`, `ORGANIZATION_UPDATE`, `ORGANIZATION_DELETE` |

Backend สร้าง permissions อัตโนมัติใน seed (เหมือน Material) — ผูกกับ menu ใหม่:
- Phase 1: สร้าง menu `MASTER_DATA_MANAGEMENT` ใต้ parent menu ที่เหมาะสม หรือต่อกับ MATERIALS_MANAGEMENTS (เนื่องจาก Material ใช้ lookup เหล่านี้)
- Phase 2: ต่อกับ menu `/master-data` เดิม

## Error Handling

| Status | ใช้กรณี |
|---|---|
| `400 Bad Request` | validation, ฟิลด์ required ขาด, code format ผิด |
| `401 Unauthorized` | token หาย/หมดอายุ |
| `403 Forbidden` | assignment ไม่มี permission |
| `404 Not Found` | ไม่พบ id ที่ระบุ |
| `409 Conflict` | code ซ้ำ หรือ `updatedAt` ล้าสมัย |

Frontend:
- 401 → login flow
- 403 → refresh permission + redirect ไปหน้าที่เข้าถึงได้
- 409 stale → reload entity ก่อนแก้ไขใหม่
- อื่นๆ → toast.error(message)

## การทดสอบ

### Backend

- Unit tests สำหรับ service (CRUD, soft delete, restore, duplicate code, concurrency)
- Controller tests (permission metadata, JwtAuthGuard, ActiveAssignmentGuard)
- DTO tests (validation, transforms)
- Permission tests (constants shape)

### Frontend

- API client tests (endpoint shape, query mapping, response types)
- Hook tests (QUERY_KEYS, invalidation, mutation pending state)
- Form dialog tests (required validation, retained values, dirty confirmation)
- List page tests (search, filter, sort, pagination, permission-aware actions)
- E2E test สำหรับ 1 master data ตัวอย่าง (Unit) ครบ flow: login → list → create → edit → deactivate → restore
- Smoke test (`scripts/smoke-units.cjs`) เป็น template สำหรับตัวอื่น

## ลำดับการ implement (สรุปย่อ)

1. **Phase 1** (ทำก่อน, 5 tasks):
   - Unit CRUD (เป็น template ให้ตัวอื่น)
   - Supplier CRUD
   - MaterialModel CRUD
   - DeliveryType CRUD
   - LoadingPoint CRUD
2. **Phase 2** (3 tasks, ต้องสร้าง entity + migration ก่อน):
   - Category CRUD
   - StatusItem CRUD
   - Organization CRUD
3. **Phase 3** (wire up หน้า master-data เดิม):
   - แก้ `src/app/(admin)/master-data/page.tsx` ให้ใช้ CRUD จริง
   - ลบ stub `categories/organizations/statuses/page.tsx` แล้ว rewrite
   - E2E + smoke tests ครบทุก master

## เกณฑ์การตรวจรับ (Acceptance Criteria)

- [ ] Backend unit/integration tests ผ่าน 100%
- [ ] Backend build + lint ผ่าน
- [ ] Frontend unit tests ผ่าน 100%
- [ ] Frontend type-check + lint + build ผ่าน
- [ ] Super admin สามารถ CRUD ทุก master data ผ่าน UI
- [ ] User ที่ไม่มี permission เห็นเฉพาะ read-only
- [ ] E2E test ผ่านสำหรับอย่างน้อย 1 master (Unit)
- [ ] Smoke test ผ่านสำหรับทุก master ใน Phase 1
- [ ] Material CRUD ยังคงใช้งานได้ + lookup dropdown ดึงจาก API จริง
