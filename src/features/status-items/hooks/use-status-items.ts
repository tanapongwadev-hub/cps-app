"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  statusItemsApi,
  type ListStatusItemsParams,
  type StatusItemPayload,
  type UpdateStatusItemPayload,
} from "../api/status-items-api";

export function useStatusItems(params: ListStatusItemsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.STATUS_ITEMS.LIST(params),
    queryFn: () => statusItemsApi.list(params),
  });
}

function useInv() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.STATUS_ITEMS.ALL });
    if (id) qc.invalidateQueries({ queryKey: QUERY_KEYS.STATUS_ITEMS.DETAIL(id) });
  };
}

export function useCreateStatusItem() {
  const inv = useInv();
  return useMutation({
    mutationFn: (d: StatusItemPayload) => statusItemsApi.create(d),
    onSuccess: () => { inv(); showToast.success("สร้างสถานะเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถสร้างสถานะได้", e.message),
  });
}

export function useUpdateStatusItem() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusItemPayload }) => statusItemsApi.update(id, data),
    onSuccess: (_, v) => { inv(v.id); showToast.success("แก้ไขสถานะเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถแก้ไขสถานะได้", e.message),
  });
}

export function useDeactivateStatusItem() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => statusItemsApi.deactivate(id),
    onSuccess: (_, id) => { inv(id); showToast.success("ปิดใช้งานสถานะเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถปิดใช้งานสถานะได้", e.message),
  });
}

export function useRestoreStatusItem() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => statusItemsApi.restore(id),
    onSuccess: (_, id) => { inv(id); showToast.success("เปิดใช้งานสถานะเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถเปิดใช้งานสถานะได้", e.message),
  });
}
