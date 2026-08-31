# CPS Admin Frontend — Refactor Plan

> **สถานะ:** Phase 0 ✅ เสร็จ (commit `eda8972`) · Phase 1 ✅ เสร็จ (commit `4a0aa41`, `1b95920`) ·
> Phase 2 ✅ เสร็จ (commit `da7d9e4`, `3196b07`, `81c452e`, `0c18126`, `62e7757`, `e30029f`) ·
> Phase 3/4 ยังไม่เริ่ม

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

## Phase 3 — "use client" Audit (เป้าหมาย: ต่อเนื่อง, ทำทีละ feature ไม่ทำทีเดียวทั้งโปรเจค)

**เตือน:** นี่เป็นงานเสี่ยงสูงถ้าทำทีเดียวทั้งหมด (213 ไฟล์) เพราะแอปนี้พึ่ง Zustand + TanStack Query (client-only) เกือบทั้งระบบ
แนะนำทำเป็น **spike เล็กๆ ก่อน** ไม่ commit เป็นแผน mass-refactor:

1. เลือก 1 feature นำร่อง (แนะนำ `categories` เพราะเล็กและมี test อยู่แล้ว)
2. แยก `category-table.tsx` เป็น:
   - `category-table.tsx` (RSC — รับ `data` เป็น prop, render แถว, ไม่มี hook)
   - `category-table-actions.tsx` (client — ปุ่ม edit/delete ที่ต้องใช้ `useState`/`onClick`)
3. วัดผล bundle size ก่อน/หลังด้วย `pnpm build` (ดู First Load JS ของ route นั้น)
4. ถ้าได้ผลชัดเจน (ลด bundle ได้จริง) ค่อยขยายไป feature อื่น ทีละ feature ไม่ทำพร้อมกันหลาย PR

**อย่าเริ่ม Phase 3 ก่อน Phase 2 เสร็จ** — เพราะถ้ายังไม่ตัดสินใจเรื่อง container/presenter จะแยก client/server component ซ้อนกับความสับสนเดิมอีกชั้น

---

## Phase 4 — Consistency & Polish (ทำแทรกได้ระหว่าง phase อื่น เพราะเป็นงานเล็ก อิสระต่อกัน)

| งาน | ไฟล์ |
|---|---|
| ย้าย `operations/tickets/[id]/page.tsx` จาก manual `useState`+`useEffect`+`apiClient` → `useQuery`/`useMutation` ผ่าน feature hook ใหม่ `features/tickets/hooks/use-tickets.ts` | `src/app/(admin)/operations/tickets/[id]/page.tsx` |
| Standardize permission naming เป็น `module.action` (lowercase.dot) ทั้งหมด, เก็บ alias เก่าไว้ deprecated ชั่วคราว | `src/constants/permissions.ts` |
| รวม permission-check logic ให้เหลือจุดเดียว (`usePermission()` เป็น public API, ให้ `auth-store.ts` เรียกใช้ helper เดียวกันแทนที่จะ implement เอง) | `src/hooks/use-permission.ts`, `src/utils/permission-utils.ts`, `src/stores/auth-store.ts` |
| ลบ duplicate `features/users/hooks/use-departments.ts` → ให้ทุก caller ใช้ `features/departments/hooks/use-departments.ts` | `src/features/users/hooks/use-departments.ts` + caller ทั้งหมด |
| ย้าย raw `<img>` ที่เป็น remote URL (7 ไฟล์ตาม REVIEW.md P4) ไปใช้ `next/image` — **ยกเว้น** QR code (data URL) กับ blob preview ที่เก็บ `<img>` ไว้ตามเดิม | `material-card-grid.tsx`, `material-detail-card.tsx`, `material-form-dialog.tsx`, `material-form-modal.tsx`, `material-table.tsx`, `product-card-grid.tsx`, `product-form-modal.tsx`, `product-table.tsx` |
| เพิ่ม `loading.tsx` ให้ critical routes ที่ยังไม่มี (materials-*, user-management) | `src/app/(admin)/materials/**/loading.tsx`, `src/app/(admin)/user-management/**/loading.tsx` |

---

## ลำดับการทำงานที่แนะนำ (Timeline)

```
สัปดาห์ 1:  Phase 0 (security, 1 PR) → Phase 1.1 (error boundaries)
สัปดาห์ 2:  Phase 1.2 (code splitting) → เริ่ม Phase 2 (ทางเลือก B ยืนยันแล้ว)
สัปดาห์ 3-4: Phase 2 (ลบ container ทางเลือก B + แตกไฟล์ใหญ่)
ต่อเนื่อง:  Phase 4 (แทรกได้ตลอด, คนละไฟล์ ไม่ชนกัน)
Backlog:    Phase 3 (spike ก่อน ยังไม่ commit เป็นแผนใหญ่)
```

## Definition of Done ต่อ Phase

- `pnpm lint`, `pnpm type-check`, `pnpm test` ผ่านทั้งหมด
- `pnpm build` ไม่มี warning ใหม่
- ไม่มี regression ใน manual smoke test ของ route ที่แก้ (login → dashboard → feature page ที่เกี่ยวข้อง)
- อัปเดต `CLAUDE.md` ถ้า phase นั้นเปลี่ยน convention ที่ระบุไว้ (เช่น Phase 2 เลือกทางเลือก B ต้องลบย่อหน้า "Container/Presenter pattern is half-adopted" ออกจาก Known Issues)
