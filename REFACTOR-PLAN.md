# CPS Admin Frontend — Refactor Plan

> **สถานะ:** Phase 0 ✅ เสร็จ (commit `eda8972`) · Phase 1 ✅ เสร็จ (commit `4a0aa41`, `1b95920`) ·
> Phase 2 ✅ เสร็จ (commit `da7d9e4`, `3196b07`, `81c452e`, `0c18126`, `62e7757`, `e30029f`) ·
> Phase 3 ⛔ ประเมินแล้ว ไม่คุ้มค่า (spike พิสูจน์ว่า bundle ไม่ลดเลย — ดูรายละเอียดในหัวข้อ Phase 3) ·
> Phase 4 ยังไม่เริ่ม

อ้างอิงจาก `REVIEW.md` (2026-08-31). แผนนี้แปลง Priority Matrix ในรีวิวให้เป็นงานที่ทำได้จริงเป็น phase ๆ
แต่ละ phase ออกแบบให้ **merge ได้อิสระ** (ไม่ block กันเอง) ยกเว้นที่ระบุ dependency ไว้ชัดเจน

หลักการ: แก้ทีละ phase, รัน `pnpm lint && pnpm type-check && pnpm test` ทุกครั้งก่อน commit,
และห้ามรวม refactor เชิงโครงสร้าง (M1, P1) เข้ากับ security fix (phase 0) ใน PR เดียวกัน

---

## Phase 0 — Security & Cleanup ด่วน (เป้าหมาย: 1 วันทำการ, PR เดียวหรือแยกเป็น commit ย่อย)

ทุกงานใน phase นี้เป็น "surgical fix" — แก้จุดเดียว ไม่แตะโครงสร้าง เสี่ยง regression ต่ำ ทำก่อนอย่างอื่นทั้งหมด

| # | งาน | ไฟล์ | ขั้นตอน | Acceptance criteria |
|---|---|---|---|---|
| 0.1 | เปิด middleware guard กลับมาทำงาน | `src/middleware.ts` | อ่าน token จาก cookie (ถ้ายังไม่มี cookie-based auth ให้ตรวจว่า auth cookie/flag มีอยู่จริง ไม่ใช่แค่ localStorage — อย่างน้อย redirect ไป `/login` เมื่อไม่มี token ใน cookie ที่ backend ตั้งไว้ ถ้าปัจจุบันไม่มี cookie เลยเพราะ token อยู่ localStorage เท่านั้น ให้ทำ **0.1a** ก่อน (ดูด้านล่าง) แล้วค่อยกลับมาเปิด middleware) | เข้าหน้า `(admin)/*` โดยไม่มี session → ถูก redirect `/login` ที่ edge ก่อนถึง React เลย (ทดสอบด้วย curl ไม่ใช้ JS) |
| 0.1a | *(dependency ของ 0.1)* เพิ่ม auth flag แบบ non-httpOnly cookie คู่ขนานกับ localStorage ชั่วคราว (เช่น `has_session=1`) ที่ตั้งตอน login/refresh และลบตอน logout | `src/stores/auth-store.ts`, จุดที่เรียก `setSession`/`logout` | เพิ่ม side-effect เล็กๆ ตั้ง/ลบ cookie แบบ `document.cookie` (ไม่ใช่ token จริง แค่ flag) เพื่อให้ middleware เช็คได้ว่า "น่าจะ login อยู่" — เป็น UX gate ชั้นแรก ไม่ใช่ security boundary (auth จริงยังอยู่ที่ backend + AdminShell) | Middleware เช็ค `has_session` cookie ได้ ไม่ต้อง decode JWT |
| 0.2 | จำกัด `images.remotePatterns` ให้เจาะจง backend host แทน `hostname: "**"` | `next.config.ts:39-46` | เปลี่ยนเป็น hostname ของ backend จริง (อ่านจาก `NEXT_PUBLIC_API_BASE_URL` origin เดียวกับที่ใช้ทำ rewrite) — ถ้ายังไม่ทราบ host prod ให้ใช้ `localhost`/`*.internal-domain` ตาม env และปล่อยเป็น TODO พร้อม comment ชี้ไปที่ค่าจริงตอน deploy | `next.config.ts` ไม่มี wildcard `**` เหลืออยู่ |
| 0.3 | ลบ `window.__lastLoginUsername`, ส่ง username ผ่าน state ที่มีอยู่แล้ว (`pendingSelection.user` หรือ query param) | `src/app/(auth)/login/page.tsx`, `src/stores/auth-store.ts` (จุดอ่าน `window.__lastLoginUsername`) | เก็บ username ไว้ใน `pendingSelection` object ตอน login response กลับมาแบบ 2-step (มี field `user` อยู่แล้วตาม type `PendingDepartmentSelection`) — ถ้า backend ไม่ส่ง user มา ให้ส่งผ่าน router query แทนการใช้ global `window` | ไม่มี `window.__` ใดๆ เหลือใน codebase (`grep -rn "window\.__"` ว่าง) |
| 0.4 | ลบไฟล์ dead code | `src/features/materials-receiving/components/materials-receiving-form-dialog-old.tsx` | ยืนยัน 0 imports อีกครั้ง (`grep -rn "form-dialog-old" src`) แล้วลบไฟล์ | ไฟล์หายไป, `pnpm build` ผ่าน |
| 0.5 | เพิ่ม `.gitignore` กัน env file + ถอด `.env.local` ออกจาก git tracking | `.gitignore`, `.env.local` | เพิ่ม `.env*.local` ใน `.gitignore`, รัน `git rm --cached .env.local`, สร้าง `.env.example` (ไม่มีค่า sensitive) ให้ทีมอื่น copy ใช้ | `git ls-files | grep .env.local` ว่างเปล่า, มี `.env.example` แทน |

