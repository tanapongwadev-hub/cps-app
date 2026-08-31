# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Enterprise Admin frontend for **CPS** (a production/materials management system) — multi-department,
multi-role. Built as an "Admin Template" with modular feature slices, RBAC, and a mock-first API layer
that can be pointed at a real NestJS backend. Thai-language UI is a first-class concern (Noto Sans Thai,
bilingual copy throughout).

Two related domain features to keep straight:
- **`features/materials-receiving`** — single-material receiving. Generates Internal Lot No.
  (`CCI-YYYYMMDD-XXX`) + Supplier Lot No. (`SUP-YYYYMMDD`), computes package breakdown
  (`CEIL(qty / packing)`), generates QR, and updates stock balances/transactions immediately on confirm.
  Route: `/materials/materials-receiving`.
- **`features/materials-disbursement`** — outbound/disbursement side of materials.

## Tech Stack

- Next.js 16 (App Router, RSC), built/dev'd with `--webpack` (not Turbopack)
- React 19, TypeScript 5 (strict, `noUncheckedIndexedAccess`)
- Tailwind CSS v4 (CSS-based config, no `tailwind.config.js`) + `class-variance-authority`
- Custom shadcn-style UI primitives on Radix UI
- React Hook Form + Zod (+ `@hookform/resolvers`) for forms
- TanStack Query v5 (server state), TanStack Table v8 (data tables)
- Zustand (client/global state: auth, sidebar, ui)
- `@dnd-kit/*` for drag-and-drop (e.g. menu tree, sidebar)
- Recharts (charts), Sonner (toasts), next-themes (dark mode), date-fns (Thai locale)
- MSW-style in-memory mock handlers in `src/mocks/`
- Vitest 4 + Testing Library (unit/component), Playwright (E2E)

## Architecture

Feature-sliced architecture. Each domain lives in `src/features/<name>/` with its own
`api/`, `components/`, `hooks/`, `schemas/` (Zod). Shared/reusable pieces live outside features.

```
src/
├── app/                  # Next.js App Router routes only (no business logic)
│   ├── (auth)/           # Public routes — no sidebar (login, forgot/reset password)
│   ├── (admin)/          # Protected routes — wrapped in AdminShell (sidebar + auth guard)
│   ├── 403/, 404/, 500/, unauthorized/, session-expired/, maintenance/
│   └── globals.css       # Design tokens (CSS variables)
├── components/
│   ├── ui/               # shadcn-style primitives (Button, Dialog, ...) — no API calls, no business logic
│   ├── layout/           # Sidebar, TopNav, PageHeader, AdminShell (route guard lives here)
│   ├── forms/, tables/, feedback/
├── features/<name>/      # api/, components/, hooks/ (React Query), schemas/ (Zod)
├── services/api-client.ts   # single HTTP client: interceptors, 401 refresh, mock switch
├── stores/               # Zustand: auth-store.ts (session/permissions), sidebar-store.ts, ui-store.ts
├── types/                # global/shared types only (common.ts = ApiResponse/PaginatedResponse)
├── constants/            # app.ts, permissions.ts (permission codes)
├── config/env.ts         # env var validation
├── lib/                  # providers.tsx, query-client.ts, theme-provider.tsx, toast.ts
├── utils/                # cn.ts, format.ts, date.ts, storage.ts
└── mocks/                # handlers/ per feature + in-memory db.ts, toggled by env
```

**Data flow:** Event → RHF validation → mutation hook (`useCreateX`) → feature `api` object →
`apiClient` → mock handler or real backend → React Query cache invalidation → UI update + toast.

**API contract** — every backend endpoint must return:
```ts
interface ApiResponse<T> { success: boolean; message: string; messageCode?: string; data: T; errors?: ApiError[]; }
interface PaginatedResponse<T> { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number; }
```
401 → clears session and redirects to `/login`. Backend re-validates permissions on every call —
frontend permission checks are UX only, never trust-boundary.

**Mock vs real backend** — `NEXT_PUBLIC_ENABLE_MOCK_API` toggles between in-memory mock handlers
(`src/mocks/handlers/`) and a real backend. `next.config.ts` proxies `/api/*` and `/api/v1/*` to
`NEXT_PUBLIC_API_BASE_URL`'s origin (default `http://localhost:3001`) so browser calls are same-origin;
`/uploads/*` is proxied the same way for backend-served images. **Note:** `.env.local` in this repo
currently has mock mode **off** (`NEXT_PUBLIC_ENABLE_MOCK_API=false`) — the app expects a real backend
on port 3001 unless you flip it back on.

**Permissions** — codes are `<module>.<action>` (e.g. `user.view`) checked via `<PermissionGuard>` /
`usePermission()`; `*` = super admin. See Known Issues — two incompatible naming schemes coexist.

**Route protection** — `AdminShell` (`src/components/layout/admin-shell.tsx`) is the auth guard for the
`(admin)` route group; it also exists as `src/middleware.ts` for Next.js-level routing.

## Conventions

- **Naming:** kebab-case for files (`user-form-dialog.tsx`, `use-users.ts`); pages are `kebab-case/page.tsx`.
- **Exports:** named exports everywhere except `app/**/page.tsx`, which use Next.js's required default export.
- **Import order:** external libs → `@/` absolute imports → relative imports (types last, `import type`).
- **State:** local → `useState`; derived → `useMemo` (never `useState`+`useEffect` for derived values);
  forms → React Hook Form; server data → TanStack Query; global/cross-page → Zustand.
