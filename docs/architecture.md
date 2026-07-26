# Architecture

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (Client)                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                  Next.js App Router                     │  │
│  │                                                         │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │  │
│  │  │  Pages     │  │ Components │  │   Providers     │   │  │
│  │  │ (RSC +    │  │  (UI +    │  │  (Query,       │   │  │
│  │  │  Client)  │  │  Layout)  │  │   Theme)        │   │  │
│  │  └────────────┘  └────────────┘  └────────────────┘   │  │
│  │         ↓              ↓                ↓                │  │
│  │  ┌────────────────────────────────────────────────┐   │  │
│  │  │            State Management                    │   │  │
│  │  │  • Server State → TanStack Query              │   │  │
│  │  │  • Form State   → React Hook Form             │   │  │
│  │  │  • URL State    → useSearchParams             │   │  │
│  │  │  • UI State     → Zustand (auth, theme)       │   │  │
│  │  └────────────────────────────────────────────────┘   │  │
│  │         ↓                                              │  │
│  │  ┌────────────────────────────────────────────────┐   │  │
│  │  │            Service Layer                       │   │  │
│  │  │  • apiClient (fetch wrapper)                   │   │  │
│  │  │  • Interceptors (auth, error)                 │   │  │
│  │  │  • Mock handler (in-memory)                   │   │  │
│  │  └────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────┬───────────────────────────────────┘
                           │ HTTP
                           ↓
┌──────────────────────────────────────────────────────────────┐
│                  Backend API (NestJS, etc.)                   │
│  • Authentication (JWT, Refresh Token)                        │
│  • Permission Validation (RBAC)                              │
│  • Business Logic                                              │
│  • Database Access                                             │
└──────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Page Layer (`src/app/`)

- เป็น entry point ของแต่ละ route
- จัดการ **URL state**, **Page-level data fetching**
- ประกอบ Components เข้าด้วยกัน
- **ไม่ควรมี Business logic ซับซ้อน**

### 2. Component Layer (`src/components/`)

- **Reusable UI** ที่ไม่ขึ้นกับ Feature ใด
- รับ **props** เป็นหลัก
- **ไม่เรียก API โดยตรง** (ยกเว้น shared hooks)
- มี Story ของตัวเอง (ใช้ซ้ำได้หลายที่)

### 3. Feature Layer (`src/features/`)

- **Business logic** เฉพาะ feature
- รวม API service, hooks, schemas, types, components
- **Components ในนี้ ใช้ได้เฉพาะ feature นั้น** (ถ้า reusable ต้องเอาไปไว้ที่ `components/`)

### 4. Service Layer (`src/services/`)

- **HTTP client** เป็น abstraction หนึ่งเดียว
- จัดการ interceptors, errors, timeouts
- **ไม่ผูกกับ feature ใด**

### 5. State Management

| Type | Tool | Use Case |
|------|------|----------|
| Server State | TanStack Query | API data (users, roles, ...) |
| Form State | React Hook Form | Form values + validation |
| URL State | Next.js searchParams | Filter, pagination, tabs |
| Global UI | Zustand | Auth, theme, sidebar |
| Local | useState / useReducer | Component-level state |

## Data Flow

```
User Action
   ↓
Event Handler
   ↓
React Hook Form (validation)
   ↓
Mutation Hook (useCreateUser)
   ↓
API Service (usersApi.create)
   ↓
API Client (fetch + interceptors)
   ↓
Mock Handler OR Real Backend
   ↓
Response
   ↓
Query Client (invalidate cache)
   ↓
UI Update (re-fetch)
   ↓
Toast Notification
```

## Folder Pattern

```
features/
└── <feature>/
    ├── api/          # API functions (raw fetch)
    ├── components/   # Feature-specific components
    ├── hooks/        # React Query hooks
    ├── schemas/      # Zod validation
    ├── types/        # TypeScript types
    └── constants.ts  # Feature constants
```

## Why Feature-Based?

✅ **Easy to remove** - ลบ feature = ลบ folder
✅ **Easy to scale** - แต่ละ feature เป็น mini-app
✅ **Clear ownership** - รู้ว่าไฟล์ไหนอยู่ feature ไหน
✅ **Better code review** - PR เปลี่ยน feature เดียวกัน

## Mock-First Design

ทุก endpoint มี Mock Handler ใน `src/mocks/handlers/`
- **Dev mode** - ใช้ mock ตลอด (default)
- **Connect real backend** - แค่ตั้ง `NEXT_PUBLIC_ENABLE_MOCK_API=false`
- **API response format** เหมือนกัน 100% ทำให้ switch ได้ง่าย

## Permission System

```
Permission Code: "<module>.<action>"
  ├── user.view
  ├── user.create
  ├── user.update
  ├── user.delete
  └── *  (super admin)

Flow:
1. User logs in → Backend returns permissions[]
2. Frontend stores in Zustand + localStorage
3. <PermissionGuard> checks before render
4. Backend RE-CHECKS on every API call (critical!)
```

## Performance Strategy

- **Code splitting** - ใช้ `dynamic()` สำหรับ components หนัก
- **Prefetching** - TanStack Query prefetch on hover
- **Optimistic updates** - แสดงผลก่อน API confirm
- **Image optimization** - ใช้ `next/image`
- **Memoization** - `memo`, `useMemo`, `useCallback` เฉพาะจุดที่จำเป็น

## Security Layers

1. **Network** - HTTPS, CORS
2. **Auth** - JWT, Refresh Token, Session Expiry
3. **Authorization** - Permission check ทั้ง UI และ Backend
4. **Input** - Zod validation ทุก form
5. **Output** - Sensitive data masking
6. **Storage** - ไม่เก็บ secret ใน localStorage
