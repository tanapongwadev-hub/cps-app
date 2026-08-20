/**
 * Auth React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth-api";
import {
  useAuthStore,
  buildAuthSessionFromDepartmentSelection,
  buildAuthSessionFromLogin,
  userNeedsDepartmentSelection,
} from "@/stores/auth-store";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";
import {
  isLoginRequiresDepartmentSelection,
  isLoginSuccessResponse,
  type LoginRequest,
  type SelectDepartmentRequest,
  type SwitchDepartmentRequest,
  type LoginResponse,
  type AuthMeResponse,
  type AccessControl,
} from "@/types/auth";
import { apiClient } from "@/services/api-client";

/**
 * Get /auth/me
 * Used to fetch current accessControl on app load
 */
export function useAuthMe(enabled = true) {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get /auth/me without auth check
 * ใช้สำหรับ mock mode ที่ auth/me สามารถเรียกได้
 */
export function useAuthMeUnsafe() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Login mutation
 *
 * The real backend may return either:
 *   1) 1-step: { authentication, user, accessControl }
 *      — build the session directly and proceed to the dashboard
 *   2) 2-step: { requiresDepartmentSelection: true, departmentSelectionToken, departments }
 *      — the user is assigned to >1 department; gate them at
 *        `/select-department` and POST /auth/select-department with the
 *        chosen `userDepartmentRoleId` to receive the real session.
 */
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  const setPendingSelection = useAuthStore((s) => s.setPendingSelection);
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<LoginResponse> => {
      return authApi.login(data);
    },
    onSuccess: (response) => {
      // Path 1: native 2-step "requires department selection" response.
      // Backend returns this when the user is assigned to >1 department.
      if (isLoginRequiresDepartmentSelection(response)) {
        setPendingSelection({
          mode: "select",
          departmentSelectionToken: response.departmentSelectionToken,
          user: response.user, // may be undefined — UI shows username from form
          // Map the real backend's flat `departments[]` to the spec-style
          // `userDepartmentRoles[]` shape used by the UI.
          options: response.departments.map((d) => ({
            userDepartmentRoleId: d.userDepartmentRoleId,
            department: {
              id: d.departmentId,
              code: d.departmentCode,
              name: d.departmentName,
            },
            role: {
              id: d.roleCode, // best-effort fallback
              code: d.roleCode,
              name: d.roleCode,
            },
            isPrimary: false,
          })),
        });
        return;
      }

      // Path 2: 1-step login (authentication + user + accessControl).
      if (isLoginSuccessResponse(response)) {
        const session = buildAuthSessionFromLogin(response);
        setSession(session);
        const name =
          response.user.displayName ||
          response.user.fullName ||
          `${response.user.firstName ?? ""} ${response.user.lastName ?? ""}`.trim() ||
          response.user.username;
        showToast.success("เข้าสู่ระบบสำเร็จ", `ยินดีต้อนรับ ${name}`);

        // Post-login check (defensive — the backend usually returns 2-step
        // for multi-dept users, but we also catch it client-side in case
        // a 1-step response sneaks through with >1 dept in `user.departments`).
        if (userNeedsDepartmentSelection(response.user)) {
          setPendingSelection({
            mode: "switch",
            user: response.user,
          });
          router.push("/select-department");
          return;
        }

        const redirect =
          new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard";
        router.push(redirect);
        return;
      }

      // Path 3: legacy/mock 2-step spec shape (status discriminator).
      // Kept so mock 2-step flows still work in dev.
      const anyResponse = response as unknown as {
        status?: "authenticated" | "department_selection_required";
        departmentSelectionToken?: string;
        user?: LoginResponse["user"];
        userDepartmentRoles?: unknown;
      };
      if (anyResponse?.status === "department_selection_required") {
        setPendingSelection({
          mode: "select",
          departmentSelectionToken: anyResponse.departmentSelectionToken ?? "",
          user: anyResponse.user as never,
          options: (anyResponse.userDepartmentRoles ?? []) as never,
        });
        return;
      }

      showToast.error("เข้าสู่ระบบไม่สำเร็จ", "รูปแบบคำตอบไม่ถูกต้อง");
    },
  });
}

/**
 * Select department mutation
 */
export function useSelectDepartment() {
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  return useMutation({
    mutationFn: (data: SelectDepartmentRequest) => authApi.selectDepartment(data),
    onSuccess: (response) => {
      const session = buildAuthSessionFromDepartmentSelection(response);
      setSession(session);
      showToast.success(
        "เลือกแผนกเรียบร้อย",
        `เข้าสู่ระบบในฐานะ ${response.currentDepartmentRole.roleName}`,
      );
      router.push("/dashboard");
    },
  });
}

/**
 * Switch department mutation
 */
export function useSwitchDepartment() {
  const setSession = useAuthStore((s) => s.setSession);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: SwitchDepartmentRequest) =>
      authApi.switchDepartment(data),
    onSuccess: (response) => {
      setSession(buildAuthSessionFromDepartmentSelection(response));
      qc.invalidateQueries({ queryKey: ["auth"] });
      showToast.success(
        "เปลี่ยนแผนกเรียบร้อย",
        `ตอนนี้คุณอยู่ในฐานะ ${response.currentDepartmentRole.roleName}`,
      );
    },
    onError: () => {
      showToast.error("ไม่สามารถเปลี่ยนแผนกได้");
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const qc = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      logout();
      qc.clear();
      router.push("/login");
    },
  });
}

/**
 * Change password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      showToast.success("เปลี่ยนรหัสผ่านเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถเปลี่ยนรหัสผ่านได้", err.message);
    },
  });
}

/**
 * Initialize auth on app load
 * เรียก /auth/me เพื่อ refresh user + accessControl
 */
export function useInitAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);

  return useQuery({
    queryKey: ["auth", "init"],
    queryFn: async () => {
      if (!accessToken) throw new Error("No token");
      const me = await authApi.me();
      // Build session from existing token + me
      const existing = useAuthStore.getState();
      setSession({
        user: me.user,
        currentDepartmentRole: me.currentDepartmentRole,
        accessControl: me.accessControl,
        accessToken: existing.accessToken ?? "",
        refreshToken: existing.refreshToken ?? "",
        expiresAt: existing.expiresAt ?? Date.now() + 3600 * 1000,
      });
      return me;
    },
    enabled: isAuthenticated && !!accessToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

// Export apiClient for use in other auth-related code
export { apiClient };
