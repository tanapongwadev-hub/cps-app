# Materials Receiving Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/materials/materials-receiving` fully usable on mobile, tablet, and desktop with mobile cards and viewport-safe dialogs while preserving existing receiving behavior.

**Architecture:** Keep page API and hook wiring unchanged. Evolve `MaterialsReceivingTable` into an adaptive list that renders cards below `md` and the existing table at `md` and above, sharing status/action rules. Apply viewport-safe shells and sticky mobile actions to the existing dialogs, then protect the route with component and Playwright coverage.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix Dialog, Vitest, Testing Library, Playwright.

## Global Constraints

- Mobile is below `768px`; the list switches to the desktop table at Tailwind `md` (`768px`).
- Do not change backend endpoints, API payloads, permissions, validation, receiving calculations, statuses, or mutation behavior.
- Preserve the existing uncommitted supplier-loading and form-reset changes in `materials-receiving-form-dialog.tsx`.
- Do not introduce document-level horizontal overflow at `390x844`, `768x1024`, or `1280x720`.
- Keep desktop sorting and table content unchanged.
- Reuse existing design tokens and components; add no dependency.

## File Structure

- `materials-receiving-table.tsx`: mobile cards, desktop table, shared action rules, states, and pagination.
- `materials-receiving-filters.tsx`: overflow-safe primary and advanced filters.
- `materials-receiving-form-dialog.tsx`: viewport-safe form and sticky mobile actions.
- `materials-receiving-detail-dialog.tsx`: viewport-safe detail, QR/package layout, and actions.
- `confirm-dialog.tsx`: responsive confirmation shell and buttons.
- Existing/new colocated tests: component behavior and responsive markers.
- `tests/e2e/materials-receiving-responsive.spec.ts`: approved viewport coverage.

---

### Task 1: Adaptive Receiving List

**Files:**
- Modify: `src/features/materials-receiving/components/materials-receiving-table.test.tsx`
- Modify: `src/features/materials-receiving/components/materials-receiving-table.tsx`

**Interfaces:**
- Consumes: existing `MaterialsReceivingTableProps` unchanged.
- Produces: `data-testid="materials-receiving-cards"` below `md` and `data-testid="materials-receiving-table"` at `md` and above.
- Produces: one action policy: view for all; edit/confirm/delete for `draft`; cancel except for `cancelled`.

- [ ] **Step 1: Write failing card/table tests**

Add assertions after rendering one row:

```tsx
expect(screen.getByTestId("materials-receiving-cards")).toHaveClass("md:hidden");
expect(screen.getByTestId("materials-receiving-table")).toHaveClass("hidden", "md:block");
const card = screen.getByRole("article", {
  name: "รายการรับเข้า CCI-20260809-001",
});
expect(card).toHaveTextContent("MAT-A");
expect(card).toHaveTextContent("น้ำมันปาล์ม");
expect(card).toHaveTextContent("บริษัท A");
expect(card).toHaveTextContent("1,000");
expect(card).toHaveTextContent("5 ใบ");
expect(card).toHaveTextContent("SUP-20260801");
```

Add a callback test:

```tsx
await user.click(screen.getByRole("button", {
  name: "เปิดเมนูการจัดการ CCI-20260809-001",
}));
await user.click(screen.getByRole("menuitem", { name: /ดูรายละเอียด/ }));
expect(onView).toHaveBeenCalledWith(row);
```

- [ ] **Step 2: Run RED**

Run: `pnpm test -- src/features/materials-receiving/components/materials-receiving-table.test.tsx`

Expected: FAIL because the two presentation markers and labelled mobile trigger do not exist.

- [ ] **Step 3: Implement the minimal adaptive list**

Render cards before the desktop table:

