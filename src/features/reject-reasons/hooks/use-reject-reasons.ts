"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  rejectReasonsApi,
  type ListRejectReasonsParams,
  type RejectReasonPayload,
  type UpdateRejectReasonPayload,
} from "../api/reject-reasons-api";

// ============================================================================
// Query Keys
// ============================================================================

export const rejectReasonKeys = {
  all: ["reject-reasons"] as const,
  lists: () => [...rejectReasonKeys.all, "list"] as const,
  list: (params: ListRejectReasonsParams) => [...rejectReasonKeys.lists(), params] as const,
};

// ============================================================================
// Queries
// ============================================================================

export function useRejectReasons(params: ListRejectReasonsParams) {
  return useQuery({
    queryKey: rejectReasonKeys.list(params),
    queryFn: () => rejectReasonsApi.list(params),
    placeholderData: (previousData) => previousData,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useCreateRejectReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RejectReasonPayload) => rejectReasonsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rejectReasonKeys.lists() });
    },
  });
}

export function useUpdateRejectReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRejectReasonPayload;
    }) => rejectReasonsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rejectReasonKeys.lists() });
    },
  });
}

export function useDeactivateRejectReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rejectReasonsApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rejectReasonKeys.lists() });
    },
  });
}

export function useRestoreRejectReason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => rejectReasonsApi.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rejectReasonKeys.lists() });
    },
  });
}
