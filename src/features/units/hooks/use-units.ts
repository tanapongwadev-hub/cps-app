"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  unitsApi,
  type ListUnitsParams,
  type UnitPayload,
  type UpdateUnitPayload,
} from "../api/units-api";

export function useUnits(params: ListUnitsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.UNITS.LIST(params),
    queryFn: () => unitsApi.list(params),
  });
}

export function useUnit(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.UNITS.DETAIL(id ?? ""),
    queryFn: () => unitsApi.get(id as string),
    enabled: !!id,
  });
}

function useUnitInvalidation() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNITS.ALL });
    if (id) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.UNITS.DETAIL(id) });
    }
  };
}

export function useCreateUnit() {
  const invalidate = useUnitInvalidation();
  return useMutation({
    mutationFn: (data: UnitPayload) => unitsApi.create(data),
    onSuccess: () => {
      invalidate();
      showToast.success("สร้างหน่วยนับเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถสร้างหน่วยนับได้", error.message),
  });
}

export function useUpdateUnit() {
  const invalidate = useUnitInvalidation();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUnitPayload }) =>
      unitsApi.update(id, data),
    onSuccess: (_, variables) => {
      invalidate(variables.id);
      showToast.success("แก้ไขหน่วยนับเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถแก้ไขหน่วยนับได้", error.message),
  });
}

export function useDeactivateUnit() {
  const invalidate = useUnitInvalidation();
  return useMutation({
    mutationFn: (id: string) => unitsApi.deactivate(id),
    onSuccess: (_, id) => {
      invalidate(id);
      showToast.success("ปิดใช้งานหน่วยนับเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถปิดใช้งานหน่วยนับได้", error.message),
  });
}

export function useRestoreUnit() {
  const invalidate = useUnitInvalidation();
  return useMutation({
    mutationFn: (id: string) => unitsApi.restore(id),
    onSuccess: (_, id) => {
      invalidate(id);
      showToast.success("เปิดใช้งานหน่วยนับเรียบร้อย");
    },
    onError: (error: Error) =>
      showToast.error("ไม่สามารถเปิดใช้งานหน่วยนับได้", error.message),
  });
}
