"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import { materialsDisbursementApi } from "../api/materials-disbursement-api";
import type {
  CancelMaterialsDisbursementPayload,
  CreateMaterialsDisbursementPayload,
  ListMaterialsDisbursementParams,
  UpdateMaterialsDisbursementPayload,
} from "../api/materials-disbursement-api";

// ============================================================================
// Query Keys
// ============================================================================

export const materialsDisbursementKeys = {
  all: ["materials-disbursement"] as const,
  lists: () => [...materialsDisbursementKeys.all, "list"] as const,
  list: (params: ListMaterialsDisbursementParams) =>
    [...materialsDisbursementKeys.lists(), params] as const,
  details: () => [...materialsDisbursementKeys.all, "detail"] as const,
  detail: (id: string) => [...materialsDisbursementKeys.details(), id] as const,
  lookups: () => [...materialsDisbursementKeys.all, "lookups"] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useMaterialsDisbursements(params: ListMaterialsDisbursementParams) {
  return useQuery({
    queryKey: materialsDisbursementKeys.list(params),
    queryFn: () => materialsDisbursementApi.list(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useMaterialsDisbursementDetail(id: string) {
  return useQuery({
    queryKey: materialsDisbursementKeys.detail(id),
    queryFn: () => materialsDisbursementApi.get(id),
    enabled: !!id,
  });
}

export function useMaterialsDisbursementLookups() {
  return useQuery({
    queryKey: materialsDisbursementKeys.lookups(),
    queryFn: () => materialsDisbursementApi.lookups(),
  });
}

// ============================================================================
// Mutations
// ============================================================================

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export function useCreateMaterialsDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMaterialsDisbursementPayload) =>
      materialsDisbursementApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsDisbursementKeys.lists() });
      showToast.success("สร้างรายการจ่ายออกเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถสร้างรายการจ่ายออกได้"));
    },
  });
}

export function useUpdateMaterialsDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaterialsDisbursementPayload;
    }) => materialsDisbursementApi.update(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: materialsDisbursementKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: materialsDisbursementKeys.detail(variables.id),
      });
      showToast.success("บันทึกการแก้ไขเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถบันทึกการแก้ไขได้"));
    },
  });
}

export function useDeleteMaterialsDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => materialsDisbursementApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialsDisbursementKeys.lists() });
      showToast.success("ลบรายการจ่ายออกเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถลบรายการจ่ายออกได้"));
    },
  });
}

export function useConfirmMaterialsDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => materialsDisbursementApi.confirm(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: materialsDisbursementKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: materialsDisbursementKeys.detail(id),
      });
      showToast.success("ยืนยันการจ่ายออกเรียบร้อย — ตัดสต็อกแล้ว");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถยืนยันการจ่ายออกได้"));
    },
  });
}

export function useCancelMaterialsDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CancelMaterialsDisbursementPayload;
    }) => materialsDisbursementApi.cancel(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: materialsDisbursementKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: materialsDisbursementKeys.detail(variables.id),
      });
      showToast.success("ยกเลิกรายการจ่ายออกเรียบร้อย");
    },
    onError: (error) => {
      showToast.error(toErrorMessage(error, "ไม่สามารถยกเลิกรายการจ่ายออกได้"));
    },
  });
}
