# Task 5 — Frontend Material API and React Query hooks

## Status

Complete. The Material API client, contract types, Material React Query hooks, and query keys are implemented.

## Files

- `src/constants/app.ts`
- `src/features/materials/api/materials-api.ts`
- `src/features/materials/api/materials-api.test.ts`
- `src/features/materials/hooks/use-materials.ts`
- `src/features/materials/hooks/use-materials.test.tsx`

## TDD evidence

- RED: `pnpm.cmd test src/features/materials/api/materials-api.test.ts src/features/materials/hooks/use-materials.test.tsx` failed because both production modules did not exist.
- RED: the added blank-filter assertion failed because the initial list query retained `modelId: undefined`.
- GREEN: the focused suite passes: 2 test files, 7 tests.

## Verification

- `pnpm.cmd test src/features/materials/api/materials-api.test.ts src/features/materials/hooks/use-materials.test.tsx` — pass (2 files, 7 tests)
- `pnpm.cmd type-check` — pass
- `pnpm.cmd lint -- src/constants/app.ts src/features/materials/api/materials-api.ts src/features/materials/api/materials-api.test.ts src/features/materials/hooks/use-materials.ts src/features/materials/hooks/use-materials.test.tsx` — pass
- `git diff --check` — pass

## Commit

`feat: connect material API`

## Self-review

- List requests translate `pageSize` to `limit` and omit undefined or empty filters while retaining `isActive: false`.
- Commands use the exact Material routes; image upload uses the existing `apiClient.upload` with `FormData` and no explicit multipart header.
- Mutations expose React Query state naturally, invalidate list/detail data as required, and leave Material cache intact for image uploads.
- Tests cover request URLs, list mapping, payload forwarding, FormData, disabled empty detail queries, cache invalidation, and Thai success/error toasts.

## Concerns

At backend commit `bf70e64`, `MaterialsService.mapSuppliers()` returns `suppliers: Supplier[]` rather than association rows. `MaterialSupplier` models the persisted association requested by the brief, while `Material.suppliers` is typed to the observed response shape.
