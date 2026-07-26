"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Pencil, Trash2, Ticket as TicketIcon, Clock, AlertCircle, Search } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import { TextField, SelectField } from "@/components/forms/form-field";
import { useDebounce } from "@/hooks/use-debounce";
import { apiClient } from "@/services/api-client";
import type { Ticket, TicketStatus } from "@/types/ticket";
import type { PaginatedResponse } from "@/types/common";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { showToast } from "@/lib/toast";
import { getInitials } from "@/utils/format";
import { formatRelative } from "@/utils/date";
import { QUERY_KEYS } from "@/constants/app";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";

const statusVariant: Record<TicketStatus, "warning" | "info" | "success" | "muted" | "danger"> = {
  PENDING: "warning",
  PENDING_IAPP: "warning",
  IN_PROGRESS: "info",
  ON_HOLD: "muted",
  RESOLVED: "success",
  CLOSED: "muted",
  CANCELLED: "danger",
  REJECTED: "danger",
};

const statusLabel: Record<TicketStatus, string> = {
  PENDING: "รอดำเนินการ",
  PENDING_IAPP: "รออนุมัติ",
  IN_PROGRESS: "กำลังดำเนินการ",
  ON_HOLD: "พักงาน",
  RESOLVED: "แก้ไขแล้ว",
  CLOSED: "ปิดงาน",
  CANCELLED: "ยกเลิก",
  REJECTED: "ปฏิเสธ",
};

const priorityVariant = {
  low: "muted" as const,
  medium: "info" as const,
  high: "warning" as const,
  urgent: "danger" as const,
};

const priorityLabel = {
  low: "ต่ำ",
  medium: "ปกติ",
  high: "สูง",
  urgent: "เร่งด่วน",
};

export default function TicketsPage() {
  const qc = useQueryClient();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [priorityFilter, setPriorityFilter] = React.useState<string>("");

  const ticketsQuery = useQuery({
    queryKey: [...QUERY_KEYS.TICKETS.ALL, { page, pageSize, search: debouncedSearch, status: statusFilter, priority: priorityFilter }],
    queryFn: () =>
      apiClient.get<PaginatedResponse<Ticket>>("/tickets", {
        params: {
          page,
          pageSize,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        },
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tickets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.TICKETS.ALL });
      showToast.success("ลบคำขอเรียบร้อย");
    },
    onError: (err: Error) => showToast.error("ลบไม่สำเร็จ", err.message),
  });

  const columns: ColumnDef<Ticket>[] = React.useMemo(
    () => [
      {
        id: "ticket",
        header: "คำขอ",
        cell: ({ row }) => {
          const t = row.original;
          return (
            <div className="min-w-0">
              <Link
                href={`/operations/tickets/${t.id}`}
                className="text-sm font-medium hover:underline truncate block"
              >
                {t.subject}
              </Link>
              <p className="text-xs text-muted-foreground">{t.ticketNumber}</p>
            </div>
          );
        },
      },
      {
        id: "category",
        header: "หมวดหมู่",
        cell: ({ row }) => <Badge variant="outline">{row.original.categoryName}</Badge>,
      },
      {
        id: "priority",
        header: "ความสำคัญ",
        cell: ({ row }) => (
          <Badge variant={priorityVariant[row.original.priority]}>
            {priorityLabel[row.original.priority]}
          </Badge>
        ),
      },
      {
        id: "status",
        header: "สถานะ",
        cell: ({ row }) => (
          <Badge variant={statusVariant[row.original.status]}>
            {statusLabel[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "requester",
        header: "ผู้แจ้ง",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              <AvatarFallback>{getInitials(row.original.requesterName)}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{row.original.requesterName}</span>
          </div>
        ),
      },
      {
        id: "assignee",
        header: "ผู้รับผิดชอบ",
        cell: ({ row }) =>
          row.original.assigneeName ? (
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(row.original.assigneeName)}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{row.original.assigneeName}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">- ยังไม่มอบหมาย -</span>
          ),
      },
      {
        id: "dueDate",
        header: "กำหนดเสร็จ",
        cell: ({ row }) => {
          const due = row.original.dueDate;
          if (!due) return <span className="text-xs text-muted-foreground">-</span>;
          const isOverdue = new Date(due) < new Date() && !["RESOLVED", "CLOSED", "CANCELLED"].includes(row.original.status);
          return (
            <span className={cn("text-xs", isOverdue && "text-danger font-medium")}>
              {isOverdue && <AlertCircle className="inline h-3 w-3 mr-0.5" />}
              {formatRelative(due)}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 60,
        enableSorting: false,
        cell: ({ row }) => {
          const t = row.original;
          return (
            <ActionMenu
              label={`เมนู ${t.ticketNumber}`}
              items={[
                {
                  label: "ดูรายละเอียด",
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onClick: () => (window.location.href = `/operations/tickets/${t.id}`),
                },
                { label: "แก้ไข", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => {} },
                {
                  label: "ลบ",
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  variant: "danger",
                  onClick: () => {
                    if (confirm(`ต้องการลบ ${t.ticketNumber}?`)) {
                      deleteMutation.mutate(t.id);
                    }
                  },
                },
              ]}
            />
          );
        },
      },
    ],
    [deleteMutation],
  );

  return (
    <>
      <PageContainer>
        <PageHeader
          title="คำขอ / ตั๋ว"
          description="จัดการคำขอและตั๋วในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "การดำเนินงาน" },
            { label: "คำขอ / ตั๋ว" },
          ]}
          primaryAction={
            <Button onClick={() => showToast.info("สร้างคำขอ", "ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้")}>
              <Plus className="h-4 w-4" />
              สร้างคำขอ
            </Button>
          }
        />

        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <SelectField
              placeholder="ทุกสถานะ"
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "ทุกสถานะ" },
                ...Object.entries(statusLabel).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
            <SelectField
              placeholder="ทุกความสำคัญ"
              value={priorityFilter}
              onValueChange={(v) => {
                setPriorityFilter(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "ทุกความสำคัญ" },
                ...Object.entries(priorityLabel).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
          </div>
        </Card>

        <DataTable
          columns={columns}
          data={ticketsQuery.data?.items ?? []}
          isLoading={ticketsQuery.isLoading}
          isError={ticketsQuery.isError}
          onRetry={() => ticketsQuery.refetch()}
          totalItems={ticketsQuery.data?.totalItems ?? 0}
          globalSearch={false}
          enableColumnVisibility
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={ticketsQuery.data?.totalPages ?? 1}
          onPaginationChange={({ pageIndex, pageSize: ps }) => {
            setPage(pageIndex + 1);
            setPageSize(ps);
          }}
          manualPagination
          emptyState={{
            title: "ไม่พบคำขอ",
            description: "ลองเปลี่ยนเงื่อนไขการค้นหาหรือสร้างคำขอใหม่",
          }}
        />
      </PageContainer>
      <PageFooter />
    </>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
