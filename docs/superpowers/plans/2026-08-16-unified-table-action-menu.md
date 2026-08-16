# Unified Table Action Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every actionable list-table row expose all row actions through one consistent three-dot menu.

**Architecture:** Keep feature-specific action predicates and callbacks inside each feature table, but render them through the shared `ActionMenu`. Strengthen the shared component's responsive trigger and menu-item presentation first, then migrate each remaining inline or bespoke implementation independently with focused regression tests.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Radix Dropdown Menu, Lucide React, Vitest, Testing Library, Playwright

## Global Constraints

- Every actionable list row displays exactly one `MoreHorizontal` trigger.
- The trigger is at least 40 by 40 pixels on mobile and may be compact on larger screens.
- Existing callbacks, routes, permission checks, status checks, disabled states, and confirmation flows must remain unchanged; actions may move only to keep common actions before danger actions.
- Common actions precede destructive or cancelling actions; danger actions retain danger styling and a separator.
- Trigger and menu clicks must not activate clickable rows.
- Detail-only tables without an action column remain unchanged.
- No API, payload, backend contract, permission, or status-transition changes.

---

### Task 1: Shared responsive action menu

**Files:**

- Create: `src/components/tables/action-menu.test.tsx`
- Modify: `src/components/tables/action-menu.tsx`

**Interfaces:**

- Consumes: existing `ActionItem` with `label`, `icon`, `onClick`, `variant`, `disabled`, and `hidden`.
- Produces: `ActionMenu({ items, label })` with one responsive three-dot trigger, touch-friendly items, propagation isolation, hidden filtering, and danger separation.

- [ ] **Step 1: Write the failing shared-component tests**

Create tests that render the real component and assert the desired public behavior:

```tsx
it("renders one responsive three-dot trigger and touch-friendly menu items", async () => {
  const user = userEvent.setup();
  render(<ActionMenu label="จัดการ MAT-001" items={[{ label: "แก้ไข", onClick: vi.fn() }]} />);

  const trigger = screen.getByRole("button", { name: "จัดการ MAT-001" });
  expect(trigger).toHaveClass("h-10", "w-10", "sm:h-8", "sm:w-8");
  expect(trigger.querySelector("svg")).toBeInTheDocument();
  await user.click(trigger);
  expect(screen.getByRole("menuitem", { name: "แก้ไข" })).toHaveClass("min-h-10");
});

it("filters hidden actions, separates danger actions, and invokes callbacks", async () => {
  const user = userEvent.setup();
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <ActionMenu
      items={[
        { label: "แก้ไข", onClick: onEdit },
        { label: "ซ่อน", hidden: true, onClick: vi.fn() },
        { label: "ลบ", variant: "danger", onClick: onDelete },
      ]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "เมนู" }));
  expect(screen.queryByRole("menuitem", { name: "ซ่อน" })).not.toBeInTheDocument();
  expect(screen.getByRole("separator")).toBeInTheDocument();
  await user.click(screen.getByRole("menuitem", { name: "ลบ" }));
  expect(onDelete).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the new suite and verify RED**

Run: `pnpm test -- src/components/tables/action-menu.test.tsx`

Expected: FAIL because the current trigger is `h-7 w-7` and menu items do not have `min-h-10`.

- [ ] **Step 3: Implement the minimal shared presentation change**

In `ActionMenu`, keep all existing filtering/callback behavior and change only the responsive classes:

```tsx
<Button
  variant="ghost"
  size="icon-sm"
  className="h-10 w-10 sm:h-8 sm:w-8"
  aria-label={label}
  onClick={(event) => event.stopPropagation()}
>
  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
