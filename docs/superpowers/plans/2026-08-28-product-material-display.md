# Product Display Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Product cards and tables visually and behaviorally consistent with Materials without changing Product APIs or CRUD flows.

**Architecture:** Keep the existing Product component boundaries and callbacks. Add presentation-focused component tests, then reshape the two Product views using existing shared UI primitives and a small image-path resolver local to the feature.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Vitest, Testing Library

**Spec:** `docs/superpowers/specs/2026-08-28-product-material-display.md`

## Global Constraints

- Preserve existing Product CRUD, BOM navigation, and status callbacks.
- Do not change backend or Product API contracts.
- Match Materials loading, error, empty, pagination, and responsive interaction patterns.
- Use page sizes `10`, `25`, `50`, and `100`.

---

### Task 1: Product card catalog presentation

**Files:**
- Create: `src/features/products/components/product-card-grid.test.tsx`
- Modify: `src/features/products/components/product-card-grid.tsx`
- Create: `src/features/products/utils.ts`

**Interfaces:**
- Consumes: `Product`, existing card callbacks, and `productImagePath`
- Produces: `resolveProductImage(path: string | null | undefined): string | null` and the image-first Product card UI

- [x] **Step 1: Write failing tests** for image rendering, no-image fallback, image preview, Product metadata, status/BOM/edit callbacks, and Materials-style page-size options.
- [x] **Step 2: Run** `pnpm test -- src/features/products/components/product-card-grid.test.tsx` and confirm failures identify missing Product catalog behavior.
- [x] **Step 3: Implement** the 4:3 image card, preview dialog, badges, compact metadata, skeleton/empty/error states, and pagination.
- [x] **Step 4: Re-run** the focused test and confirm it passes.

### Task 2: Product table catalog presentation

**Files:**
- Create: `src/features/products/components/product-table.test.tsx`
- Modify: `src/features/products/components/product-table.tsx`

**Interfaces:**
- Consumes: `resolveProductImage`, `Product`, current sort and action callbacks
- Produces: responsive thumbnail-first table with Product operational details and compact actions

- [x] **Step 1: Write failing tests** for thumbnail/fallback, responsive identity/status layout, action callbacks, sorting, and Materials-style pagination.
- [x] **Step 2: Run** `pnpm test -- src/features/products/components/product-table.test.tsx` and confirm failures identify missing table behavior.
- [x] **Step 3: Implement** the responsive Product table using existing shared UI primitives and callbacks.
- [x] **Step 4: Re-run** the focused test and confirm it passes.

### Task 3: Page integration and verification

**Files:**
- Modify: `src/app/(admin)/products/page.tsx`

**Interfaces:**
- Consumes: updated Product views
- Produces: `/products` default page size of `10`

- [x] **Step 1: Add or update the page-level expectation** that the initial page size is `10` if an existing page test supports it; otherwise cover the observable pagination behavior in component tests.
- [x] **Step 2: Change** `PRODUCT_PAGE_SIZE` from `12` to `10`.
- [x] **Step 3: Run** focused Product tests, `pnpm type-check`, and `pnpm lint`.
- [x] **Step 4: Review** the diff for unrelated changes and verify all Product callbacks remain wired.
