# Real Backend Setup

Wire the Next.js admin template to a real NestJS backend (e.g. the CCI NestJS
API at `http://localhost:3001`) and skip the in-memory mock layer.

> **TL;DR**
> Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1` and
> `NEXT_PUBLIC_ENABLE_MOCK_API=false` in `.env.local`, then run
> `node scripts/test-api-login.cjs` to verify the connection.

---

## 1. Configure the environment

Create or update `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_ENABLE_MOCK_API=false
NEXT_PUBLIC_API_TIMEOUT=30000
```

`NEXT_PUBLIC_API_BASE_URL` is read by `src/config/env.ts` and used by the
`apiClient` in `src/services/api-client.ts`.

`NEXT_PUBLIC_ENABLE_MOCK_API=false` tells the client to skip the in-memory
mock router (`src/mocks/`) and hit the real network instead.

## 2. CORS / proxy

The browser will hit the backend cross-origin unless one of these is in
place. Choose one:

### Option A — same-origin via Next.js rewrite (recommended for dev)

`next.config.ts` already ships with a rewrite rule that maps
`/api/v1/:path*` → `${API_ORIGIN}/api/v1/:path*`. Switch the env var to a
relative URL and the browser will hit the same origin:

```env
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

No CORS configuration needed on the backend.

### Option B — direct cross-origin

Keep the absolute URL and configure the backend to send
`Access-Control-Allow-Origin: http://localhost:3000` (and the right
`Allow-Credentials` / `Allow-Headers`).

## 3. Verify the backend is reachable

A Node script is provided that runs the same login the frontend will run.

```bash
node scripts/test-api-login.cjs
# POST http://localhost:3001/api/v1/auth/login
# ✓ HTTP 201
# ✓ envelope.success = true
# ✓ data.authentication present
# ✓ data.user { id, username, isSuperAdmin }
# ✓ data.accessControl { 26 permissions, 8 top-level menus }
```

For a fuller check (login + `/auth/me` + a resource endpoint):

```bash
node scripts/test-api-full.cjs
```

The same flow as a `curl`:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"change-me-secure-password"}'
```

## 4. Response shape (real backend)

`POST /auth/login` returns:

```jsonc
{
  "success": true,
  "message": "Login successful",
  "data": {
    "authentication": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "tokenType": "Bearer",
      "expiresIn": "15m"            // string or number, both accepted
    },
    "user": {
      "id": "1",
      "username": "superadmin",
      "firstName": "System",
      "lastName": "Administrator",
      "displayName": "System Administrator",
      "email": "superadmin@example.com",
      "isSuperAdmin": true,
      "departments": [],
      "roles": [{ "id": "1", "code": "SUPER_ADMIN", "name": "ผู้ดูแลระบบสูงสุด" }]
    },
    "accessControl": {
      "menus": [
        { "id": "5", "code": "MENU_MANAGEMENT", "name": "จัดการเมนู",
          "path": "/menus", "icon": "menu", "menuType": "MAIN",
          "permissions": [...], "children": [] }
      ],
      "permissions": ["AUDIT_LOG_CREATE", "MENU_MANAGEMENT_READ", ...]
    }
  },
  "timestamp": "2026-07-25T17:10:47.733Z"
}
```

Key differences vs the original 2-step spec (from `API_ENDPOINTS.md`):

| Spec (2-step) | Real backend (1-step) |
| --- | --- |
| `{ status, accessToken, user, currentDepartmentRole }` | `{ authentication: { accessToken, ... }, user, accessControl }` |
| `user.fullName` required | `user.displayName` (fullName derived from firstName + lastName) |
| `accessControl.userDepartmentRoleId` required | `accessControl.userDepartmentRoleId` optional (superadmin has none) |
| `expiresIn: number` (seconds) | `expiresIn: "15m"` (string) **or** number — client accepts both |

The frontend has been updated to match the real backend shape. See
`src/types/auth.ts`, `src/stores/auth-store.ts`, and
`src/features/auth/hooks/use-auth.ts`.

## 5. Re-enable mocks (offline dev)

If you want to work without the backend running:

```env
NEXT_PUBLIC_ENABLE_MOCK_API=true
```

The mock handlers in `src/mocks/handlers/auth.ts` now return the same
response shape as the real backend, so the same code path is exercised.
The `superadmin` user is also seeded with the default NestJS password
(`change-me-secure-password`) in `src/mocks/db.ts` for offline parity.

Useful mock credentials:

| Username    | Password                  |
| ----------- | ------------------------- |
| admin       | admin                     |
| manager     | password                  |
| staff       | password                  |
| superadmin  | change-me-secure-password |

## 6. Troubleshooting

- **Login returns 404 on the URL** — your backend may use a different base
  path. Check `curl http://localhost:3001/api/v1/auth/login` directly.
- **CORS errors in the browser console** — switch to the rewrite
  (`NEXT_PUBLIC_API_BASE_URL=/api/v1`) or enable CORS on the backend.
- **Type-check fails on `expiresIn`** — make sure you're on the latest
  types; the client accepts both `number` and `string` formats.
- **Menu icons render as `null`** — the backend may return `icon: null` for
  group menus; `MenuItem.icon` is now typed `string | null | undefined` and
  the sidebar `Icon` component handles all three.
- **401 kicked out after 15 min** — the `apiClient` auto-refreshes the
  access token via `/auth/refresh`; if the refresh fails the user is
  redirected to `/session-expired` instead of `/login`.
- **Sidebar links land on 404** — the backend menu paths don't match
  frontend routes. Either update the backend menu table
  (see `docs/backend-menu-paths.md`) or rely on the
  `MENU_PATH_OVERRIDES` map in `src/config/menu-overrides.ts`.

## 7. Auto-refresh + path overrides

- **Token refresh** — `apiClient` calls `/auth/refresh` automatically when a
  request returns 401. Concurrent 401s share a single in-flight refresh
  promise to avoid token thrash. See `src/services/api-client.ts`.
- **Path overrides** — `src/config/menu-overrides.ts` lets you remap a
  backend menu code to a different frontend route without touching the
  backend. Set a value to `null` to hide the item. Unknown codes fall
  through to the backend path.
- **Coming soon page** — when a menu has no matching frontend page yet, set
  the override to `/coming-soon?feature=<CODE>` and the sidebar will
  render a "this page is under construction" card.

## 8. Test scripts

The repo ships with several Node scripts that exercise the real backend
without needing a browser:

| Script                              | What it does                                    |
| ----------------------------------- | ----------------------------------------------- |
| `scripts/test-api-login.cjs`        | Login + verify envelope shape                   |
| `scripts/test-api-full.cjs`         | Login → `/auth/me` → `/users`                   |
| `scripts/test-api-menus.cjs`        | Print menu tree from `/auth/login`              |
| `scripts/test-api-refresh.cjs`      | Login → use access token → refresh → use new    |

Each prints `🎉` on success. Use them in CI or to debug a deployed backend.