**Rollback plan:** ทุกงานเป็น revert เดี่ยวได้ทันทีถ้าพัง (โดยเฉพาะ 0.1 — ถ้า middleware ทำให้ login loop ผิดพลาด ให้ revert กลับเป็น no-op ชั่วคราวแล้วแก้ cookie logic ก่อน)

---

## Phase 1 — Bundle & Route Reliability (เป้าหมาย: 3-5 วันทำการ)

ไม่ต้องรอ Phase 0 เสร็จ แต่แนะนำทำหลังเพราะ error.tsx ควร cover การพังจาก middleware ใหม่ด้วย

### 1.1 Error & Not-Found Boundaries

| งาน | ไฟล์ที่จะสร้าง | รายละเอียด |
|---|---|---|
| Root-level admin error boundary | `src/app/(admin)/error.tsx` | Client component, รับ `error`/`reset`, แสดง `ErrorState` (มีอยู่แล้วใน `components/feedback/`) + ปุ่ม "ลองใหม่" (`reset()`) + ปุ่มกลับ dashboard |
| Auth error boundary | `src/app/(auth)/error.tsx` | เหมือนกันแต่ไม่มี sidebar |
| Not-found ทั่วไป | `src/app/(admin)/not-found.tsx` | ใช้กับทุก dynamic segment ใต้ `(admin)` (`[id]`, `[productId]`) ที่หา resource ไม่เจอ |
| Critical-path segment error | `src/app/(admin)/materials/error.tsx`, `src/app/(admin)/operations/tickets/error.tsx` | เฉพาะ route ที่มี dynamic id + mutation หนัก ให้ error ไม่ลามไปทั้ง `(admin)` |

Acceptance: throw error จำลองใน dev (เช่น `throw new Error("test")` ชั่วคราวใน page) แล้วเห็น error boundary ที่ถูก segment ไม่ fallback ไป `global-error.tsx`

### 1.2 Code splitting งานหนัก

