# Prompt: เชื่อมต่อหน้า /materials เข้ากับ Backend API จริง

> **เป้าหมาย**: ทำให้หน้า "จัดการอะไหล่" (`/materials`) ใช้งานได้จริงกับ backend
> โดยใช้ API/hooks/components ที่มีอยู่แล้วทั้งหมด ไม่ต้องเขียนใหม่
> ผลลัพธ์ที่ต้องการคือผู้ใช้งาน Super Admin สามารถ "ดู / สร้าง / แก้ไข / เปิด-ปิดใช้งาน" อะไหล่ผ่าน UI ได้ครบทุกฟีเจอร์

---

## บริบทของโปรเจค

| Stack | เวอร์ชัน |
|---|---|
| Next.js (App Router, webpack) | 16.x |
| TypeScript | strict mode |
| Tailwind CSS | v4 |
| TanStack Query | v5 |
| React Hook Form + Zod | — |
| Backend | NestJS ที่ `http://localhost:3001/api/v1` (real mode) |
| Auth | ใช้ `useAuthStore` (Zustand + persist) |
| i18n / Locale | th-TH (ภาษาไทยเป็นหลัก) |

**ข้อตกลงของโปรเจค**:
- ❌ ห้ามตั้งตัวแปรชื่อ `module` (โดน lint `@next/next/no-assign-module-variable`)
- ❌ ห้ามใช้ `Remove-Item` (ใช้ `mavis-trash` แทน)
- ❌ ห้ามใช้ `&&` ใน PowerShell (ใช้ `;` แทน)
- ✅ ใช้ Next.js rewrite (`NEXT_PUBLIC_API_BASE_URL=/api`) — ห้าม hardcode localhost
- ✅ PowerShell เป็น shell หลัก
- ✅ Type ทั้งหมดต้อง import จาก `@/types/...` ห้าม inline interface
- ✅ ทุก component ต้องมีไฟล์เทียบเท่นใน `*.test.tsx`
- ✅ ทุก schema ต้องมี `*.test.ts` ที่ test pattern ครบ
- ✅ ใช้ชื่อ "อะไหล่" หรือ "วัสดุ" ใน UI ขึ้นกับบริบท (ระบบปัจจุบันใช้ "อะไหล่" สำหรับ user-facing, "วัสดุ" สำหรับ internal labels)

---

## สถานะปัจจุบันของ Material CRUD (ตรวจเมื่อ ส.ค. 2569)

### ✅ เสร็จแล้ว (ห้ามเขียนซ้ำ)

| ไฟล์ | หน้าที่ | หมายเหตุ |
|---|---|---|
| `src/features/materials/api/materials-api.ts` | API client ครบทุก endpoint | มี `list`, `get`, `lookups`, `create`, `update`, `deactivate`, `restore`, `uploadImage` |
| `src/features/materials/hooks/use-materials.ts` | TanStack Query hooks ครบ | มี `useMaterials`, `useMaterial`, `useMaterialLookups`, `useCreateMaterial`, `useUpdateMaterial`, `useDeactivateMaterial`, `useRestoreMaterial`, `useUploadMaterialImage` |
| `src/features/materials/components/material-form-dialog.tsx` | Form สร้าง/แก้ไข | 23 KB — มี image upload, lookup selects, validation ครบ |
| `src/features/materials/components/material-table.tsx` | ตารางแสดงรายการ | 12 KB — มี pagination, sort, status badge, action menu |
| `src/features/materials/components/material-filters.tsx` | Filter bar | 7.4 KB — search + unit/model/delivery/loading/supplier filters |
| `src/features/materials/components/material-status-dialog.tsx` | Confirm dialog เปลี่ยนสถานะ | 2 KB |
| `src/features/materials/components/material-form-dialog.test.tsx` | Form unit tests | 16 KB |
| `src/features/materials/components/material-list.test.tsx` | Table unit tests | 11 KB |
| `src/features/materials/hooks/use-materials.test.tsx` | Hook unit tests | (มีอยู่) |
| `src/features/materials/api/materials-api.test.ts` | API client tests | (มีอยู่) |
| `src/constants/app.ts` (QUERY_KEYS.MATERIALS) | Query keys | มี `ALL`, `LIST(params)`, `DETAIL(id)`, `LOOKUPS` |

### ❌ ยังไม่เสร็จ (ต้องทำ)

1. **`src/app/(admin)/materials/page.tsx`** — ใช้ mock data อยู่ ต้องต่อเข้า API จริง
2. **หน้า page test** — ยังไม่มี `page.test.tsx` ของ materials
3. **E2E test** — ยังไม่มีไฟล์ `tests/e2e/materials.spec.ts`
4. **Smoke test** — ยังไม่มี `scripts/smoke-materials.cjs`
5. **Permission guards** — ปุ่ม "เพิ่มอะไหล่" / "แก้ไข" / "เปิด-ปิด" ต้องใช้ `<PermissionGuard>` ครอบ

