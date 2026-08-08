"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  goodsReceiptsApi,
  type CreateGoodsReceiptPayload,
  type UpdateGoodsReceiptPayload,
  type CancelGoodsReceiptPayload,
  type ListGoodsReceiptsParams,
  type GoodsReceiptAttachmentPayload,
} from "../api/goods-receipts-api";

// ============================================================================
// Query Keys
// ============================================================================

export const goodsReceiptKeys = {
  all: ["goods-receipts"] as const,
  lists: () => [...goodsReceiptKeys.all, "list"] as const,
  list: (params: ListGoodsReceiptsParams) => [...goodsReceiptKeys.lists(), params] as const,
  details: () => [...goodsReceiptKeys.all, "detail"] as const,
  detail: (id: string) => [...goodsReceiptKeys.details(), id] as const,
  lookups: (supplierId?: string) => [...goodsReceiptKeys.all, "lookups", supplierId ?? "all"] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useGoodsReceipts(params: ListGoodsReceiptsParams) {
  return useQuery({
    queryKey: goodsReceiptKeys.list(params),
    queryFn: () => goodsReceiptsApi.list(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useGoodsReceiptDetail(id: string) {
  return useQuery({
    queryKey: goodsReceiptKeys.detail(id),
    queryFn: () => goodsReceiptsApi.get(id),
    enabled: !!id,
  });
}

export function useGoodsReceiptLookups(supplierId?: string) {
  return useQuery({
    queryKey: goodsReceiptKeys.lookups(supplierId),
    queryFn: () => goodsReceiptsApi.lookups(supplierId),
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoodsReceiptPayload) => goodsReceiptsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lookups() });
    },
  });
}

export function useUpdateGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateGoodsReceiptPayload;
    }) => goodsReceiptsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.id) });
    },
  });
}

export function useDeleteGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goodsReceiptsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
    },
  });
}

export function usePostGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goodsReceiptsApi.post(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(id) });
    },
  });
}

export function useCancelGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelGoodsReceiptPayload }) =>
      goodsReceiptsApi.cancel(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.id) });
    },
  });
}

export function useUploadGoodsReceiptAttachment() {
  return useMutation({
    mutationFn: (file: File) => goodsReceiptsApi.uploadAttachment(file),
  });
}

export function useAttachGoodsReceiptFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: GoodsReceiptAttachmentPayload;
    }) => goodsReceiptsApi.attachFile(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.id) });
    },
  });
}

export function useRemoveGoodsReceiptAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, attachmentId }: { id: string; attachmentId: string }) =>
      goodsReceiptsApi.removeAttachment(id, attachmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: goodsReceiptKeys.detail(variables.id) });
    },
  });
}