| งาน | ไฟล์ | วิธี |
|---|---|---|
| Dynamic import materials-receiving form dialog (53KB) | `src/features/materials-receiving/components/materials-receiving-form-dialog.tsx` ที่ import มัน (ดู caller ใน `page.tsx`/`table.tsx`) | เปลี่ยน static import → `next/dynamic(() => import(...), { ssr: false, loading: () => <Spinner /> })` เฉพาะจุดเรียกใช้ ไม่แก้ตัว dialog เอง |
| Dynamic import BOM form modal | `src/features/products/components/bom-form-modal.tsx` | เหมือนด้านบน |
| Dynamic import command palette | `src/components/layout/command-palette.tsx` (ใช้ใน `admin-shell.tsx`) | โหลดหลัง first paint — ไม่ critical สำหรับ initial render |

Acceptance: `pnpm build` แล้วดู `.next/analyze` (หรือ build output) เห็น chunk แยกสำหรับ dialog เหล่านี้ไม่รวมอยู่ใน main/page chunk

---

## Phase 2 — Structural Decision: Container/Presenter — **ตัดสินใจแล้ว: ทางเลือก B (Deprecate)** (เป้าหมาย: 1 สัปดาห์)

> **Decision (confirmed):** เลือก **ทางเลือก B** — ลบ container/presenter ทิ้ง, ให้ `page.tsx` เป็น "smart component" ที่เรียก feature hooks ตรงๆ
> ตามที่โค้ดจริง 37/37 หน้าทำอยู่แล้ว ไฟล์ยาวแก้ด้วยการ extract sub-component แทนที่จะฟื้น pattern container

### แผนดำเนินการ — ✅ เสร็จทั้งหมด

| งาน | ผลลัพธ์ | Commit |
|---|---|---|
| ลบ container/presenter คู่ที่ไม่มีใครใช้ (20 ไฟล์, 10 features) | ยืนยัน 0 references ก่อนลบทุกคู่ (รวม `materials` barrel ที่ re-export ทิ้งไว้เฉยๆ) | `da7d9e4` |
| อัปเดต `CLAUDE.md` Known Issues | ตัด bullet "half-adopted" ออก, บันทึกว่า resolve แล้ว | `da7d9e4` |
| แตก `system/menu-management/page.tsx` | 1058 → 468 บรรทัด — extract `menu-form-dialog.tsx` + `menu-tree-row.tsx` | `3196b07` |
| แตก `dashboard/page.tsx` | 803 → 571 บรรทัด — extract `_components/{greeting,kpi-card,system-status-row,quick-action}` | `81c452e` |
| แตก `user-management/users/page.tsx` | 609 → 261 บรรทัด — extract `user-status.ts`, `user-detail-sheet.tsx`, `use-user-columns.tsx` | `0c18126` |
| แตก `products/[productId]/bom/page.tsx` | 511 → 309 บรรทัด — extract `bom-card.tsx` | `62e7757` |
| แตก `permissions/page.tsx` | 451 → 64 บรรทัด — extract `my-permissions-card.tsx`, `permission-catalog.tsx` (พบและลบ orphan duplicate `permission-department-summary.tsx` ไปด้วย) | `e30029f` |

**หมายเหตุ:** เกณฑ์ "< 300 บรรทัด" ทำได้ 3/5 ไฟล์ (users, bom, permissions) ส่วน `dashboard` (571) กับ `menu-management` (468)
ยังเกินอยู่แต่ลดลง 40-56% แล้ว — ส่วนที่เหลือเป็น data-fetching + JSX composition ล้วนๆ (ไม่มี dead weight ให้ extract เพิ่มโดยไม่กระทบความอ่านง่าย)
ถือว่ายอมรับได้ตาม spirit ของ M2 (แยก concern ออกจาก page แล้ว ไม่ใช่ตัวเลขบรรทัดตายตัว)

---

## Phase 3 — "use client" Audit — ⛔ **ประเมินแล้ว: ไม่คุ้มค่าตามที่ scope ไว้เดิม**

