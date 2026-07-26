# Authentication

## Flow

```
1. User → POST /auth/login (username, password)
2. Backend → Validate credentials
3. Backend → Return:
   {
     accessToken,
     refreshToken,
     expiresIn: 3600,
     user: { id, username, ..., permissions, roleIds },
     permissions: ['user.view', 'user.create', ...],
     menu: [...]
   }
4. Frontend → Store in Zustand + localStorage
5. Frontend → Redirect to /dashboard
```

## Token Management

### Access Token
- ใช้ในทุก API request (Authorization: Bearer ...)
- มีอายุ (default 1 ชม.)
- เก็บใน localStorage (Zustand persist)

### Refresh Token
- ใช้แลก access token ใหม่เมื่อหมดอายุ
- มีอายุยาวกว่า (7-30 วัน)
- เก็บใน localStorage เช่นกัน (ใน production ควรใช้ httpOnly cookie)

### Auto Refresh (ใน api-client)

```ts
apiClient.setOnUnauthorized(async () => {
  // เรียก /auth/refresh
  const response = await apiClient.post("/auth/refresh", {
    refreshToken: useAuthStore.getState().refreshToken,
  });
  // Update tokens
  useAuthStore.getState().setSession({
    ...useAuthStore.getState(),
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + response.expiresIn * 1000,
  });
});
```

## Session Expiry

เมื่อ token หมดอายุและ refresh ล้มเหลว:
1. ล้าง Zustand state
2. Redirect ไป `/session-expired`
3. User login ใหม่ → redirect กลับหน้าเดิม

## Route Guard

ใช้ `AdminShell` component เป็น guard:

```tsx
// src/components/layout/admin-shell.tsx
useEffect(() => {
  if (!hydrated || noAuthCheck) return;
  if (!isAuthenticated) {
    router.replace(`/login?redirect=${pathname}`);
  }
}, [isAuthenticated, ...]);
```

## Permission Guard

### UI Level

```tsx
<PermissionGuard permission="user.create">
  <Button>เพิ่มผู้ใช้งาน</Button>
</PermissionGuard>
```

### Hook

```tsx
const { hasPermission } = usePermission();
if (hasPermission("user.delete")) { ... }
```

### Multiple Permissions

```tsx
<PermissionGuard anyPermission={["user.update", "user.delete"]}>
  <ActionMenu ... />
</PermissionGuard>
```

## Login Page

- **Username** - required
- **Password** - required, show/hide toggle
- **Remember me** - เก็บ session นานขึ้น
- **Forgot password** link
- **Loading state** ตอน submit
- **Error state** เมื่อ credentials ไม่ถูกต้อง

## Logout

```ts
const logout = () => {
  apiClient.post("/auth/logout", {}); // fire and forget
  useAuthStore.getState().logout();
  router.push("/login");
};
```

## Security Notes

⚠️ **สำคัญ**:
- Backend **ต้อง** ตรวจสอบ Permission ทุก request
- Frontend guard เป็น UX improvement เท่านั้น ไม่ใช่ security
- Password ต้อง hash ใน backend (bcrypt, argon2)
- ใช้ HTTPS ใน production
- ใช้ HttpOnly cookies สำหรับ sensitive tokens
- Implement rate limiting ใน backend
- Implement CSRF protection

## Demo Accounts (Mock Mode)

| Username | Password | Role |
|----------|----------|------|
| admin | admin / password123 | Super Admin |
| manager | admin / password123 | Manager |
| staff | admin / password123 | Staff |
| somchai | admin / password123 | Admin |
| malee | admin / password123 | Staff (inactive) |
