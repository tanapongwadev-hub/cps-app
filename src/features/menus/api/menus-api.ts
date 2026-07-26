/**
 * Menus API
 * Aligned with the real NestJS backend.
 */
import { apiClient } from "@/services/api-client";
import type { MenuItem, MenuReorderItem, MenuTree } from "@/types/menu";
import type { PaginatedList, PageQuery } from "@/types/paginated";

export const menusApi = {
  /** List menus (paginated) */
  list: (query: PageQuery = { page: 1, pageSize: 100 }) =>
    apiClient.get<PaginatedList<MenuItem>>("/menus", {
      params: {
        page: query.page,
        limit: query.pageSize,
        search: query.search,
        status: query.status,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    }),

  /** Get the full menu tree (nested children) */
  tree: () => apiClient.get<MenuTree>("/menus/tree"),

  /** Get a single menu by id */
  get: (id: string) => apiClient.get<MenuItem>(`/menus/${id}`),

  /** Create a new menu */
  create: (data: Partial<MenuItem>) => apiClient.post<MenuItem>("/menus", data),

  /** Update a menu (real backend uses PATCH) */
  update: (id: string, data: Partial<MenuItem>) =>
    apiClient.patch<MenuItem>(`/menus/${id}`, data),

  /** Delete a menu (409 if it has children) */
  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/menus/${id}`),

  /**
   * Bulk reorder. The mock backend supports POST /menus/reorder; the real
   * backend doesn't (yet) so we fall back to per-item PATCHes.
   */
  reorder: async (items: MenuReorderItem[]): Promise<{ success: boolean }> => {
    try {
      return await apiClient.post<{ success: boolean }>("/menus/reorder", { items });
    } catch {
      // Real backend: fall back to per-item PATCH (slower but always works)
      await Promise.all(
        items.map((item) =>
          apiClient.patch<MenuItem>(`/menus/${item.id}`, {
            sortOrder: item.sortOrder,
            parentId: item.parentId,
          }),
        ),
      );
      return { success: true };
    }
  },
};
