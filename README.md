# Admin Template

> Enterprise Admin Template built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui.
> พร้อมใช้งานในระดับ Production รองรับภาษาไทยเต็มรูปแบบ

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ Features

- **🎨 Modern Enterprise UI** - ออกแบบเรียบง่าย สะอาด เป็นมืออาชีพ รองรับ Thai font (Noto Sans Thai)
- **🌓 Dark Mode** - รองรับ Light / Dark / System
- **📱 Fully Responsive** - ใช้งานได้ทุกอุปกรณ์ Desktop / Tablet / Mobile
- **🔐 Role-Based Access Control** - ควบคุมสิทธิ์ตามบทบาท ทั้ง Route, Menu และ Action
- **🌳 Multi-level Menu** - เมนูหลายระดับพร้อม Badge, Search, Active state
- **📊 Dashboard** - KPI, Charts (Line, Bar, Donut), Recent activities, System status
- **👥 User Management** - CRUD ครบถ้วน พร้อม Bulk action, Filter, Status
- **🛡️ Role & Permission** - Permission Matrix พร้อม Select All, Group by Module
- **📋 Menu Management** - Tree view, Drag & Drop, Multi-level
- **🎫 Ticket Management** - Template พร้อม Detail page, Comments, Activity Timeline
- **📝 Master Data Template** - Reusable template สำหรับ Categories, Statuses, etc.
- **📜 Activity Logs** - บันทึกกิจกรรมพร้อม Filter และ Export
- **🎨 Design System** - ครบชุด Button, Input, Card, Table, Dialog, Toast, etc.
- **🌐 i18n Ready** - รองรับภาษาไทยและอังกฤษ
- **🧪 Test Setup** - Vitest + React Testing Library + Playwright
- **📚 Comprehensive Docs** - ครบทุกหัวข้อ Architecture, Design System, API, etc.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (แนะนำ 22+)
- pnpm 9+ (แนะนำ) หรือ npm / yarn

### Installation

```bash
# 1. ติดตั้ง dependencies
pnpm install

# 2. ตั้งค่า environment
cp .env.example .env.local

# 3. Start dev server
pnpm dev
```

เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

### Login (Mock Mode)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin` หรือ `password123` | Super Admin |
| `manager` | `admin` หรือ `password123` | Manager |
| `staff` | `admin` หรือ `password123` | Staff |
| `somchai` | `admin` หรือ `password123` | Admin |

## 📦 Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
pnpm type-check       # Run TypeScript check
pnpm test             # Run unit tests
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Generate coverage report
pnpm test:e2e         # Run E2E tests (Playwright)
pnpm format           # Format code with Prettier
```

## 🏗️ Tech Stack

- **Framework:** Next.js 16 (App Router, RSC)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS v4 + CSS Variables
- **Components:** Custom shadcn-style UI library
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Server State:** TanStack Query
- **Global State:** Zustand
- **Charts:** Recharts
- **Icons:** Lucide React
- **Date:** date-fns
- **Toasts:** Sonner
- **Theme:** next-themes
- **Drag & Drop:** @dnd-kit
- **Testing:** Vitest + RTL + Playwright

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth pages (no sidebar)
│   ├── (admin)/              # Admin pages (with sidebar)
│   ├── 403/, 404/, 500/      # Error pages
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles + design tokens
├── components/               # Shared UI
│   ├── ui/                   # Base components (Button, Input, ...)
│   ├── layout/               # Sidebar, TopNav, PageHeader
│   ├── forms/                # Form fields, Confirm dialog
│   ├── tables/               # DataTable
│   └── feedback/             # Error pages
├── features/                 # Feature modules
│   ├── auth/, users/, roles/, menus/
│   ├── tickets/, dashboard/, activity-logs/, master-data/
├── services/                 # API client
├── stores/                   # Zustand stores
├── types/                    # TypeScript types
├── constants/                # App constants
├── config/                   # Configuration
├── lib/                      # 3rd party setup (Providers, Theme)
├── utils/                    # Utility functions
└── mocks/                    # Mock API + data
```

## 📚 Documentation

อ่านเอกสารเพิ่มเติมได้ที่:

- [📖 PROJECT-WIKI.md](./PROJECT-WIKI.md) - **จุดเริ่มต้นสำหรับ Developer / AI** ⭐
- [Architecture](./docs/architecture.md)
- [Design System](./docs/design-system.md)
- [Project Structure](./docs/project-structure.md)
- [API Integration](./docs/api-integration.md)
- [Authentication](./docs/authentication.md)
- [Role & Permission](./docs/role-permission.md)
- [Component Guideline](./docs/component-guideline.md)
- [Testing Guide](./docs/testing-guide.md)
- [Deployment Guide](./docs/deployment-guide.md)

## 🔌 Connect to Real Backend

เมื่อต้องการต่อกับ NestJS / Backend จริง:

1. ตั้งค่า `NEXT_PUBLIC_API_BASE_URL` ใน `.env.local`
2. ตั้ง `NEXT_PUBLIC_ENABLE_MOCK_API=false`
3. Backend ต้องตอบ Response format ตามที่กำหนด:

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: ApiError[];
}

interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

4. Backend **ต้อง**ตรวจสอบ Permission ซ้ำในทุก endpoint (อย่าพึ่งพา UI guard อย่างเดียว)

## 🤝 Contributing

1. อ่าน [PROJECT-WIKI.md](./PROJECT-WIKI.md) และ [Coding Standards](./docs/component-guideline.md)
2. สร้าง Feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📄 License

MIT License - ใช้งานได้อย่างอิสระทั้งเชิงพาณิชย์และส่วนบุคคล

## 👥 Credits

- [shadcn/ui](https://ui.shadcn.com) - Design system inspiration
- [Lucide](https://lucide.dev) - Icons
- [Recharts](https://recharts.org) - Charts

---

⭐ ถ้า template นี้มีประโยชน์ อย่าลืม Star บน GitHub!