```tsx
<div data-testid="materials-receiving-cards" className="space-y-3 p-3 md:hidden">
  {receivings.map((receiving) => (
    <article
      key={receiving.id}
      aria-label={`รายการรับเข้า ${receiving.internalLotNo}`}
      className="min-w-0 rounded-lg border bg-background p-4 shadow-sm"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-mono text-sm font-semibold">
            {receiving.internalLotNo}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(receiving.receiveDate)}
          </p>
        </div>
        <StatusBadge status={receiving.status} />
      </div>
      <dl className="mt-4 grid min-w-0 grid-cols-2 gap-3 text-sm">
        <CardField
          className="col-span-2"
          label="วัสดุ"
          value={receiving.material
            ? `${receiving.material.code} — ${receiving.material.name}`
            : "—"}
        />
        <CardField
          className="col-span-2"
          label="ผู้จัดจำหน่าย"
          value={receiving.supplier?.nameTh ?? "—"}
        />
        <CardField label="จำนวนรับ" value={formatNumber(receiving.receiveQuantity)} />
        <CardField label="บรรจุภัณฑ์" value={`${receiving.packageCount} ใบ`} />
        <CardField
          className="col-span-2"
          label="Supplier Lot"
          mono
          value={receiving.supplierLotNo ?? "—"}
        />
      </dl>
      <div className="mt-3 flex justify-end border-t pt-2">
        <ReceivingActions
          presentation="menu"
          receiving={receiving}
          onView={onView}
          onEdit={onEdit}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      </div>
    </article>
  ))}
</div>
```

Use a local `CardField` helper with props `{ label: string; value: string; className?: string; mono?: boolean }`. Extract the current action conditions into a local `ReceivingActions` helper so cards and table invoke identical callbacks. Label the menu trigger with the current Internal Lot.

Wrap the current `<Table className="min-w-[900px]">` element, from its opening tag through its matching closing tag, in `<div data-testid="materials-receiving-table" className="hidden overflow-x-auto md:block">`. Do not change the table header, rows, sorting callbacks, or cell content while moving it.

Move pagination outside the table-only wrapper. Render three card skeletons for mobile while retaining row skeletons for desktop. Keep empty/error states shared.

- [ ] **Step 4: Run GREEN**

Run: `pnpm test -- src/features/materials-receiving/components/materials-receiving-table.test.tsx`

Expected: PASS, including existing sort/status/action tests.

- [ ] **Step 5: Commit**

```powershell
git add src/features/materials-receiving/components/materials-receiving-table.tsx src/features/materials-receiving/components/materials-receiving-table.test.tsx
git commit -m "feat: add responsive receiving cards"
```

---

### Task 2: Responsive Header, Filters, and Pagination

**Files:**
- Modify: `src/app/(admin)/materials/materials-receiving/page.tsx`
- Modify: `src/features/materials-receiving/components/materials-receiving-filters.tsx`
- Modify: `src/features/materials-receiving/components/materials-receiving-table.test.tsx`
- Modify: `src/features/materials-receiving/components/materials-receiving-table.tsx`

**Interfaces:**
- Consumes: existing `PageHeader`, `MaterialsReceivingFiltersProps`, and pagination callbacks unchanged.
- Produces: full-width mobile header actions, overflow-safe filters, and stacked mobile pagination.

- [ ] **Step 1: Write a failing pagination layout test**

```tsx
it("uses stacked touch-friendly pagination on mobile", () => {
  renderList({ receivings: [baseRow], totalItems: 40 });
  expect(screen.getByTestId("materials-receiving-pagination")).toHaveClass(
    "flex-col",
    "sm:flex-row",
  );
  expect(screen.getByRole("button", { name: "หน้าก่อนหน้า" })).toHaveClass(
    "h-10",
    "w-10",
  );
  expect(screen.getByRole("button", { name: "หน้าถัดไป" })).toHaveClass(
    "h-10",
    "w-10",
  );
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm test -- src/features/materials-receiving/components/materials-receiving-table.test.tsx`

Expected: FAIL because the pagination marker and mobile touch-target classes are missing.

- [ ] **Step 3: Implement responsive controls**

In the page header, use:

```tsx
<div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
```

Add `w-full sm:w-auto` to Refresh and Create without changing handlers or permissions.

In filters:

- Outer padding: `p-3 sm:p-4`.
- Both flex rows: add `min-w-0`.
- Search: `min-w-0 basis-full sm:min-w-[200px] sm:basis-auto`.
- Advanced toggle and reset: `w-full justify-center sm:w-auto`.
- Preserve `aria-expanded`, filter setters, and desktop wrapped layout.

