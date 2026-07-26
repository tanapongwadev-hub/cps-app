# E2E Tests (Playwright)

End-to-end tests that exercise the full stack: browser → Next.js → real NestJS
backend at `http://localhost:3001`.

## Status

**15/15 passing** in ~50s. Stable across runs (no flakiness, no retries needed).

The suite covers the four most-fragile integration points: auth, navigation,
auto-refresh, and page-level data binding against the real backend.

## Setup

Already done if you ran `pnpm install`. If not:

```bash
pnpm add -D @playwright/test
pnpm test:e2e:install   # downloads chromium browser
```

## Run

The tests require the **real backend** on `localhost:3001`. The dev server on
`localhost:3000` is auto-started by Playwright's `webServer` config (reuses an
existing one if it's already up).

In one terminal:

```bash
# Backend (NestJS)
cd /path/to/backend && pnpm start:dev

# Or with Docker: docker compose up backend
```

Then in this repo:

```bash
pnpm test:e2e              # headless run (~50s)
pnpm test:e2e:headed       # watch the browser
pnpm test:e2e:ui           # interactive UI mode
pnpm test:e2e:debug        # step-by-step with inspector
pnpm test:all              # unit + e2e
```

## Test files

| File              | Tests | What it covers                                                                                  |
| ----------------- | ----- | ----------------------------------------------------------------------------------------------- |
| `auth.spec.ts`    | 5     | login, wrong password, logout, protected-route redirect, session-expired redirect               |
| `menus.spec.ts`   | 4     | sidebar 8 menus from real backend, click navigation, search filter, permissions page           |
| `refresh.spec.ts` | 1     | corrupted access token → auto-refresh interceptor recovers → /auth/me returns 200                |
| `pages.spec.ts`   | 5     | smoke tests: departments / roles / users / sessions / menu-management pages render + load data  |

Total: **15 tests in 4 files**, runs in parallel with 2 workers.

## Why these tests?

- **auth (5 tests)** — broken login is the #1 thing that breaks UX
- **menus (4 tests)** — proves `accessControl.menus` + `accessControl.permissions`
  flow end-to-end (the entire point of recent sessions)
- **refresh (1 test)** — the 15-minute token expiry is the most fragile part;
  without this test a future refactor of the apiClient interceptor could
  silently break it
- **pages (5 tests)** — smoke tests that the 5 most-used admin pages can talk
  to the real backend and render their data without runtime errors

## How the fixtures work

`tests/e2e/fixtures.ts` exposes two custom fixtures:

- `loginAsSuperAdmin` — logs in via the API directly (not the form), seeds the
  full session (user + accessControl + tokens) into localStorage, then
  navigates to `/dashboard`. More reliable than driving the React-Hook-Form
  login form, which is flaky before hydration.
- `loginFresh(creds)` — same as above for arbitrary credentials.

`ensureBackendReachable()` is called in `test.beforeAll` for each spec. It
fails fast with a helpful message if the NestJS API isn't responding.

## CI integration

```yaml
# .github/workflows/e2e.yml (sketch)
- name: E2E tests
  env:
    NEXT_PUBLIC_API_BASE_URL: http://localhost:3001/api/v1
  run: |
    pnpm install
    pnpm test:e2e:install
    pnpm test:e2e
```

The `webServer` block in `playwright.config.ts` will auto-start `pnpm dev
--webpack` in CI if no server is listening on port 3000. In CI, `retries: 2`
protects against transient backend blips.

## Debugging a failed test

1. Look at the failure screenshot under `test-results/<spec>-<name>-chromium/`
2. Open the trace: `pnpm exec playwright show-trace test-results/<dir>/trace.zip`
3. Re-run headed: `pnpm test:e2e:headed --grep "<test name>"`

The most common cause of failure is the backend being down. The error
message will tell you (`Backend not reachable at ...`).

## Notes & gotchas

- **Test data assumption**: the tests assume `superadmin / change-me-secure-password`
  is the only valid super-admin. If you rotate credentials, update
  `tests/e2e/fixtures.ts`.
- **Token rotation**: the refresh test asserts the new access token is
  different from the old one (real backend rotates both). If you switch
  to a backend that doesn't rotate refresh tokens, drop that assertion.
- **`auth-storage` key**: the refresh test reads from the Zustand persist
  storage key `admin.auth.token`. If you change the key in
  `src/constants/app.ts`, update `STORAGE_KEY` in `refresh.spec.ts` too.
- **Deterministic**: tests don't mutate backend data. If a test ever needs
  to write, isolate it with `test.describe.serial()` and clean up after.
- **Pace with backend restarts**: if you restart the backend mid-suite,
  in-flight requests will 5xx but the suite as a whole still passes thanks
  to the per-test `ensureBackendReachable` precheck.