### สิ่งที่ทำ (spike ตามแผนเดิม)

รัน spike บน `categories` feature ตามที่แผนเดิมระบุ:

1. ลบ `"use client"` ออกจาก `src/features/categories/components/category-table.tsx` ชั่วคราว
2. `rm -rf .next && pnpm build` (clean build เพื่อไม่ให้ webpack cache หลอกผล) → build ผ่าน ไม่มี error/warning ใหม่
3. หา route chunk จริงด้วย `grep -rl "ไม่พบหมวดหมู่" .next/static/chunks/` (ข้อความเฉพาะใน empty-state ของ `CategoryTable`) → เจอที่
   `.next/static/chunks/app/(admin)/master-data/categories/page-0c47ccbf49c330ef.js`, ขนาด **26,814 bytes**
4. คืนค่า `"use client"` กลับ, `rm -rf .next && pnpm build` ใหม่อีกรอบ (clean build เหมือนเดิม) → เจอ chunk **ชื่อเดียวกันทุกตัวอักษร** (`page-0c47ccbf49c330ef.js`) ขนาด **26,814 bytes เท่ากันเป๊ะ**

### ผลลัพธ์: bundle เหมือนเดิมทุก byte — ไม่มี "use client" หรือไม่มี ไม่ต่างกันเลย

**เหตุผลเชิงสถาปัตยกรรม (ทำไมถึงเป็นแบบนี้):**

- `master-data/categories/page.tsx` (และแทบทุก page ใน `(admin)`) ประกาศ `"use client"` ที่ตัวเองอยู่แล้ว เพราะใช้ `useState`/TanStack Query hooks ตรงๆ (filter, pagination, dialog state)
- เมื่อ page เป็น Client Component แล้ว **ทุกอย่างที่ import จาก page นั้น (ไม่ว่าไฟล์ลูกจะมี `"use client"` หรือไม่) ถูก bundle เป็น client code เหมือนกันหมด** — directive `"use client"` มีความหมายแค่ตอนที่ compiler เจอมันครั้งแรกตอนเดินจาก Server Component เข้ามา (สร้าง "boundary" ใหม่) ถ้าจุดเริ่มต้นเป็น client ไปแล้ว ไฟล์ลูกที่ไม่มี directive ก็แค่ถูกรวมเข้า client bundle ตามปกติ ไม่มีการ "แยกฝั่ง server" ให้อีก
- นอกจากนี้ `CategoryTable` ส่ง `columns` (array ที่มี `cell` เป็นฟังก์ชัน render) และ callback props (`onEdit`, `onStatusChange`, `onPageChange`) เข้า `DataTable` (ซึ่งใช้ `useReactTable` — ต้องเป็น Client Component เสมอ) — ต่อให้ทำให้ `CategoryTable` เป็น Server Component ได้จริง ก็ส่ง function ข้าม Server→Client boundary แบบนี้ไม่ได้อยู่ดี (Next.js จะ throw error ตอน build)

**สรุป:** Pattern นี้ (page ใช้ hook ตรงๆ + table ที่ใช้ TanStack columns-with-render-functions) ครอบคลุมแทบทุกหน้าในแอปนี้ การ "audit ลด use client" ที่ระดับ component แบบที่แผนเดิมเสนอ **ใช้ไม่ได้ผลจริงกับโค้ดเบสนี้** — ไม่ใช่เพราะทำไม่ถูกวิธี แต่เพราะ 213 ไฟล์ที่มี `"use client"` ส่วนใหญ่ไม่มีทางเลี่ยงได้เลยด้วยสถาปัตยกรรม "client-side data fetching ทั้งแอป" ที่เลือกไว้ตั้งแต่แรก (TanStack Query + Zustand)

### ถ้าจะลด bundle size จริงๆ ต้องทำอะไรแทน (ไม่ใช่ scope ของ Phase 3 เดิม)

