/**
 * Menus React Query hooks
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menusApi } from "../api/menus-api";
import type { MenuItem, MenuReorderItem } from "@/features/menus/types";
import { showToast } from "@/lib/toast";

export const MENUS_QUERY_KEY = "menus";

/** Fetch the full menu tree (used by sidebar — the real backend filters
 *  out isVisible=false, which is exactly what the sidebar wants) */
export function useMenuTree(enabled = true) {
  return useQuery({
    queryKey: [MENUS_QUERY_KEY, "tree"],
    queryFn: () => menusApi.tree(),
    enabled,
    staleTime: 30 * 1000,
  });
}

/** Fetch a paginated list of all menus (including hidden/inactive).
 *  Used by /system/menu-management where the admin needs to see — and
 *  toggle — every menu, even ones the sidebar wouldn't show. */
export function useMenusList(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({
    queryKey: [MENUS_QUERY_KEY, "list", params],
    queryFn: () => menusApi.list({ page: 1, pageSize: 100, ...params }),
    staleTime: 30 * 1000,
  });
}

/** Fetch a single menu */
export function useMenu(id: string | undefined, enabled = !!id) {
  return useQuery({
    queryKey: [MENUS_QUERY_KEY, id],
    queryFn: () => menusApi.get(id!),
    enabled,
  });
}

/** Create a menu */
export function useCreateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MenuItem>) => menusApi.create(data),
    onSuccess: () => {
      showToast.success("สร้างเมนูเรียบร้อย");
      qc.invalidateQueries({ queryKey: [MENUS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถสร้างเมนูได้", err.message);
    },
  });
}

/** Update a menu */
export function useUpdateMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MenuItem> }) =>
      menusApi.update(id, data),
    onSuccess: () => {
      showToast.success("บันทึกเมนูเรียบร้อย");
      qc.invalidateQueries({ queryKey: [MENUS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถบันทึกเมนูได้", err.message);
    },
  });
}

/** Delete a menu */
export function useDeleteMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menusApi.remove(id),
    onSuccess: () => {
      showToast.success("ลบเมนูเรียบร้อย");
      qc.invalidateQueries({ queryKey: [MENUS_QUERY_KEY] });
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถลบเมนูได้", err.message);
    },
  });
}

/** Bulk reorder (used by drag-drop) */
export function useReorderMenus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: MenuReorderItem[]) => menusApi.reorder(items),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [MENUS_QUERY_KEY] });
      const count = variables.length;
      showToast.success(
        count > 1 ? `จัดลำดับเมนูเรียบร้อย (${count} รายการ)` : "จัดลำดับเมนูเรียบร้อย"
      );
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถจัดลำดับเมนูได้", err.message);
    },
  });
}
