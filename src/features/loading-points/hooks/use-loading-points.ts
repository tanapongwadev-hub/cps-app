"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  loadingPointsApi,
  type ListLoadingPointsParams,
  type LoadingPointPayload,
  type UpdateLoadingPointPayload,
} from "../api/loading-points-api";

export function useLoadingPoints(params: ListLoadingPointsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.LOADING_POINTS.LIST(params),
    queryFn: () => loadingPointsApi.list(params),
  });
}

function useInv() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.LOADING_POINTS.ALL });
    if (id) qc.invalidateQueries({ queryKey: QUERY_KEYS.LOADING_POINTS.DETAIL(id) });
  };
}

export function useCreateLoadingPoint() {
  const inv = useInv();
  return useMutation({
    mutationFn: (data: LoadingPointPayload) => loadingPointsApi.create(data),
    onSuccess: () => { inv(); showToast.success("สร้างจุดขนถ่ายเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถสร้างจุดขนถ่ายได้", e.message),
  });
}

export function useUpdateLoadingPoint() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLoadingPointPayload }) => loadingPointsApi.update(id, data),
    onSuccess: (_, v) => { inv(v.id); showToast.success("แก้ไขจุดขนถ่ายเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถแก้ไขจุดขนถ่ายได้", e.message),
  });
}

export function useDeactivateLoadingPoint() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => loadingPointsApi.deactivate(id),
    onSuccess: (_, id) => { inv(id); showToast.success("ปิดใช้งานจุดขนถ่ายเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถปิดใช้งานจุดขนถ่ายได้", e.message),
  });
}

export function useRestoreLoadingPoint() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => loadingPointsApi.restore(id),
    onSuccess: (_, id) => { inv(id); showToast.success("เปิดใช้งานจุดขนถ่ายเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถเปิดใช้งานจุดขนถ่ายได้", e.message),
  });
}
