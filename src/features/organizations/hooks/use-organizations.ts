"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import {
  organizationsApi,
  type ListOrganizationsParams,
  type OrganizationPayload,
  type UpdateOrganizationPayload,
} from "../api/organizations-api";

export function useOrganizations(params: ListOrganizationsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.ORGANIZATIONS.LIST(params),
    queryFn: () => organizationsApi.list(params),
  });
}

function useInv() {
  const qc = useQueryClient();
  return (id?: string) => {
    qc.invalidateQueries({ queryKey: QUERY_KEYS.ORGANIZATIONS.ALL });
    if (id) qc.invalidateQueries({ queryKey: QUERY_KEYS.ORGANIZATIONS.DETAIL(id) });
  };
}

export function useCreateOrganization() {
  const inv = useInv();
  return useMutation({
    mutationFn: (d: OrganizationPayload) => organizationsApi.create(d),
    onSuccess: () => { inv(); showToast.success("สร้างองค์กรเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถสร้างองค์กรได้", e.message),
  });
}

export function useUpdateOrganization() {
  const inv = useInv();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationPayload }) => organizationsApi.update(id, data),
    onSuccess: (_, v) => { inv(v.id); showToast.success("แก้ไของค์กรเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถแก้ไของค์กรได้", e.message),
  });
}

export function useDeactivateOrganization() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => organizationsApi.deactivate(id),
    onSuccess: (_, id) => { inv(id); showToast.success("ปิดใช้งานองค์กรเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถปิดใช้งานองค์กรได้", e.message),
  });
}

export function useRestoreOrganization() {
  const inv = useInv();
  return useMutation({
    mutationFn: (id: string) => organizationsApi.restore(id),
    onSuccess: (_, id) => { inv(id); showToast.success("เปิดใช้งานองค์กรเรียบร้อย"); },
    onError: (e: Error) => showToast.error("ไม่สามารถเปิดใช้งานองค์กรได้", e.message),
  });
}
