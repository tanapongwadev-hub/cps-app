"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import { materialsReceivingApi } from "../api/materials-receiving-api";
import type {
  CancelMaterialsReceivingPayload,
  CreateMaterialsReceivingPayload,
  ListMaterialsReceivingParams,
  UpdateMaterialsReceivingPayload,
} from "../api/materials-receiving-api";

// ============================================================================
// Query Keys
// ============================================================================

export const materialsReceivingKeys = {
  all: ["materials-receiving"] as const,
  lists: () => [...materialsReceivingKeys.all, "list"] as const,
  list: (params: ListMaterialsReceivingParams) =>
    [...materialsReceivingKeys.lists(), params] as const,
  details: () => [...materialsReceivingKeys.all, "detail"] as const,
  detail: (id: string) => [...materialsReceivingKeys.details(), id] as const,
  lookups: () => [...materialsReceivingKeys.all, "lookups"] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useMaterialsReceivings(params: ListMaterialsReceivingParams) {
  return useQuery({
    queryKey: materialsReceivingKeys.list(params),
    queryFn: () => materialsReceivingApi.list(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useMaterialsReceivingDetail(id: string) {
  return useQuery({
    queryKey: materialsReceivingKeys.detail(id),
    queryFn: () => materialsReceivingApi.get(id),
    enabled: !!id,
  });
}

export function useMaterialsReceivingLookups() {
  return useQuery({
    queryKey: materialsReceivingKeys.lookups(),
    queryFn: () => materialsReceivingApi.lookups(),
  });
}

// ============================================================================
// Mutations
// ============================================================================

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useCreateMaterialsReceiving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaterialsReceivingPayload) =>
      materialsReceivingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsReceivingKeys.lists() });
      showToast.success("สร้างรายการรับเข้าเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถสร้างรายการรับเข้าได้"));
    },
  });
}

export function useUpdateMaterialsReceiving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaterialsReceivingPayload;
    }) => materialsReceivingApi.update(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: materialsReceivingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: materialsReceivingKeys.detail(variables.id),
      });
      showToast.success("บันทึกการแก้ไขเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถบันทึกการแก้ไขได้"));
    },
  });
}

export function useDeleteMaterialsReceiving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => materialsReceivingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsReceivingKeys.lists() });
      showToast.success("ลบรายการรับเข้าเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถลบรายการรับเข้าได้"));
    },
  });
}

export function useConfirmMaterialsReceiving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => materialsReceivingApi.confirm(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: materialsReceivingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: materialsReceivingKeys.detail(id),
      });
      showToast.success("ยืนยันการรับเข้าเรียบร้อย — อัปเดตสต็อกเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถยืนยันการรับเข้าได้"));
    },
  });
}

export function useCancelMaterialsReceiving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CancelMaterialsReceivingPayload;
    }) => materialsReceivingApi.cancel(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: materialsReceivingKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: materialsReceivingKeys.detail(variables.id),
      });
      showToast.success("ยกเลิกรายการรับเข้าเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถยกเลิกรายการรับเข้าได้"));
    },
  });
}

/**
 * Generate client-side preview of the Internal Lot No. (CCI-YYYYMMDD-XXX).
 * ไม่ใช่เลข lot จริง — เลข lot จริง generate โดย backend เพื่อกัน concurrent duplicate
 * ใช้สำหรับ placeholder ในฟอร์มเท่านั้น
 */
export function usePreviewInternalLotNo(): string {
  return React.useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `CCI-${yyyy}${mm}${dd}-???`;
  }, []);
}
