"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  deliveryTypesApi,
  type ListDeliveryTypesParams,
  type DeliveryTypePayload,
  type UpdateDeliveryTypePayload,
} from "../api/delivery-types-api";

export function useDeliveryTypes(params: ListDeliveryTypesParams) {
  return useQuery({
    queryKey: QUERY_KEYS.DELIVERY_TYPES.LIST(params),
    queryFn: () => deliveryTypesApi.list(params),
  });
}

function useInv() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.DELIVERY_TYPES.ALL });
    if (id) qc.invalidateQueries({ queryKey: QUERY_KEYS.DELIVERY_TYPES.DETAIL(id) });
  };
}

export function useCreateDeliveryType() {
  const inv = useInv();
  return useMutation({
    mutationFn: (data: DeliveryTypePayload) => deliveryTypesApi.create(data),
    onSuccess: () => { inv(); showToast.success("สร้างประเภทการจัดส่งเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถสร้างประเภทการจัดส่งได้", e.message),
  });
}

export function useUpdateDeliveryType() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeliveryTypePayload }) => deliveryTypesApi.update(id, data),
    onSuccess: (_, v) => { inv(v.id); showToast.success("แก้ไขประเภทการจัดส่งเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถแก้ไขประเภทการจัดส่งได้", e.message),
  });
}

export function useDeactivateDeliveryType() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => deliveryTypesApi.deactivate(id),
    onSuccess: (_, id) => { inv(id); showToast.success("ปิดใช้งานประเภทการจัดส่งเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถปิดใช้งานประเภทการจัดส่งได้", e.message),
  });
}

export function useRestoreDeliveryType() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => deliveryTypesApi.restore(id),
    onSuccess: (_, id) => { inv(id); showToast.success("เปิดใช้งานประเภทการจัดส่งเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถเปิดใช้งานประเภทการจัดส่งได้", e.message),
  });
}
