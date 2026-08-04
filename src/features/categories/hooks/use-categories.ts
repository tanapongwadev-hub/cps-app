"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  categoriesApi,
  type ListCategoriesParams,
  type CategoryPayload,
  type UpdateCategoryPayload,
} from "../api/categories-api";

export function useCategories(params: ListCategoriesParams) {
  return useQuery({
    queryKey: QUERY_KEYS.CATEGORIES.LIST(params),
    queryFn: () => categoriesApi.list(params),
  });
}

function useInv() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES.ALL });
    if (id) qc.invalidateQueries({ queryKey: QUERY_KEYS.CATEGORIES.DETAIL(id) });
  };
}

export function useCreateCategory() {
  const inv = useInv();
  return useMutation({
    mutationFn: (d: CategoryPayload) => categoriesApi.create(d),
    onSuccess: () => { inv(); showToast.success("สร้างหมวดหมู่เรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถสร้างหมวดหมู่ได้", e.message),
  });
}

export function useUpdateCategory() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryPayload }) => categoriesApi.update(id, data),
    onSuccess: (_, v) => { inv(v.id); showToast.success("แก้ไขหมวดหมู่เรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถแก้ไขหมวดหมู่ได้", e.message),
  });
}

export function useDeactivateCategory() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.deactivate(id),
    onSuccess: (_, id) => { inv(id); showToast.success("ปิดใช้งานหมวดหมู่เรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถปิดใช้งานหมวดหมู่ได้", e.message),
  });
}

export function useRestoreCategory() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.restore(id),
    onSuccess: (_, id) => { inv(id); showToast.success("เปิดใช้งานหมวดหมู่เรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถเปิดใช้งานหมวดหมู่ได้", e.message),
  });
}