In pagination, add `data-testid="materials-receiving-pagination"` and use `h-10 w-10 sm:h-8 sm:w-8` for Previous/Next.

- [ ] **Step 4: Run GREEN and type-check**

```powershell
pnpm test -- src/features/materials-receiving/components/materials-receiving-table.test.tsx
pnpm type-check
```

Expected: both PASS.

- [ ] **Step 5: Commit**

```powershell
git add "src/app/(admin)/materials/materials-receiving/page.tsx" src/features/materials-receiving/components/materials-receiving-filters.tsx src/features/materials-receiving/components/materials-receiving-table.tsx src/features/materials-receiving/components/materials-receiving-table.test.tsx
git commit -m "fix: make receiving page controls responsive"
```

---

### Task 3: Mobile-Safe Create and Edit Form

**Files:**
- Modify: `src/features/materials-receiving/components/materials-receiving-form-dialog.test.tsx`
- Modify: `src/features/materials-receiving/components/materials-receiving-form-dialog.tsx`

**Interfaces:**
- Consumes: `MaterialsReceivingFormDialogProps` and all existing form functions unchanged.
- Produces: `data-testid="materials-receiving-form-dialog"` and `data-testid="materials-receiving-form-actions"`.

- [ ] **Step 1: Write failing responsive-shell tests**

```tsx
it("uses a viewport-safe shell and sticky mobile actions", async () => {
  render(
    <MaterialsReceivingFormDialog
      open
      onOpenChange={vi.fn()}
      lookups={lookups}
      onSave={vi.fn()}
    />,
  );
  const dialog = await screen.findByTestId("materials-receiving-form-dialog");
  expect(dialog).toHaveClass(
    "w-[calc(100vw-1rem)]",
    "max-h-[calc(100dvh-1rem)]",
    "p-0",
    "sm:p-6",
  );
  expect(screen.getByTestId("materials-receiving-form-actions")).toHaveClass(
    "sticky",
    "bottom-0",
  );
  expect(screen.getByRole("button", { name: "ยกเลิก" })).toHaveClass(
    "w-full",
    "sm:w-auto",
  );
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm test -- src/features/materials-receiving/components/materials-receiving-form-dialog.test.tsx`

Expected: FAIL because responsive markers/classes are absent.

- [ ] **Step 3: Implement presentation-only form changes**

Change only markup from the component's `return` downward:

```tsx
<DialogContent
  data-testid="materials-receiving-form-dialog"
  className="grid w-[calc(100vw-1rem)] max-w-4xl max-h-[calc(100dvh-1rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 sm:p-6"
>
```

Wrap the header with `px-4 pt-4 pr-12 sm:px-0 sm:pt-0`. Make the form the scroll container using `min-h-0 overflow-y-auto px-4 pb-4 sm:px-0 sm:pb-0`. Keep existing `md:grid-cols-*` form grids so mobile remains one column.

Add `min-w-0` to preview rows, `break-all` to lot codes, and change package preview to `grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6`.

Use this footer without changing current buttons or submit flow:

```tsx
<DialogFooter
  data-testid="materials-receiving-form-actions"
  className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
>
```

Add `w-full sm:w-auto` to Cancel and Save. Do not modify effects, supplier requests, validation, attachments, `handleSubmit`, or payload construction.

- [ ] **Step 4: Run GREEN**

Run: `pnpm test -- src/features/materials-receiving/components/materials-receiving-form-dialog.test.tsx`

Expected: PASS, including create, edit `updatedAt`, immutable fields, and server errors.

- [ ] **Step 5: Verify the user's existing changes remain**

Run: `git diff -- src/features/materials-receiving/components/materials-receiving-form-dialog.tsx`

Expected: edit-mode `materialSuppliers` pre-population, `suppliersLoading`, and filtered supplier request remain present.

- [ ] **Step 6: Commit**

```powershell
git add src/features/materials-receiving/components/materials-receiving-form-dialog.tsx src/features/materials-receiving/components/materials-receiving-form-dialog.test.tsx
git commit -m "fix: make receiving form mobile safe"
```

---

### Task 4: Mobile-Safe Detail and Confirmation Dialogs

