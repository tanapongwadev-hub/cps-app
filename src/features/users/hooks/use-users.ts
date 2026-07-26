"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type ListUsersParams } from "../api/users-api";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";
import type { User } from "@/types/auth";

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.LIST(params),
    queryFn: () => usersApi.list(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.DETAIL(id),
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User> & { password?: string; roleIds: string[] }) =>
      usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      showToast.success("สร้างผู้ใช้งานเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถสร้างผู้ใช้งานได้", err.message);
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      usersApi.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(vars.id) });
      showToast.success("แก้ไขข้อมูลผู้ใช้งานเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถแก้ไขข้อมูลได้", err.message);
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      showToast.success("ลบผู้ใช้งานเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถลบผู้ใช้งานได้", err.message);
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: User["status"] }) =>
      usersApi.updateStatus(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.USERS.DETAIL(vars.id) });
      showToast.success("อัพเดทสถานะเรียบร้อย");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถอัพเดทสถานะได้", err.message);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => usersApi.resetPassword(id),
    onSuccess: () => {
      showToast.success("รีเซ็ตรหัสผ่านเรียบร้อย", "รหัสผ่านใหม่ถูกส่งไปยังอีเมลผู้ใช้งาน");
    },
    onError: (err: Error) => {
      showToast.error("ไม่สามารถรีเซ็ตรหัสผ่านได้", err.message);
    },
  });
}
