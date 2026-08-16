# Unified table action menu — final fix report

## Status

All three final review findings are addressed in one scoped fix wave on `developmnt`.

## Changes

- Constrained the materials table action header and row cells with `w-14` while preserving right alignment.
- Added a real `userEvent` regression around a clickable parent that verifies both the action-menu trigger and a selected menu item do not bubble clicks to the parent.
- Extended the existing deterministic tablet and desktop Playwright cases to open the row action menu and verify the menu surface remains within the viewport. The existing mobile workflow remains unchanged.

Files changed:

- `src/features/materials/components/material-table.tsx`
- `src/features/materials/components/material-table.test.tsx`
- `src/components/tables/action-menu.test.tsx`
- `tests/e2e/materials-receiving-responsive.spec.ts`

## TDD and regression evidence

### Materials action-column width

RED command:

```text
pnpm test -- src/features/materials/components/material-table.test.tsx
```

Result: failed as expected with 1 failed and 2 passed tests. The new focused test expected `w-14 text-right`; the action header had `text-right` but no width constraint.

GREEN command:

```text
pnpm test -- src/features/materials/components/material-table.test.tsx
```

Result after adding only the two `w-14` classes: 1 file and 3 tests passed.

### Clickable-parent isolation

This finding required coverage of existing production behavior, not a production behavior change. The added real-interaction test passed against the current implementation. To prove the regression test detects both breaks, two temporary mutation runs were made and then fully restored:

- Removing trigger `stopPropagation` failed at the post-trigger parent assertion with one parent call.
- Removing menu content/item click isolation failed at the post-menu-item parent assertion with one parent call.

Restored GREEN command:

```text
pnpm test -- src/components/tables/action-menu.test.tsx
```

Result: 1 file and 3 tests passed. No mutation remains in the diff.

### Tablet and desktop menu bounds

RED is not applicable because this is test-only expansion around behavior and selectors that already existed and passed; no production change was needed. The two non-card cases now reuse the existing table locator and `expectSurfaceWithinViewport` helper, avoiding a duplicate workflow test.

Verification command:

```text
.\node_modules\.bin\playwright.CMD test tests/e2e/materials-receiving-responsive.spec.ts --project=chromium
```

Result: 4/4 passed. Tablet and desktop each opened the deterministic row menu and passed viewport bounds/document-overflow assertions; both mobile cases retained their existing coverage.

## Final verification

- Focused unit tests: 2 files, 6/6 tests passed.
- Direct Playwright responsive suite: 4/4 tests passed.
- Scoped ESLint across all four changed source/test files: passed with no output.
- Scoped Prettier check: passed after formatting the new materials assertion.
- `git diff --check`: passed; Git emitted only line-ending conversion notices.
- Self-review confirmed the diff contains no business-rule, permission, callback, route, API, or shared action-menu production changes beyond the requested materials width constraint.

## Commit

This report and all four scoped file changes are included in the single commit `fix: close unified action menu review findings`.

## Concerns

None. Repository-wide type-check/test baselines were not re-run because the prior task report documents unrelated existing failures; this wave ran all affected focused unit and responsive E2E coverage requested for the final findings.