**Files:**
- Create: `src/features/materials-receiving/components/materials-receiving-detail-dialog.test.tsx`
- Modify: `src/features/materials-receiving/components/materials-receiving-detail-dialog.tsx`
- Modify: `src/components/forms/confirm-dialog.tsx`

**Interfaces:**
- Consumes: `MaterialsReceivingDetailDialogProps` and `ConfirmDialogProps` unchanged.
- Produces: `data-testid="materials-receiving-detail-dialog"` and `data-testid="materials-receiving-detail-actions"`.

- [ ] **Step 1: Create a failing detail-dialog test**

Create this complete `MaterialsReceivingDetail` fixture and assert:

```tsx
const detail: MaterialsReceivingDetail = {
  id: "mr-001",
  internalLotNo: "CCI-20260809-001",
  organizationId: "1",
  supplierId: "sup-001",
  materialId: "mat-001",
  unitId: "unit-001",
  receiveQuantity: "1000",
  packingQuantity: 200,
  packageCount: 1,
  piecesQuantity: null,
  supplierLotNo: "SUP-20260801",
  supplierProductionDate: "2026-08-01",
  receiveDate: "2026-08-09",
  status: "draft",
  poNo: "PO-001",
  materialType: "PCS",
  ratio: null,
  attachmentUrl: null,
  attachmentName: null,
  remark: null,
  qrCode: null,
  qrPayload: null,
  piecesQrCode: null,
  piecesQrPayload: null,
  confirmedBy: null,
  confirmedAt: null,
  cancelledBy: null,
  cancelledAt: null,
  cancelReason: null,
  createdBy: "admin",
  updatedBy: "admin",
  createdAt: "2026-08-09T00:00:00.000Z",
  updatedAt: "2026-08-09T00:00:00.000Z",
  supplier: { id: "sup-001", code: "SUP-001", nameTh: "บริษัท A", nameEn: "Co A" },
  material: { id: "mat-001", code: "MAT-A", name: "น้ำมันปาล์ม" },
  unit: { id: "unit-001", code: "KG", nameTh: "กิโลกรัม", nameEn: "Kilogram" },
  packages: [{
    id: "pkg-001",
    materialReceivingId: "mr-001",
    packageNo: 1,
    lotDetailNo: "CCI-20260809-001-001",
    quantity: "1000",
    qrCode: null,
    status: "available",
  }],
};
```

```tsx
render(
  <MaterialsReceivingDetailDialog
    open
    onOpenChange={vi.fn()}
    receiving={detail}
    onEdit={onEdit}
    onConfirm={vi.fn()}
    onCancel={vi.fn()}
  />,
);
expect(screen.getByTestId("materials-receiving-detail-dialog")).toHaveClass(
  "w-[calc(100vw-1rem)]",
  "max-h-[calc(100dvh-1rem)]",
  "p-0",
  "sm:p-6",
);
expect(screen.getByText(detail.internalLotNo)).toHaveClass("break-all");
expect(screen.getByTestId("materials-receiving-detail-actions")).toHaveClass(
  "sticky",
  "bottom-0",
);
await user.click(screen.getByRole("button", { name: "แก้ไข" }));
expect(onEdit).toHaveBeenCalledWith(detail);
```

- [ ] **Step 2: Run RED**

Run: `pnpm test -- src/features/materials-receiving/components/materials-receiving-detail-dialog.test.tsx`

Expected: FAIL because the detail markers and responsive classes are absent.

- [ ] **Step 3: Implement the responsive detail shell**

Use the form's viewport-safe `DialogContent` dimensions. Separate header and scrollable body. Apply:

