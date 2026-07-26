# Project Structure

## Tree

```
admin-template/
├── public/                       # Static assets
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Public auth routes
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # No sidebar
│   │   │
│   │   ├── (admin)/              # Protected admin routes
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── user-management/
│   │   │   │   ├── users/
│   │   │   │   ├── roles/
│   │   │   │   └── departments/
│   │   │   ├── operations/
│   │   │   │   ├── tickets/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── tasks/
│   │   │   │   └── approvals/
│   │   │   ├── master-data/
│   │   │   │   ├── categories/
│   │   │   │   ├── statuses/
│   │   │   │   └── organizations/
│   │   │   ├── reports/
│   │   │   │   ├── summary/
│   │   │   │   └── activity/
│   │   │   ├── system/
│   │   │   │   ├── menu-management/
│   │   │   │   ├── activity-logs/
│   │   │   │   └── settings/
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx        # With AdminShell
│   │   │
│   │   ├── 403/                  # Forbidden
│   │   ├── 404/                  # Not found
│   │   ├── 500/                  # Server error
│   │   ├── unauthorized/
│   │   ├── session-expired/
│   │   ├── maintenance/
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Redirect to /login
│   │   ├── global-error.tsx      # Global error boundary
│   │   └── globals.css           # Global styles + tokens
│   │
│   ├── components/               # Shared UI components
│   │   ├── ui/                   # Base primitives (shadcn-style)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── ...
│   │   │   └── index.ts          # Re-exports
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── top-nav.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── admin-shell.tsx
│   │   │
│   │   ├── forms/                # Form components
│   │   │   ├── form-field.tsx    # TextField, SelectField, etc.
│   │   │   ├── form-section.tsx
│   │   │   └── confirm-dialog.tsx
│   │   │
│   │   ├── tables/               # Table components
│   │   │   ├── data-table.tsx
│   │   │   └── action-menu.tsx
│   │   │
│   │   └── feedback/             # Error pages, states
│   │       └── error-page.tsx
│   │
│   ├── features/                 # Feature modules
│   │   ├── auth/
│   │   ├── users/
│   │   │   ├── api/users-api.ts
│   │   │   ├── components/user-form-dialog.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-users.ts
│   │   │   │   └── use-departments.ts
│   │   │   └── schemas/user-schema.ts
│   │   ├── roles/
│   │   ├── menus/
│   │   ├── tickets/
│   │   ├── dashboard/
│   │   ├── activity-logs/
│   │   └── master-data/
│   │
│   ├── services/                 # Global services
│   │   └── api-client.ts         # HTTP client
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts         # User, permissions, tokens
│   │   └── ui-store.ts           # Sidebar, theme, language
│   │
│   ├── types/                    # Global TypeScript types
│   │   ├── common.ts             # ApiResponse, PaginatedResponse
│   │   ├── auth.ts               # User, Role, Department
│   │   ├── menu.ts               # MenuItem
│   │   ├── ticket.ts             # Ticket, TicketStatus
│   │   ├── activity-log.ts
│   │   ├── master-data.ts
│   │   ├── dashboard.ts
│   │   └── notification.ts
│   │
│   ├── constants/                # App-wide constants
│   │   ├── app.ts                # App config, storage keys
│   │   └── permissions.ts        # Permission codes + groups
│   │
│   ├── config/                   # Configuration
│   │   └── env.ts                # Environment validation
│   │
│   ├── lib/                      # 3rd party setup
│   │   ├── providers.tsx         # Root providers
│   │   ├── query-client.ts       # TanStack Query setup
│   │   ├── theme-provider.tsx    # next-themes wrapper
│   │   └── toast.ts              # Toast helpers
│   │
│   ├── utils/                    # Pure utility functions
│   │   ├── cn.ts                 # className merger
│   │   ├── format.ts             # Number, currency, etc.
│   │   ├── date.ts               # Date utilities
│   │   └── storage.ts            # Storage helpers
│   │
│   └── mocks/                    # Mock API + data
│       ├── handlers/             # Mock API handlers
│       │   ├── auth.ts
│       │   ├── users.ts
│       │   ├── roles.ts
│       │   ├── helpers.ts
│       │   └── index.ts
│       ├── db.ts                 # In-memory data
│       └── index.ts              # Setup function
│
├── tests/                        # E2E tests (Playwright)
│   └── e2e/
│
├── docs/                         # Documentation
│   ├── architecture.md
│   ├── design-system.md
│   ├── project-structure.md
│   ├── api-integration.md
│   ├── authentication.md
│   ├── role-permission.md
│   ├── component-guideline.md
│   ├── testing-guide.md
│   └── deployment-guide.md
│
├── .env.example                  # Environment template
├── .env.local                    # Local env (gitignored)
├── .prettierrc.json
├── .prettierignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── tailwind.config.js            # (Tailwind v4 uses CSS config)
├── tsconfig.json
├── vitest.config.ts
├── vitest.setup.ts
├── README.md
└── PROJECT-WIKI.md
```

## Conventions

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Page | `kebab-case/page.tsx` | `forgot-password/page.tsx` |
| Component | `kebab-case.tsx` | `user-form-dialog.tsx` |
| Hook | `use-kebab.ts` | `use-users.ts` |
| Util | `kebab.ts` | `format-date.ts` |
| Constant | `kebab.ts` | `permissions.ts` |
| Type | `kebab.ts` | `ticket.ts` |
| Test | `*.test.ts` | `format.test.ts` |

### Import Order

```ts
// 1. External libraries
import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

// 2. Internal absolute imports (@/ alias)
import { Button } from "@/components/ui/button";
import { useAuth } from "@/stores/auth-store";

// 3. Relative imports
import { localHelper } from "./helpers";
import type { LocalType } from "./types";
```

### Export Style

ใช้ Named exports เป็นหลัก:

```ts
// ✅ Named
export const Button = React.forwardRef(...);
export { Button };

// ❌ Default (ยกเว้น pages)
export default Button;
```

Pages ใช้ default export (ตาม Next.js convention):
```tsx
export default function LoginPage() { ... }
```
