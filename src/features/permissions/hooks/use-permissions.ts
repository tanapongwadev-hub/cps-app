/**
 * Permissions React Query hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionsApi } from "../api/permissions-api";
import type { PageQuery } from "@/types/paginated";
import type { Permission } from "@/features/permissions/types";
import { showToast } from "@/lib/toast";

export const PERMISSIONS_QUERY_KEY = "permissions";

export function usePermissions(query: PageQuery = { page: 1, pageSize: 100 }) {
  return useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, query],
    queryFn: () => permissionsApi.list(query),
    staleTime: 5 * 60 * 1000,
  });
}

/** menus + actions สำหรับ dropdown ในฟอร์ม */
export function usePermissionOptions(enabled = true) {
  return useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, "options"],
    queryFn: () => permissionsApi.options(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Permission>) => permissionsApi.create(data),
    onSuccess: () => {
      showToast.success("สร้างสิทธิ์เรียบร้อย");
      qc.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถสร้างสิทธิ์ได้", err.message);
    },
  });
}

export function useUpdatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Permission> }) =>
      permissionsApi.update(id, data),
    onSuccess: () => {
      showToast.success("บันทึกสิทธิ์เรียบร้อย");
      qc.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถบันทึกสิทธิ์ได้", err.message);
    },
  });
}

export function usePermissionDepartments(enabled = true) {
  return useQuery({
    queryKey: [PERMISSIONS_QUERY_KEY, "departments"],
    queryFn: () => permissionsApi.departments(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePermissionDepartments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      departmentIds,
    }: {
      id: string;
      departmentIds: string[];
    }) => permissionsApi.updateDepartments(id, { departmentIds }),
    onSuccess: () => {
      showToast.success("กำหนดแผนกสำหรับสิทธิ์เรียบร้อย");
      qc.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถกำหนดแผนกสำหรับสิทธิ์ได้", err.message);
    },
  });
}

export function useDeletePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => permissionsApi.remove(id),
    onSuccess: () => {
      showToast.success("ลบสิทธิ์เรียบร้อย");
      qc.invalidateQueries({ queryKey: [PERMISSIONS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถลบสิทธิ์ได้", err.message);
    },
  });
}