- `break-all` to Internal Lot, Supplier Lot, and package identifiers.
- `max-w-full h-auto` to QR images.
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` to package cards.
- `min-w-0` to cards and `InfoRow` value containers.
- `flex-col sm:flex-row sm:flex-wrap sm:justify-end` to actions.
- `w-full sm:w-auto` to each action.
- The same sticky mobile action shell as the form, identified by `materials-receiving-detail-actions`.

Keep QR copy/download handlers, loading state, and status conditions unchanged.

- [ ] **Step 4: Make confirmation dialogs viewport safe**

Pass this class to the current `DialogContent`:

```tsx
className="w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] p-4 sm:p-6"
```

Add `min-w-0` and `break-words` to the description wrapper. Add `w-full sm:w-auto` to Cancel and Confirm. Preserve variants, loading, autofocus, and mobile button order.

- [ ] **Step 5: Run GREEN**

```powershell
pnpm test -- src/features/materials-receiving/components/materials-receiving-detail-dialog.test.tsx src/features/materials-receiving/components/materials-receiving-form-dialog.test.tsx src/features/materials-receiving/components/materials-receiving-table.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/materials-receiving/components/materials-receiving-detail-dialog.tsx src/features/materials-receiving/components/materials-receiving-detail-dialog.test.tsx src/components/forms/confirm-dialog.tsx
git commit -m "fix: make receiving dialogs responsive"
```

---

### Task 5: Route-Level Responsive Regression Coverage

**Files:**
- Create: `tests/e2e/materials-receiving-responsive.spec.ts`

**Interfaces:**
- Consumes: `test`, `expect`, and `loginAsSuperAdmin` from `tests/e2e/fixtures.ts`.
- Produces: route checks at `390x844`, `768x1024`, and `1280x720`.

- [ ] **Step 1: Write the responsive Playwright test**

```ts
import { test, expect } from "./fixtures";

const viewports = [
  { name: "mobile", width: 390, height: 844, cards: true },
  { name: "tablet", width: 768, height: 1024, cards: false },
  { name: "desktop", width: 1280, height: 720, cards: false },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name}: receiving page fits the viewport`, async ({
    page,
    loginAsSuperAdmin,
  }) => {
    await page.setViewportSize(viewport);
    await loginAsSuperAdmin();
    await page.goto("/materials/materials-receiving");
    await expect(page.getByRole("heading", { name: /Materials Receiving/ })).toBeVisible();
    if (viewport.cards) {
      await expect(page.getByTestId("materials-receiving-cards")).toBeVisible();
      await expect(page.getByTestId("materials-receiving-table")).toBeHidden();
    } else {
      await expect(page.getByTestId("materials-receiving-cards")).toBeHidden();
      await expect(page.getByTestId("materials-receiving-table")).toBeVisible();
    }
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
}
```

Add a mobile test that expands `ตัวกรองเพิ่มเติม`, opens Create, and validates the dialog bounding box:

```ts
const box = await page.getByTestId("materials-receiving-form-dialog").boundingBox();
expect(box).not.toBeNull();
expect(box!.x).toBeGreaterThanOrEqual(0);
expect(box!.x + box!.width).toBeLessThanOrEqual(390);
expect(box!.y).toBeGreaterThanOrEqual(0);
expect(box!.y + box!.height).toBeLessThanOrEqual(844);
```

- [ ] **Step 2: Run the E2E test**

Run with NestJS available at `http://localhost:3001/api/v1`:

`pnpm exec playwright test tests/e2e/materials-receiving-responsive.spec.ts --project=chromium`

Expected: PASS at all three viewports. If the API cannot start because local dependencies or database services are unavailable, record the environmental blocker and do not claim E2E passed.

- [ ] **Step 3: Fix only evidence-backed overflow**

Inspect the failing element's bounding box and constrain the narrowest responsible container. Do not add global `overflow-x-hidden`, because that would hide rather than fix overflow.

- [ ] **Step 4: Run complete verification**

```powershell
pnpm test -- src/features/materials-receiving/components/materials-receiving-table.test.tsx src/features/materials-receiving/components/materials-receiving-form-dialog.test.tsx src/features/materials-receiving/components/materials-receiving-detail-dialog.test.tsx
pnpm type-check
pnpm lint
pnpm exec playwright test tests/e2e/materials-receiving-responsive.spec.ts --project=chromium
```

Expected: all available commands PASS; report any backend-blocked E2E separately.

- [ ] **Step 5: Inspect final scope**

```powershell
git status --short
git diff --check
git diff --stat
```

Expected: only approved responsive files, tests, and design/plan documents appear. No API, hook, DTO, or calculation file is changed.

- [ ] **Step 6: Commit**

```powershell
git add tests/e2e/materials-receiving-responsive.spec.ts
git commit -m "test: cover responsive receiving workflow"
```