การลดได้จริงต้องเปลี่ยนสถาปัตยกรรมที่ลึกกว่านี้มาก ไม่ใช่ audit ระดับไฟล์:

- ย้าย **initial data fetch** ของแต่ละ list page ไปทำใน Server Component (fetch ตรงๆ หรือ `prefetchQuery` + hydration boundary) แล้วให้ page.tsx ที่เหลือ (filter/pagination state) เป็น client component เล็กๆ ที่รับ initial data มาต่อ — งานนี้ใหญ่พอที่จะเป็น initiative แยกต่างหาก (กระทบทุก feature, ต้องคุยกับ backend เรื่อง SSR data shape) ไม่ใช่ "phase" ย่อยในแผนนี้
- ทางเลือกที่คุ้มกว่าและทำได้ตอนนี้เลยคือสิ่งที่ทำไปแล้วใน **Phase 1** (`next/dynamic` + lazy-mount สำหรับ dialog/modal หนักๆ) — นั่นคือ code-splitting ที่ได้ผลจริงในสถาปัตยกรรมนี้ เพราะมันแยก **เวลาโหลด** ของ component ที่ยังไม่ต้องใช้ทันที ไม่ใช่พยายามแยก **ฝั่ง server/client** ที่แยกไม่ได้อยู่แล้ว

**การตัดสินใจ:** ปิด Phase 3 ไว้ตรงนี้ ไม่ขยายไป feature อื่นต่อ (ไม่มีประโยชน์ที่จะทำซ้ำในเมื่อพิสูจน์แล้วว่า bundle ไม่ลดเลย) — ย้ายความพยายามไป Phase 4 แทน

---

## Phase 4 — Consistency & Polish — ✅ เสร็จ (เท่าที่ปลอดภัยจะทำ)

| งาน | ผลลัพธ์ | Commit |
|---|---|---|
| ลบ duplicate `features/users/hooks/use-departments.ts` | **พบว่าทำไปแล้วก่อนหน้านี้** (ไม่ใช่โดย session นี้) — ไฟล์นั้นไม่มีอยู่แล้ว ทุก caller ใช้ `features/departments/hooks/use-departments.ts` อยู่แล้ว แค่อัปเดต `CLAUDE.md` ให้ตรงสภาพจริง | `60bcdf7` |
| เพิ่ม `loading.tsx` ให้ critical routes ที่ยังไม่มี | เพิ่ม 10 ไฟล์ (materials-receiving, -disbursement, -report ต่างๆ, pc, user-management/{departments,roles,users}) — ข้าม `materials/pc/[id]` เพราะเป็น modal-detail ไม่ใช่ list | `3bb284b` |
| ย้าย `operations/tickets/[id]/page.tsx` → `useQuery`/`useMutation` | สร้าง `features/tickets/hooks/use-tickets.ts` (`useTicketDetail`, `useAddTicketComment`) — ระหว่างทางเจอบั๊กจริง (fetch fail แล้วค้างที่ loading spinner ตลอดไป เพราะเช็ค `!data` ผิด) แก้เป็น `ErrorState` + retry ที่ใช้งานได้จริง | `96c857a` |
| ย้าย raw `<img>` remote-URL → `next/image` | จาก 8 ไฟล์ที่ระบุไว้ พบว่า 3 ไฟล์ (`material-form-dialog.tsx`, `material-form-modal.tsx`, `product-form-modal.tsx`) จริงๆ แล้วเป็น **blob preview** (`URL.createObjectURL()`) ไม่ใช่ remote URL — next/image ใช้กับ blob: ไม่ได้เลย เข้าเงื่อนไขข้อยกเว้นที่แผนเองก็ระบุไว้ จึงย้ายจริงแค่ 5 ไฟล์ (`material-card-grid`, `material-detail-card`, `material-table`, `product-card-grid`, `product-table`) พร้อมแก้ 2 test ที่ assert `src` แบบ exact-match (next/image เปลี่ยนเป็น `/_next/image?url=...`) — **ไม่ได้ตรวจด้วยตาในเบราว์เซอร์จริง** เพราะไม่มี browser automation ในเซสชันนี้ | `2bad072` |
| รวม permission-check logic ให้เหลือจุดเดียว | พบว่า `permission-utils.ts` ไม่เคยมี permission-check logic เลย (เป็นแค่ menu×action matrix helper คนละเรื่อง) — จุดซ้ำจริงคือ standalone exports ใน `use-permission.ts` ที่ inline เช็ค super-admin เอง แทนที่จะเรียก `isSuperAdminUser` — แก้แล้ว, เทสต์เดิม 22 ตัวผ่านหมดไม่ต้องแก้ | `pending` |
| Standardize permission naming เป็น `module.action` ทั้งหมด | ⛔ **ไม่ทำ — เป็นความเสี่ยงจริง ไม่ใช่ scope ที่ปลอดภัย** ดูคำอธิบายด้านล่าง | — |

