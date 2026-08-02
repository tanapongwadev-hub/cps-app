"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  materialsApi,
  type ListMaterialsParams,
  type MaterialPayload,
  type UpdateMaterialPayload,
} from "../api/materials-api";

export function useMaterials(params: ListMaterialsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.MATERIALS.LIST(params),
    queryFn: () => materialsApi.list(params),
  });
}

export function useMaterial(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.MATERIALS.DETAIL(id ?? ""),
    queryFn: () => materialsApi.get(id as string),
    enabled: !!id,
  });
}

export function useMaterialLookups(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.MATERIALS.LOOKUPS,
    queryFn: materialsApi.lookups,
    enabled,
  });
}

function useMaterialInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MATERIALS.ALL });
    if (id) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MATERIALS.DETAIL(id) });
    }
  };
}

export function useCreateMaterial() {
  const invalidate = useMaterialInvalidation();
  return useMutation({
    mutationFn: (data: MaterialPayload) => materialsApi.create(data),
    onSuccess: () => {
      invalidate();
      showToast.success("สร้างวัสดุเรียบร้อย");
    },
    onError: (error: Error) => showToast.error("ไม่สามารถสร้างวัสดุได้", error.message),
  });
}

export function useUpdateMaterial() {
  const invalidate = useMaterialInvalidation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialPayload }) =>
      materialsApi.update(id, data),
    onSuccess: (_, variables) => {
      invalidate(variables.id);
      showToast.success("แก้ไขวัสดุเรียบร้อย");
    },
    onError: (error: Error) => showToast.error("ไม่สามารถแก้ไขวัสดุได้", error.message),
  });
}

export function useDeactivateMaterial() {
  const invalidate = useMaterialInvalidation();
  return useMutation({
    mutationFn: (id: string) => materialsApi.deactivate(id),
    onSuccess: (_, id) => {
      invalidate(id);
      showToast.success("ปิดใช้งานวัสดุเรียบร้อย");
    },
    onError: (error: Error) => showToast.error("ไม่สามารถปิดใช้งานวัสดุได้", error.message),
  });
}

export function useRestoreMaterial() {
  const invalidate = useMaterialInvalidation();
  return useMutation({
    mutationFn: (id: string) => materialsApi.restore(id),
    onSuccess: (_, id) => {
      invalidate(id);
      showToast.success("เปิดใช้งานวัสดุเรียบร้อย");
    },
    onError: (error: Error) => showToast.error("ไม่สามารถเปิดใช้งานวัสดุได้", error.message),
  });
}

export function useUploadMaterialImage() {
  return useMutation({
    mutationFn: (file: File) => materialsApi.uploadImage(file),
    onError: (error: Error) => showToast.error("ไม่สามารถอัปโหลดรูปวัสดุได้", error.message),
  });
}