- **Components:** `"use client"` only when hooks/interactivity are needed; primitives that need to expose
  a DOM ref use `React.forwardRef` + `displayName`; prefer composition/slots over boolean-prop configuration.
- **Data-fetching components** must handle loading / error / empty states explicitly (skeleton, `ErrorState`,
  `EmptyState`) — not just the happy path.
- Reusable-but-generic UI → `components/ui/`; feature-only components stay inside that feature's folder
  (don't reach across features to import another feature's component).
- Lint: `@typescript-eslint/no-unused-vars` allows `_`-prefixed args/vars; non-null assertions are a
  warning, not an error; `react-hooks/set-state-in-effect` is intentionally disabled (hydration/reset patterns
  are common here). Prettier: double quotes, semicolons, trailing commas, width 100, `prettier-plugin-tailwindcss`
  for class sorting.

## Design / Accessibility Standards

- shadcn/ui-style component system on Radix UI primitives + Tailwind v4 tokens (`src/app/globals.css`).
- Accessibility checklist enforced in review: semantic HTML, ARIA labels on icon-only buttons, keyboard
  nav, visible focus, contrast, form errors associated to fields, screen-reader text for state changes.
- Full design-system reference: `docs/design-system.md`.

## Common Commands

```bash
pnpm dev                # start dev server (webpack)
pnpm build              # production build (webpack)
pnpm start              # start production server
pnpm lint / lint:fix    # ESLint
pnpm type-check         # tsc --noEmit
pnpm format             # Prettier over src/**/*.{ts,tsx,css,md}

pnpm test               # Vitest run (unit/component)
pnpm test:watch         # Vitest watch mode
pnpm test:ui            # Vitest UI
pnpm test:coverage      # coverage (thresholds: 60% stmt/func/line, 55% branch)
pnpm test:e2e           # Playwright E2E (expects backend on :3001; auto-starts Next.js dev server)
pnpm test:e2e:ui / :headed / :debug
pnpm test:e2e:install   # install Playwright's Chromium

pnpm test -- path/to/file.test.ts        # run a single Vitest file
pnpm test:e2e -- tests/e2e/some.spec.ts  # run a single Playwright spec
```

## Known Issues / Constraints

From an internal architecture review (`docs/react-structure-review.md`) — still present in the tree,
be aware when touching these areas:

- ~~Container/Presenter pattern is half-adopted~~ — **resolved.** The unused `*-list.container.tsx` /
  `*-list.presenter.tsx` pairs (categories, delivery-types, departments, loading-points, material-models,
  materials, organizations, reject-reasons, status-items, suppliers, units) were deleted; every
  `app/(admin)/.../page.tsx` is the real "smart component" that calls feature hooks directly. Don't
  reintroduce a container layer for a single list page — extract plain sub-components (row, filter bar,
  dialog) instead if a page file gets too long.
- **`src/constants/permissions.ts` mixes two naming schemes**: legacy `"user.view"` (lowercase.dot) and
  newer `"UNIT_VIEW"` (UPPER_SNAKE). Check which style a given feature/backend integration expects before
  adding new permission codes.
- **Permission-check logic is duplicated** across `hooks/use-permission.ts`, `utils/permission-utils.ts`,
  and `stores/auth-store.ts` selectors, with slightly different super-admin handling in each.
- **Stray file:** `src/features/materials-receiving/components/materials-receiving-form-dialog-old.tsx`
  (953 lines, `-old` suffix) — leftover from a refactor; verify no imports before touching/removing.
- **`src/features/users/hooks/use-departments.ts`** duplicates department-fetching logic that arguably
  belongs in `features/departments/` — most callers use the `users/hooks` copy.
- Page-level test coverage is uneven (~22% of pages at last review); don't assume a feature has tests
  just because sibling features do.
- Earlier review flagged dead re-export layers (`src/infra/`, `src/lib/utils/`, `src/lib/server/`,
  `src/lib/patterns.ts`, `src/lib/state-wrapper.tsx`) — these have since been removed; don't recreate
  that pattern (extra indirection layers with zero importers).

## Where to Look For X

| Concern | Location |
|---|---|
| Auth flow / token refresh / session expiry | `src/stores/auth-store.ts`, `src/services/api-client.ts`, `docs/authentication.md` |
| Route protection | `src/components/layout/admin-shell.tsx`, `src/middleware.ts` |
| Permission codes / RBAC | `src/constants/permissions.ts`, `src/components/ui/permission-guard.tsx`, `src/hooks/use-permission.ts`, `docs/role-permission.md` |
| HTTP client / interceptors / mock switch | `src/services/api-client.ts`, `src/config/env.ts`, `docs/api-integration.md` |
| Mock data & handlers | `src/mocks/handlers/`, `src/mocks/db.ts` |
| Adding a new feature module | copy the shape of `src/features/categories/` (has `api/`, `components/`, `hooks/`, `schemas/`) |
| Global styling / design tokens | `src/app/globals.css`, `docs/design-system.md` |
| Data tables | `src/components/tables/data-table.tsx` (TanStack Table wrapper) |
| Forms | `src/components/forms/`, feature `schemas/*.ts` (Zod) |
| API/backend rewrite proxy config | `next.config.ts` |
| Materials receiving vs disbursement domain logic | `src/features/materials-receiving/`, `src/features/materials-disbursement/`, `PROJECT-WIKI.md` |
| Full architecture/API/testing docs | `docs/architecture.md`, `docs/api-integration.md`, `docs/testing-guide.md`, `docs/component-guideline.md`, `PROJECT-WIKI.md` (start here) |
