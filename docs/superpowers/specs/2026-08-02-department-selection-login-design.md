# Department Selection Login Design

**Date:** 2026-08-02

## Problem

For users with multiple assignments, `POST /auth/login` returns a short-lived
department-selection token. After the user selects an assignment,
`POST /auth/select-department` returns a real authentication response. The
frontend currently treats that response as a legacy flat shape and calls
`GET /auth/me` before storing the returned access token. That request has no
valid Bearer token and returns `401 Unauthorized`.

The backend also resolves permissions without passing the selected assignment
ID, so a successful login could receive permissions from assignments other
than the one selected.

## Approved Design

### Backend response contract

`POST /auth/select-department` and the immediate-login path use the same inner
authentication response:

```json
{
  "authentication": {
    "accessToken": "access-token",
    "refreshToken": "refresh-token",
    "tokenType": "Bearer",
    "expiresIn": "8h"
  },
  "user": {
    "id": "46",
    "username": "page.render"
  },
  "currentDepartmentRole": {
    "id": "76",
    "userId": "46",
    "departmentId": "2",
    "departmentName": "ฝ่ายปฏิบัติการ",
    "departmentCode": "OPS",
    "roleId": "3",
    "roleName": "ผู้ใช้งาน",
    "roleCode": "USER",
    "isPrimary": false,
    "isActive": true
  },
  "accessControl": {
    "menus": [],
    "permissions": [],
    "userDepartmentRoleId": "76",
    "departmentId": "2",
    "roleId": "3"
  }
}
```

For a system-wide assignment, `departmentId`, `departmentName`, and
`departmentCode` are `null`. A response without an assignment may omit or set
`currentDepartmentRole` to `null`.

### Permission resolution

When building the authentication response, the backend passes the selected
`userDepartmentRoleId` to `EffectivePermissionService`. The resulting menus
and permission codes therefore match the assignment encoded into the access
token. Super admin behavior remains unchanged.

### Frontend session construction

The frontend types the successful selection response as the shared
authentication response plus `currentDepartmentRole`. On success it builds and
stores the complete auth session directly from that response, then navigates to
`/dashboard`. It does not call `/auth/me` during this transition.

This ordering ensures the access token, selected context, and access control
enter the store atomically. Later `/auth/me` calls use the stored token through
the normal API client interceptor.

### Error handling

- Invalid or expired selection tokens continue to return `401` from
  `/auth/select-department`.
- Inactive, expired, or foreign assignments continue to return `401`.
- A failed selection leaves the pending selection state intact so the user can
  retry or return to login.
- No partial authenticated state is stored when selection fails.

## Testing

- Backend service test proves permissions are requested with the selected
  assignment ID and the response exposes the same current assignment.
- Frontend hook test proves a successful selection stores the session directly,
  does not call `/auth/me`, and redirects to `/dashboard`.
- Frontend failure test proves a `401` does not create an authenticated session.
- Run full frontend and backend test suites and production builds.

## Scope

This change fixes the native two-step login path and its response typing. It
does not redesign department switching, token lifetimes, or the assignment
management feature.
