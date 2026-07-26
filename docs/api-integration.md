# API Integration

## Overview

ระบบใช้ HTTP client กลาง (`apiClient`) ที่รองรับ:
- Mock mode (in-memory)
- Real backend (NestJS, etc.)
- Authentication interceptor
- Global error handling
- Timeout
- File upload / download

## Switch Mock ↔ Real Backend

ใน `.env.local`:
```env
NEXT_PUBLIC_ENABLE_MOCK_API=true   # ใช้ mock
NEXT_PUBLIC_ENABLE_MOCK_API=false  # ใช้ backend จริง
NEXT_PUBLIC_API_BASE_URL=/api      # หรือ https://api.example.com
```

## API Response Format

ทุก endpoint **ต้อง** ตอบตาม format นี้:

```ts
interface ApiResponse<T> {
  success: boolean;
  message: string;
  messageCode?: string;  // Business error code
  data: T;
  errors?: ApiError[];
  meta?: ResponseMeta;
}

interface ApiError {
  code: string;
  message: string;
  field?: string;  // สำหรับ validation errors
}
```

### Success Response

```json
{
  "success": true,
  "message": "ดำเนินการสำเร็จ",
  "data": { ... },
  "messageCode": "OK"
}
```

### Error Response

```json
{
  "success": false,
  "message": "ไม่สามารถดำเนินการได้",
  "messageCode": "USER_NOT_FOUND",
  "data": null,
  "errors": [
    { "code": "REQUIRED", "message": "กรุณากรอกชื่อ", "field": "firstName" }
  ]
}
```

### Paginated Response

```ts
interface PaginatedResponse<T> {
  items: T[];
  page: number;        // 1-indexed
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
```

## HTTP Status Codes

| Code | Meaning | Client Behavior |
|------|---------|----------------|
| 200 | OK | Return data |
| 201 | Created | Show success toast |
| 400 | Bad Request | Show error with field errors |
| 401 | Unauthorized | Clear session, redirect to /login |
| 403 | Forbidden | Show /403 page |
| 404 | Not Found | Show not found message |
| 408 | Timeout | Retry with backoff |
| 500 | Server Error | Show /500 page |
| 0 | Network Error | Show "connection failed" |

## API Client Usage

### Basic GET

```ts
import { apiClient } from "@/services/api-client";

const user = await apiClient.get<User>("/users/123");
```

### With Query Params

```ts
const response = await apiClient.get<PaginatedResponse<User>>("/users", {
  params: {
    page: 1,
    pageSize: 10,
    search: "john",
    status: "active",
  },
});
```

### POST / PUT / PATCH

```ts
const created = await apiClient.post<User>("/users", {
  username: "john",
  email: "john@example.com",
  roleIds: ["role-001"],
});

const updated = await apiClient.put<User>("/users/123", { firstName: "John" });
```

### DELETE

```ts
await apiClient.delete("/users/123");
```

### File Upload

```ts
const formData = new FormData();
formData.append("file", file);

const result = await apiClient.upload("/files/upload", formData);
```

### File Download

```ts
const blob = await apiClient.download("/files/report.pdf");
// ใช้ URL.createObjectURL(blob) เพื่อแสดง
```

### Skip Auth (สำหรับ public API)

```ts
await apiClient.get("/public/data", { skipAuth: true });
```

## Endpoints Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout |
| POST | `/auth/refresh` | Refresh token |
| GET | `/auth/me` | Current user |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/forgot-password` | Forgot password |
| POST | `/auth/reset-password` | Reset password |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users?page=1&pageSize=10` | List users |
| GET | `/users/:id` | Get user |
| POST | `/users` | Create user |
| PUT | `/users/:id` | Update user |
| DELETE | `/users/:id` | Delete user |
| PATCH | `/users/:id/status` | Update status |
| POST | `/users/:id/reset-password` | Reset password |

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/roles?page=1` | List roles |
| GET | `/roles/:id` | Get role |
| POST | `/roles` | Create role |
| PUT | `/roles/:id` | Update role |
| DELETE | `/roles/:id` | Delete role |
| POST | `/roles/:id/clone` | Clone role |

### Departments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/departments` | List |
| GET | `/departments/tree` | Tree view |
| POST | `/departments` | Create |
| PUT | `/departments/:id` | Update |
| DELETE | `/departments/:id` | Delete |

### Menus

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/menus` | List all |
| GET | `/menus/tree` | Tree |
| POST | `/menus` | Create |
| PUT | `/menus/:id` | Update |
| DELETE | `/menus/:id` | Delete |
| POST | `/menus/reorder` | Reorder |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tickets?page=1` | List |
| GET | `/tickets/:id` | Get with comments |
| POST | `/tickets` | Create |
| PUT | `/tickets/:id` | Update |
| DELETE | `/tickets/:id` | Delete |
| PATCH | `/tickets/:id/status` | Update status |
| POST | `/tickets/:id/comments` | Add comment |

### Activity Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/activity-logs?page=1` | List logs |

### Master Data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/master-data/categories` | List categories |
| GET | `/master-data/statuses` | List statuses |
| GET | `/master-data/organizations` | List organizations |
| POST | `/master-data/categories` | Create category |
| PUT | `/master-data/categories/:id` | Update |
| DELETE | `/master-data/categories/:id` | Delete |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Get dashboard data |

## Backend Requirements

✅ **ต้องทำ**:
- Permission check ทุก endpoint (อย่าพึ่ง UI guard อย่างเดียว)
- Return response format ตามที่กำหนด
- Validate input (Zod schema ที่ frontend ใช้ ควรเป็นแนวทาง)
- Pagination ตาม `?page=1&pageSize=10`
- Filter + Search + Sort
- ใช้ HTTP status code ที่ถูกต้อง
- 401 → trigger frontend logout

❌ **ไม่ควร**:
- ตอบ array เปล่าๆ ตอน error (ใช้ response format)
- ส่ง stack trace ใน production
- Trust client-side permission check

## Adding New Endpoint

1. **Define Type** ใน `src/types/`
2. **Create API function** ใน feature folder
3. **Create React Query hook**
4. (Optional) **Add mock handler** ใน `src/mocks/handlers/`

```ts
// 1. Type
export interface Product extends BaseEntity {
  code: string;
  name: string;
  price: number;
}

// 2. API
export const productsApi = {
  list: (params) => apiClient.get<PaginatedResponse<Product>>("/products", { params }),
  create: (data) => apiClient.post<Product>("/products", data),
};

// 3. Hook
export function useProducts(params) {
  return useQuery({
    queryKey: ["products", "list", params],
    queryFn: () => productsApi.list(params),
  });
}
```

## Error Handling Best Practices

✅ **DO**:
- แสดงข้อความ user-friendly
- ใช้ field errors ใน form
- Log errors ไปยัง error tracking (Sentry)
- Retry network errors (with backoff)

❌ **DON'T**:
- แสดง technical error ตรงๆ
- Log sensitive data
- แสดง error เดิมซ้ำหลายครั้ง
- Crash app เมื่อ API ล้มเหลว