---

## Backend Contract (verified จาก probe เมื่อ ส.ค. 2569)

### Base URL: `http://localhost:3001/api/v1`
### Auth: Bearer token (JWT) ใน `Authorization` header

### `GET /materials?page=1&limit=10`

Query params: `page`, `limit`, `search`, `isActive`, `unitId`, `modelId`, `deliveryTypeId`, `loadingPointId`, `supplierId`, `sortBy`, `sortOrder`

Response (envelope):
```json
{
  "items": [
    {
      "id": "1",
      "code": "MAT-001",
      "name": "ผ้าเบรคหน้า",
      "unitId": "1",
      "deliveryTypeId": null,
      "modelId": null,
      "loadingPointId": null,
      "processLineName": null,
      "scale": null,
      "imagePath": null,
      "specification": null,
      "description": null,
      "isActive": true,
      "createdBy": "user-001",
      "updatedBy": null,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "unit": { "id": "1", "code": "PCS", "nameTh": "ชิ้น", "nameEn": "Piece", "symbol": "ชิ้น" },
      "deliveryType": null,
      "model": null,
      "loadingPoint": null,
      "suppliers": [
        { "id": "1", "code": "SUP-001", "nameTh": "บริษัท A", "nameEn": "Company A", "taxId": "...", "isActive": true }
      ]
    }
  ],
  "meta": { "page": 1, "limit": 10, "totalItems": 5, "totalPages": 1 }
}
```

### `GET /materials/lookups`

Response:
```json
{
  "units": [MaterialLookupOption],
  "suppliers": [MaterialSupplierIdentity],
  "models": [MaterialLookupOption],
  "deliveryTypes": [MaterialLookupOption],
  "loadingPoints": [MaterialLookupOption]
}
```

### `POST /materials`
Body (JSON):
```json
{
  "code": "MAT-001",           // required
  "name": "ผ้าเบรคหน้า",        // required
  "unitId": "1",               // required (positive integer string)
  "deliveryTypeId": null,
  "modelId": null,
  "loadingPointId": null,
  "processLineName": null,
  "scale": null,
  "specification": null,
  "description": null,
  "supplierIds": ["1", "2"],
  "isActive": true
}
```

### `PATCH /materials/:id`
Body เหมือน POST แต่ทุกฟิลด์ optional + ต้องมี `updatedAt` ใน payload ด้วย
```json
{ "name": "new name", "updatedAt": "2026-01-01T00:00:00.000Z" }
```

### `DELETE /materials/:id` → soft delete (`isActive = false`)

### `PATCH /materials/:id/restore` → เปิดใช้งานกลับ

### `POST /materials/images` (multipart/form-data) → upload รูป
Response: `{ "imagePath": "/uploads/materials/xxx.png", "previewUrl": "http://.../xxx.png" }`

### Permission codes (ใช้กับ PermissionGuard)
- `MATERIALS_PC_MANAGEMENTS.read` / `.create` / `.update` / `.delete` — ตัวอย่างจาก /permissions catalog
- หรือใช้ code ที่ probe ได้จาก `/permissions` endpoint โดยตรง

---

## งานที่ต้องทำ (Task List)

### Task 1: ต่อหน้า `/materials/page.tsx` เข้ากับ API จริง

**ไฟล์**: `src/app/(admin)/materials/page.tsx`

**สิ่งที่ต้องทำ**:
1. ลบ mock data (`sample` array + `MaterialRow` interface)
2. ลบ "Coming soon" callout (Card สีเหลือง)
3. ใช้ hooks ที่มีอยู่:
   - `useMaterials({ page, pageSize, search, ... })` — ดึง list
   - `useMaterialLookups()` — ดึง dropdown options
4. State ที่ต้องมี:
   - `page`, `pageSize`, `search` (debounce), `filters` (unitId, modelId, etc.)
   - `sorting: { id, desc }[]`
   - `formOpen`, `editingMaterial`
   - `statusChangeMaterial` (สำหรับเปิด dialog เปลี่ยนสถานะ)
5. Wiring ให้ครบ:
   - `<MaterialFilters value={filters} lookups={lookups} onChange={setFilters} />`
   - `<MaterialTable materials={items} page={page} ... onCreate={...} onEdit={...} onStatusChange={...} />`
   - `<MaterialFormDialog open={formOpen} onOpenChange={...} material={editingMaterial} lookups={lookups} onSave={...} onUploadImage={...} />`
   - `<MaterialStatusDialog material={statusChangeMaterial} ... />`