</Button>
```

Add `min-h-10` to `DropdownMenuItem`; preserve the existing `danger` class and separator rule.

- [ ] **Step 4: Run the shared suite and verify GREEN**

Run: `pnpm test -- src/components/tables/action-menu.test.tsx`

Expected: 2 tests PASS with no warnings.

- [ ] **Step 5: Commit**

```bash
git add src/components/tables/action-menu.tsx src/components/tables/action-menu.test.tsx
git commit -m "refactor: standardize table action menu"
```

---

### Task 2: Materials table action consolidation

**Files:**

- Create: `src/features/materials/components/material-table.test.tsx`
- Modify: `src/features/materials/components/material-table.tsx`

**Interfaces:**

- Consumes: `ActionMenu` and `ActionItem[]` from Task 1; existing `MaterialTableProps` callbacks remain unchanged.
- Produces: one row-specific action trigger containing detail, edit, enable/disable, and stock-balance actions.

- [ ] **Step 1: Write a failing row-action test**

Mock `next/navigation` with `push: vi.fn()`, render one material with every callback, and assert:

```tsx
const trigger = screen.getByRole("button", { name: "จัดการวัสดุ MAT-001" });
expect(screen.queryByRole("button", { name: "แก้ไข MAT-001" })).not.toBeInTheDocument();
await user.click(trigger);
expect(screen.getByRole("menuitem", { name: "ดูรายละเอียด" })).toBeInTheDocument();
expect(screen.getByRole("menuitem", { name: "แก้ไข" })).toBeInTheDocument();
expect(screen.getByRole("menuitem", { name: "ปิดใช้งาน" })).toBeInTheDocument();
expect(screen.getByRole("menuitem", { name: "ดูสต็อก" })).toBeInTheDocument();
await user.click(screen.getByRole("menuitem", { name: "ดูสต็อก" }));
expect(onViewStockBalance).toHaveBeenCalledWith(material);
```

Add a second assertion for an inactive material that expects `เปิดใช้งาน` and invokes `onStatusChange(material)`.

- [ ] **Step 2: Run the material-table suite and verify RED**

Run: `pnpm test -- src/features/materials/components/material-table.test.tsx`

Expected: FAIL because the row currently renders four separate icon buttons and no `จัดการวัสดุ MAT-001` trigger.

- [ ] **Step 3: Replace inline buttons with one action array**

Import `ActionMenu` and build the array inside the row map:

```tsx
const actions: ActionItem[] = [
  {
    label: "ดูรายละเอียด",
    icon: <Eye className="size-4" />,
    hidden: !href,
    onClick: () => href && router.push(href),
  },
  {
    label: "แก้ไข",
    icon: <Pencil className="size-4" />,
    hidden: !onEdit,
    onClick: () => onEdit?.(material),
  },
  {
    label: "ดูสต็อก",
    icon: <Scale className="size-4" />,
    hidden: !onViewStockBalance,
    onClick: () => onViewStockBalance?.(material),
  },
  {
    label: material.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน",
    icon: material.isActive ? <Power className="size-4" /> : <RotateCcw className="size-4" />,
    hidden: !onStatusChange,
    variant: material.isActive ? "danger" : "default",
    onClick: () => onStatusChange?.(material),
  },
];
```

Render only `<ActionMenu label={`จัดการวัสดุ ${material.code}`} items={actions} />` in the action cell. Keep the row's existing `button, a` click guard.

- [ ] **Step 4: Run the material tests and verify GREEN**

Run: `pnpm test -- src/features/materials/components/material-table.test.tsx src/features/materials/components/material-list.test.tsx`

Expected: new action-menu tests PASS; record any pre-existing `material-list` baseline failures separately and do not alter unrelated list behavior.

- [ ] **Step 5: Commit**

```bash
git add src/features/materials/components/material-table.tsx src/features/materials/components/material-table.test.tsx
git commit -m "refactor: consolidate material row actions"
```

---

### Task 3: Goods receipt action consolidation

**Files:**

- Create: `src/features/goods-receipts/components/goods-receipt-table.test.tsx`
- Modify: `src/features/goods-receipts/components/goods-receipt-table.tsx`

**Interfaces:**

- Consumes: shared `ActionMenu`; existing goods-receipt callbacks and `draft`/`posted` status values.
- Produces: one trigger with the exact action visibility currently encoded by inline buttons.

- [ ] **Step 1: Write failing draft and posted action tests**

Render a draft receipt with every callback and verify its menu exposes `ดูรายละเอียด`, `แก้ไข`, `รับรองเอกสาร`, and `ลบ`, but not `ยกเลิกเอกสาร`. Click `รับรองเอกสาร` and assert `onPost(receipt)`.

Render a posted receipt and verify its menu exposes `ดูรายละเอียด` and `ยกเลิกเอกสาร`, but not draft-only actions. Click `ยกเลิกเอกสาร` and assert `onCancel(receipt)`.

Use the row trigger label `จัดการรายการรับสินค้า ${receipt.receiptNo ?? receipt.id}` and assert that the separate buttons identified by their old titles are absent.

- [ ] **Step 2: Run the goods-receipt suite and verify RED**

Run: `pnpm test -- src/features/goods-receipts/components/goods-receipt-table.test.tsx`

Expected: FAIL because no three-dot trigger exists.

- [ ] **Step 3: Implement the status-preserving action array**

Replace the inline button group with `ActionMenu` items whose `hidden` conditions exactly mirror the old JSX:

```tsx
[
  { label: "ดูรายละเอียด", hidden: !onView, onClick: () => onView?.(receipt) },
  {
    label: "แก้ไข",
    hidden: !onEdit || receipt.status !== "draft",
    onClick: () => onEdit?.(receipt),
  },
  {
    label: "รับรองเอกสาร",
    hidden: !onPost || receipt.status !== "draft",
    onClick: () => onPost?.(receipt),
  },
  {
    label: "ยกเลิกเอกสาร",
    variant: "danger",
    hidden: !onCancel || receipt.status !== "posted",
    onClick: () => onCancel?.(receipt),
  },
  {
    label: "ลบ",
    variant: "danger",
    hidden: !onDelete || receipt.status !== "draft",
    onClick: () => onDelete?.(receipt),
  },
];
```

Retain the corresponding Lucide icons and narrow/right-align the action header and cell.

- [ ] **Step 4: Run the suite and verify GREEN**

Run: `pnpm test -- src/features/goods-receipts/components/goods-receipt-table.test.tsx`

Expected: all draft/posted action tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/goods-receipts/components/goods-receipt-table.tsx src/features/goods-receipts/components/goods-receipt-table.test.tsx
git commit -m "refactor: consolidate goods receipt actions"
```

