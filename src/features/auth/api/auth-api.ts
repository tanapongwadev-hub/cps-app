/**
 * Auth API service
 * Aligned with API_ENDPOINTS.md
 */
import { apiClient } from "@/services/api-client";
import type {
  LoginResponse,
  SelectDepartmentResponse,
  AuthMeResponse,
  SelectDepartmentRequest,
  SwitchDepartmentRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  LoginRequest,
} from "@/types/auth";
import type { MenuItem } from "@/types/menu";

export const authApi = {
  /** Step 1: Login - อาจได้ authenticated ทันที หรือต้องเลือก department ก่อน */
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  /** Step 2: เลือก department/role (เมื่อ user มีหลาย assignments) */
  selectDepartment: (data: SelectDepartmentRequest) =>
    apiClient.post<SelectDepartmentResponse>("/auth/select-department", data),

  /** เปลี่ยน department/role ระหว่างใช้งาน */
  switchDepartment: (data: SwitchDepartmentRequest) =>
    apiClient.post<SelectDepartmentResponse>("/auth/switch-department", data),

  /** Refresh token — pass the current refreshToken from the store.
   * The real backend returns the full envelope (same shape as /auth/login),
   * so we only pluck the authentication fields we need in the interceptor. */
  refresh: (refreshToken: string) =>
    apiClient.post<{
      authentication: {
        accessToken: string;
        refreshToken: string;
        tokenType: "Bearer";
        expiresIn: number | string;
      };
    }>("/auth/refresh", { refreshToken }, { skipRefresh: true }),

  /** Logout */
  logout: () => apiClient.post<{ success: boolean }>("/auth/logout", {}),

  /** ดึงข้อมูล user + accessControl */
  me: () => apiClient.get<AuthMeResponse>("/auth/me"),

  /** ดึงเมนู */
  myMenus: () => apiClient.get<MenuItem[]>("/auth/me/menus"),

  /** ดึง permissions */
  myPermissions: () => apiClient.get<string[]>("/auth/me/permissions"),

  /** เปลี่ยนรหัสผ่าน */
  changePassword: (data: ChangePasswordRequest) =>
    apiClient.post<{ success: boolean }>("/auth/change-password", data),

  /** ลืมรหัสผ่าน */
  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<{ success: boolean }>("/auth/forgot-password", data),

  /** รีเซ็ตรหัสผ่าน */
  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<{ success: boolean }>("/auth/reset-password", data),
};