6. Stat cards (ทั้งหมด / ใช้งาน / ระงับ) — ใช้ `useMaterials` หลาย query หรือสร้าง `/materials/stats` endpoint
   - **ถ้าไม่มี stats endpoint**: ซ่อน stat cards ไปก่อน หรือแสดง skeleton

**Code skeleton**:
```tsx
"use client";

import * as React from "react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { ConfirmDeleteDialog, useConfirmDialog } from "@/components/forms/confirm-dialog";
import { Plus, RefreshCw, Package } from "lucide-react";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast";
import {
  useMaterials,
  useMaterialLookups,
  useCreateMaterial,
  useUpdateMaterial,
  useDeactivateMaterial,
  useRestoreMaterial,
  useUploadMaterialImage,
} from "@/features/materials/hooks/use-materials";
import { MaterialTable } from "@/features/materials/components/material-table";
import { MaterialFilters } from "@/features/materials/components/material-filters";
import { MaterialFormDialog } from "@/features/materials/components/material-form-dialog";
import { MaterialStatusDialog } from "@/features/materials/components/material-status-dialog";
import type { ListMaterialsParams, Material } from "@/features/materials/api/materials-api";
import { PERMISSIONS } from "@/constants/permissions";

export default function MaterialsPage() {
  // TODO: implement — see Task 1 above
  return <PageContainer><PageHeader title="จัดการอะไหล่" /></PageContainer>;
}
```

**อ้างอิง patterns**:
- `src/app/(admin)/user-management/departments/page.tsx` — โครงสร้างเดียวกัน (CRUD + filter + form dialog + status toggle)
- `src/app/(admin)/user-management/users/page.tsx` — ตัวอย่างที่ซับซ้อนกว่า (multiple tabs, sheet, etc.)

---

### Task 2: เขียน unit test สำหรับหน้า page

**ไฟล์**: `src/app/(admin)/materials/page.test.tsx`

**สิ่งที่ต้องทำ**: Render test + mock hooks ทั้งหมด + verify:
- แสดง stat cards / table
- กดปุ่ม "เพิ่มอะไหล่" → form dialog เปิด
- กดปุ่ม "แก้ไข" ที่ row → form dialog เปิดพร้อม pre-fill
- กดปุ่ม "เปิด/ปิด" → status dialog เปิด

**อ้างอิง**: `src/app/(admin)/user-management/departments/page.test.tsx` (ถ้ามี) หรือ test ของ page อื่น ๆ

---

### Task 3: เขียน E2E test

**ไฟล์**: `tests/e2e/materials.spec.ts`

**สิ่งที่ต้องทำ**: ใช้ pattern จาก `tests/e2e/departments.spec.ts`:
1. Login as superadmin
2. Navigate to `/materials`
3. Verify page loads with table
4. Click "เพิ่มอะไหล่" → fill form → submit → verify in list
5. Click "แก้ไข" → change name → submit → verify
6. Click "ปิดใช้งาน" → confirm → verify status changed
7. Click "เปิดใช้งาน" → confirm → verify status changed

---

### Task 4: เขียน smoke test

**ไฟล์**: `scripts/smoke-materials.cjs`

**สิ่งที่ต้องทำ**: ใช้ pattern จาก `scripts/smoke-departments.cjs`:
1. Login
2. `GET /materials?page=1&limit=10` → verify shape
3. `GET /materials/lookups` → verify shape
4. `POST /materials` (probe payload) → 201 + get id
5. `PATCH /materials/:id` (change name) → 200
6. `DELETE /materials/:id` → 200 (soft delete)
7. `PATCH /materials/:id/restore` → 200
8. `DELETE /materials/:id` (cleanup)

---

### Task 5: Permission guards

**ไฟล์**: `src/app/(admin)/materials/page.tsx`

**Action และ permission code ที่ต้องใช้** (จาก `/permissions` endpoint):

| Action | Permission code |
|---|---|
| ดูหน้า /materials | `MATERIALS_PC_MANAGEMENTS.read` (หรือ wildcard) |
| เพิ่มอะไหล่ | `MATERIALS_PC_MANAGEMENTS.create` |
| แก้ไขอะไหล่ | `MATERIALS_PC_MANAGEMENTS.update` |
| ปิด/เปิดใช้งาน | `MATERIALS_PC_MANAGEMENTS.delete` (delete covers soft-delete) |

**หมายเหตุ**: ถ้า permission code ไม่ตรง ให้ probe `/permissions` เพื่อหา code ที่ถูกต้อง แล้วเพิ่มเข้า `src/constants/permissions.ts` (PERMISSION_GROUPS) ถ้ายังไม่มี