---

### Task 4: Permissions action consolidation

**Files:**

- Modify: `src/app/(admin)/permissions/page.test.tsx`
- Modify: `src/app/(admin)/permissions/page.tsx`

**Interfaces:**

- Consumes: shared `ActionMenu`; existing `onManageDepartments`, `onEdit`, and `onDelete` handlers.
- Produces: one permission-row trigger containing all three actions.

- [ ] **Step 1: Add a failing super-admin permission-row test**

Make the auth and permission-hook mocks configurable, return one permission from `usePermissions`, and assert:

```tsx
expect(screen.queryByRole("button", { name: "กำหนดแผนก" })).not.toBeInTheDocument();
await user.click(screen.getByRole("button", { name: "เมนู permission.read" }));
expect(screen.getByRole("menuitem", { name: "กำหนดแผนก" })).toBeInTheDocument();
expect(screen.getByRole("menuitem", { name: "แก้ไข" })).toBeInTheDocument();
expect(screen.getByRole("menuitem", { name: "ลบ" })).toBeInTheDocument();
```

Click `กำหนดแผนก` and assert the mocked `DepartmentPermissionDialog` receives the selected permission or renders an `open` marker.

- [ ] **Step 2: Run the permission page suite and verify RED**

Run: `pnpm test -- "src/app/(admin)/permissions/page.test.tsx"`

Expected: FAIL because `กำหนดแผนก` is currently a separate outline button.

- [ ] **Step 3: Move manage-departments into `ActionMenu`**

Remove the wrapper and separate button. Prepend this item to the existing array:

```tsx
{
  label: "กำหนดแผนก",
  icon: <Building2 className="h-3.5 w-3.5" />,
  onClick: onManageDepartments,
}
```

Preserve edit and danger-styled delete items and the existing row-specific label.

- [ ] **Step 4: Run the permission tests and verify GREEN**

Run: `pnpm test -- "src/app/(admin)/permissions/page.test.tsx" "src/app/(admin)/permissions/permission-department-summary.test.tsx"`

