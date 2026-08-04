"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  materialModelsApi,
  type ListMaterialModelsParams,
  type MaterialModelPayload,
  type UpdateMaterialModelPayload,
} from "../api/material-models-api";

export function useMaterialModels(params: ListMaterialModelsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.MATERIAL_MODELS.LIST(params),
    queryFn: () => materialModelsApi.list(params),
  });
}

function useInvalidation() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.MATERIAL_MODELS.ALL });
    if (id) qc.invalidateQueries({ queryKey: QUERY_KEYS.MATERIAL_MODELS.DETAIL(id) });
  };
}

export function useCreateMaterialModel() {
  const inv = useInvalidation();
  return useMutation({
    mutationFn: (data: MaterialModelPayload) => materialModelsApi.create(data),
    onSuccess: () => {
      inv();
      showToast.success("สร้างรุ่นวัสดุเรียบร้อย");
    },
    onError: (e: Error) => showToast.error("ไม่สามารถสร้างรุ่นวัสดุได้", e.message),
  });
}

export function useUpdateMaterialModel() {
  const inv = useInvalidation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaterialModelPayload }) =>
      materialModelsApi.update(id, data),
    onSuccess: (_, v) => {
      inv(v.id);
      showToast.success("แก้ไขรุ่นวัสดุเรียบร้อย");
    },
    onError: (e: Error) => showToast.error("ไม่สามารถแก้ไขรุ่นวัสดุได้", e.message),
  });
}

export function useDeactivateMaterialModel() {
  const inv = useInvalidation();
  return useMutation({
    mutationFn: (id: string) => materialModelsApi.deactivate(id),
    onSuccess: (_, id) => {
      inv(id);
      showToast.success("ปิดใช้งานรุ่นวัสดุเรียบร้อย");
    },
    onError: (e: Error) => showToast.error("ไม่สามารถปิดใช้งานรุ่นวัสดุได้", e.message),
  });
}

export function useRestoreMaterialModel() {
  const inv = useInvalidation();
  return useMutation({
    mutationFn: (id: string) => materialModelsApi.restore(id),
    onSuccess: (_, id) => {
      inv(id);
      showToast.success("เปิดใช้งานรุ่นวัสดุเรียบร้อย");
    },
    onError: (e: Error) => showToast.error("ไม่สามารถเปิดใช้งานรุ่นวัสดุได้", e.message),
  });
}