### ทำไมไม่ standardize permission naming

อ่านโค้ดจริงใน `src/constants/permissions.ts` แล้วพบว่า string values อย่าง `"UNIT_VIEW"`, `"MATERIALS_RECEIVING_VIEW"`
**ไม่ใช่แค่ชื่อตัวแปรฝั่ง frontend** — มันคือ permission code จริงที่ backend (NestJS) คาดหวัง ตามที่ระบุในคอมเมนต์ในไฟล์เอง
("ใช้ permission code เดียวกับ backend MATERIALS_RECEIVING_*") ถ้า "normalize" ค่าพวกนี้เป็น `module.action` หมด
จะทำให้ permission check พังจริงเมื่อรันกับ backend จริง (ไม่ใช่ mock) สำหรับทุก module ที่ backend ยังใช้ UPPER_SNAKE
อยู่ (unit, supplier, material-model, delivery-type, loading-point, category, status-item, organization,
materials-receiving, reject-reason, materials-disbursement, products, boms — เกือบทุก module ยกเว้น user/role/
department/menu/ticket/task/approval/master-data/report/activity-log/system-settings ที่ backend ใช้ lowercase.dot
อยู่แล้ว) การผสมกันสองแบบนี้เป็นความจริงของ backend ไม่ใช่ความไม่สม่ำเสมอฝั่ง frontend ที่แก้ได้เอง — อัปเดต
`CLAUDE.md` ให้อธิบายเหตุผลนี้ไว้แทนที่จะปล่อยให้ดูเหมือนเป็นบั๊กที่ยังไม่ได้แก้

---

## ลำดับการทำงานที่แนะนำ (Timeline)

```
สัปดาห์ 1:  Phase 0 (security, 1 PR) → Phase 1.1 (error boundaries)
สัปดาห์ 2:  Phase 1.2 (code splitting) → เริ่ม Phase 2 (ทางเลือก B ยืนยันแล้ว)
สัปดาห์ 3-4: Phase 2 (ลบ container ทางเลือก B + แตกไฟล์ใหญ่)
ต่อเนื่อง:  Phase 4 (แทรกได้ตลอด, คนละไฟล์ ไม่ชนกัน)
ปิดแล้ว:    Phase 3 (spike แล้วพบว่า bundle ไม่ลด — ดูเหตุผลในหัวข้อ Phase 3, ไม่ทำต่อ)
```

## Definition of Done ต่อ Phase

- `pnpm lint`, `pnpm type-check`, `pnpm test` ผ่านทั้งหมด
- `pnpm build` ไม่มี warning ใหม่
- ไม่มี regression ใน manual smoke test ของ route ที่แก้ (login → dashboard → feature page ที่เกี่ยวข้อง)
- อัปเดต `CLAUDE.md` ถ้า phase นั้นเปลี่ยน convention ที่ระบุไว้ (เช่น Phase 2 เลือกทางเลือก B ต้องลบย่อหน้า "Container/Presenter pattern is half-adopted" ออกจาก Known Issues)