Expected: permission visibility and row-menu tests PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/permissions/page.tsx" "src/app/(admin)/permissions/page.test.tsx"
git commit -m "refactor: move permission actions into menu"
```

---

### Task 5: Materials receiving migration and final verification

**Files:**

- Modify: `src/features/materials-receiving/components/materials-receiving-table.test.tsx`
- Modify: `src/features/materials-receiving/components/materials-receiving-table.tsx`
- Modify: `tests/e2e/materials-receiving-responsive.spec.ts`

**Interfaces:**

- Consumes: shared `ActionMenu`; existing `ReceivingActions` predicates and callbacks.
- Produces: materials-receiving desktop rows and mobile cards using the same shared menu as all other tables.

- [ ] **Step 1: Strengthen the focused test before migration**

Update the existing mobile-card test to expect the shared label `จัดการรายการรับเข้า CCI-20260809-001`, responsive trigger classes, and shared touch-friendly menu items. Add draft/confirmed/cancelled cases asserting the same visible action labels as the current bespoke menu, and invoke at least one callback from each status group.

Update the E2E row-menu selector from the old `เปิดเมนูการจัดการ` label to the new shared `จัดการรายการรับเข้า` label without changing the deterministic API interception or workflow coverage.

- [ ] **Step 2: Run the receiving suite and verify RED**

Run: `pnpm test -- src/features/materials-receiving/components/materials-receiving-table.test.tsx`

Expected: FAIL on the new shared trigger label/contract because the feature still owns bespoke Radix dropdown markup.

- [ ] **Step 3: Replace bespoke dropdown markup with `ActionMenu`**

Keep `ReceivingActions` as the feature boundary, but make it construct `ActionItem[]` and return:

```tsx
<ActionMenu label={`จัดการรายการรับเข้า ${receiving.internalLotNo}`} items={items} />
```

Delete now-unused direct dropdown imports and `MoreHorizontal`. Keep every existing `canView`, `canEdit`, `canConfirm`, `canCancel`, and `canDelete` predicate and callback argument unchanged.

- [ ] **Step 4: Run all focused component tests**

Run:

```bash
pnpm test -- src/components/tables/action-menu.test.tsx src/features/materials/components/material-table.test.tsx src/features/goods-receipts/components/goods-receipt-table.test.tsx "src/app/(admin)/permissions/page.test.tsx" src/features/materials-receiving/components/materials-receiving-table.test.tsx
```

Expected: every focused action-menu suite PASS with no new warnings.

- [ ] **Step 5: Run scoped quality checks**

Run ESLint on every changed source/test file, then run Prettier check on the same files and `git diff --check`.

Expected: no errors and no formatting or whitespace failures. Record unrelated existing repository warnings separately.

- [ ] **Step 6: Run responsive browser coverage**

Run: `.\node_modules\.bin\playwright.CMD test tests/e2e/materials-receiving-responsive.spec.ts --project=chromium`

Expected: all four deterministic responsive tests PASS at mobile, tablet, and desktop widths; the row menu remains inside the viewport and its callbacks open the existing surfaces.

- [ ] **Step 7: Review every actionable table implementation**

Run:

```bash
rg -n --glob 'src/**/*.tsx' --glob '!**/*.test.tsx' 'title="(ดูรายละเอียด|แก้ไข|ลบ|ดูสต็อก|รับรองเอกสาร|ยกเลิกเอกสาร)"|>กำหนดแผนก<' src
```

Expected: no list-table action remains as a separate inline button. Any match inside a dialog or non-table control is documented and left unchanged.

- [ ] **Step 8: Commit final migration**

```bash
git add src/features/materials-receiving/components/materials-receiving-table.tsx src/features/materials-receiving/components/materials-receiving-table.test.tsx tests/e2e/materials-receiving-responsive.spec.ts
git commit -m "refactor: unify receiving action menu"
```

- [ ] **Step 9: Request final code review**

Review the complete design range for spec compliance, action parity, accessibility, responsive behavior, and unintended API/business changes. Address every confirmed finding with a new failing test before the fix.