**วิธี wrap**:
```tsx
<PermissionGuard permission={PERMISSIONS.MATERIAL_CREATE}>
  <Button onClick={...}>เพิ่มอะไหล่</Button>
</PermissionGuard>
```

---

### Task 6: อัพเดต Breadcrumb ใน page header

Breadcrumb ปัจจุบัน:
```tsx
{ label: "หน้าหลัก", href: "/dashboard" },
{ label: "คลังสินค้า" },
{ label: "อะไหล่" },
```

ตรวจสอบกับ sidebar:
- Sidebar แสดง: จัดการอะไหล่ → /materials (sub of MATERIALS_MANAGEMENTS)
- ตรวจว่า "คลังสินค้า" ตรงกับ parent menu หรือไม่ — ถ้าไม่มี ให้เปลี่ยนเป็นชื่อ parent ที่ถูกต้อง

---

## เกณฑ์การตรวจรับ (Acceptance Criteria)

ทำเสร็จเมื่อ:

- [ ] `pnpm type-check` ผ่าน ไม่มี error
- [ ] `pnpm lint` ผ่าน ไม่มี error
- [ ] `pnpm test` ผ่าน 100% (ทั้ง unit tests เดิม + ใหม่)
- [ ] หน้า `/materials` โหลดข้อมูลจาก backend จริง (ไม่ใช่ mock)
- [ ] สร้างอะไหล่ผ่าน UI แล้วปรากฏใน list
- [ ] แก้ไขอะไหล่ผ่าน UI แล้วเปลี่ยนใน list
- [ ] ปิด/เปิดใช้งานผ่าน UI แล้วเปลี่ยน badge
- [ ] Permission guards ทำงาน (ลอง login ด้วย user ที่ไม่มีสิทธิ์)
- [ ] E2E test ผ่าน 100%
- [ ] Smoke test ผ่าน 7/7 (หรือตามจำนวน check)
- [ ] Upload รูปภาพทำงาน
- [ ] Filter ทุกตัว (search, unit, model, delivery, loading, supplier) ทำงาน
- [ ] Sort ทุก column (code, name, isActive, createdAt, updatedAt) ทำงาน
- [ ] Pagination ทำงาน (เปลี่ยนหน้า + เปลี่ยน page size)
- [ ] ทุก error case แสดง toast / message ที่เหมาะสม

---

## เริ่มงาน

1. อ่านไฟล์เหล่านี้ทั้งหมดก่อนเริ่ม:
   - `src/features/materials/api/materials-api.ts`
   - `src/features/materials/hooks/use-materials.ts`
   - `src/features/materials/components/material-form-dialog.tsx`
   - `src/features/materials/components/material-table.tsx`
   - `src/features/materials/components/material-filters.tsx`
   - `src/app/(admin)/materials/page.tsx`
2. เปิด dev server + backend
3. ทำ Task 1 ก่อน (wire หน้า page) แล้วรัน smoke test ดูว่า flow ทำงาน
4. ทำ Task 2 (unit test) → Task 3 (E2E) → Task 4 (smoke) → Task 5 (permission) → Task 6 (breadcrumb)
5. รัน `pnpm type-check && pnpm lint && pnpm test && pnpm test:e2e`
6. ถ้าผ่านหมด → commit + push

---

## ห้ามทำ

- ❌ ห้ามเขียน API/hooks/components ใหม่ — ใช้ของเดิมทั้งหมด
- ❌ ห้ามเปลี่ยน schema ของ `materials-api.ts` (ใช้ type เดิม)
- ❌ ห้ามใช้ `fetch` ตรง — ต้องใช้ `apiClient` จาก `@/services/api-client`
- ❌ ห้าม hardcode URL — ใช้ `process.env.NEXT_PUBLIC_API_BASE_URL`
- ❌ ห้ามลบไฟล์ test เดิม — ต้องเพิ่ม test ใหม่ ไม่ใช่แทนที่
- ❌ ห้าม commit ถ้า `pnpm type-check` หรือ `pnpm lint` ไม่ผ่าน
- ❌ ห้าม commit `.env.local` หรือ secret

---

## ติดต่อ / สอบถาม

- เอกสาร API: `API_ENDPOINTS.md` + `scripts/probe-*.cjs` (มี probe script สำหรับทุก endpoint)
- Patterns อ้างอิง: `src/app/(admin)/user-management/departments/` (CRUD ที่เสร็จแล้วล่าสุด)
- ถ้า probe backend แล้ว shape ไม่ตรงกับ `materials-api.ts` → อัพเดท type ให้ตรง แต่ **อย่าเปลี่ยนชื่อ field** เพราะจะกระทบ form dialog / table
- ถ้ามี ambiguity → ถามก่อน commit
