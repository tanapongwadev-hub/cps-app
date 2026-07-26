/**
 * Auth React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth-api";
import { useAuthStore, buildAuthSession, buildAuthSessionFromLogin } from "@/stores/auth-store";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";
import type {
  LoginRequest,
  SelectDepartmentRequest,
  SwitchDepartmentRequest,
  LoginResponse,
  AuthMeResponse,
  AccessControl,
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
 * Real backend returns 1-step: { authentication, user, accessControl }.
 * Build the session directly — no extra /auth/me roundtrip.
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
      // Real backend: response has authentication + user + accessControl (1-step).
      if (
        response &&
        typeof response === "object" &&
        "authentication" in response &&
        response.authentication
      ) {
        const session = buildAuthSessionFromLogin(response);
        setSession(session);
        const name =
          response.user.displayName ||
          response.user.fullName ||
          `${response.user.firstName ?? ""} ${response.user.lastName ?? ""}`.trim() ||
          response.user.username;
        showToast.success("เข้าสู่ระบบสำเร็จ", `ยินดีต้อนรับ ${name}`);
        const redirect =
          new URLSearchParams(window.location.search).get("redirect") ?? "/dashboard";
        router.push(redirect);
        return;
      }

      // Fallback: spec-style discriminated union (mock 2-step path)
      const anyResponse = response as unknown as {
        status?: "authenticated" | "department_selection_required";
        departmentSelectionToken?: string;
        user?: LoginResponse["user"];
        userDepartmentRoles?: unknown;
      };
      if (anyResponse?.status === "department_selection_required") {
        setPendingSelection({
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
    onSuccess: async (response) => {
      try {
        const me = await authApi.me();
        const session = buildAuthSession(response, me.accessControl);
        setSession(session);
        showToast.success("เลือกแผนกเรียบร้อย", `เข้าสู่ระบบในฐานะ ${response.currentDepartmentRole.roleName}`);
        router.push("/dashboard");
      } catch {
        showToast.error("ไม่สามารถโหลดข้อมูลสิทธิ์ได้");
      }
    },
  });
}

/**
 * Switch department mutation
 */
export function useSwitchDepartment() {
  const switchDepartmentRole = useAuthStore((s) => s.switchDepartmentRole);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: SwitchDepartmentRequest) => {
      const response = await authApi.switchDepartment(data);
      // ใน mock mode เราต้อง re-fetch me เพื่อ get menus
      const me = await authApi.me();
      return { response, me };
    },
    onSuccess: ({ response, me }) => {
      switchDepartmentRole(response.currentDepartmentRole, me.accessControl);
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
