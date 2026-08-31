"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/services/api-client";
import { QUERY_KEYS } from "@/constants/app";
import { showToast } from "@/lib/toast";
import type { Ticket, TicketComment } from "@/types/ticket";

export interface TicketDetailResponse {
  ticket: Ticket;
  comments: TicketComment[];
}

export function useTicketDetail(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.TICKETS.DETAIL(id ?? ""),
    queryFn: () => apiClient.get<TicketDetailResponse>(`/tickets/${id}`),
    enabled: !!id,
  });
}

export function useAddTicketComment(id: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => apiClient.post(`/tickets/${id}/comments`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.DETAIL(id ?? "") });
      showToast.success("เพิ่มความคิดเห็นเรียบร้อย");
    },
    onError: () => {
      showToast.error("ไม่สามารถเพิ่มความคิดเห็นได้");
    },
  });
}
