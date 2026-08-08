"use client";

import * as React from "react";
import { Plus, RefreshCw, XCircle } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useRejectReasons,
  useCreateRejectReason,
  useUpdateRejectReason,
  useDeactivateRejectReason,
  useRestoreRejectReason,
} from "@/features/reject-reasons/hooks/use-reject-reasons";
import { RejectReasonFormDialog } from "@/features/reject-reasons/components/reject-reason-form-dialog";
import { RejectReasonTable } from "@/features/reject-reasons/components/reject-reason-table";
import { RejectReasonStatusDialog } from "@/features/reject-reasons/components/reject-reason-status-dialog";
import type {
  RejectReason,
  RejectReasonPayload,
  UpdateRejectReasonPayload,
} from "@/features/reject-reasons/api/reject-reasons-api";

export default function RejectReasonsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingReason, setEditingReason] = React.useState<RejectReason | null>(null);
  const [statusChangeReason, setStatusChangeReason] = React.useState<RejectReason | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useRejectReasons({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive,
    sortBy: "code",
    sortOrder: "asc",
  });

  const createMutation = useCreateRejectReason();
  const updateMutation = useUpdateRejectReason();
  const deactivateMutation = useDeactivateRejectReason();
  const restoreMutation = useRestoreRejectReason();

  const handleSubmit = async (
    payload: RejectReasonPayload | UpdateRejectReasonPayload
  ) => {
    if (editingReason) {
      await updateMutation.mutateAsync({
        id: editingReason.id,
        data: payload as UpdateRejectReasonPayload,
      });
    } else {
      await createMutation.mutateAsync(payload as RejectReasonPayload);
    }
    setFormOpen(false);
    setEditingReason(null);
  };

  const handleStatusConfirm = async (reason: RejectReason) => {
    if (reason.isActive) {
      await deactivateMutation.mutateAsync(reason.id);
    } else {
      await restoreMutation.mutateAsync(reason.id);
    }
    setStatusChangeReason(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการเหตุผลการปฏิเสธ"
          description="จัดการข้อมูลเหตุผลการปฏิเสธวัสดุ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "เหตุผลการปฏิเสธ" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.REJECT_REASON_CREATE}>
              <Button
                onClick={() => {
                  setEditingReason(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                เพิ่มเหตุผลการปฏิเสธ
              </Button>
            </PermissionGuard>
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="h-4 w-4" />
            ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="search"
              placeholder="ค้นหารหัส, ชื่อ..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <select
            value={isActive === undefined ? "all" : isActive ? "true" : "false"}
            onChange={(e) => {
              setIsActive(
                e.target.value === "all"
                  ? undefined
                  : e.target.value === "true"
              );
              setPage(1);
            }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">ทั้งหมด</option>
            <option value="true">ใช้งาน</option>
            <option value="false">ระงับ</option>
          </select>
        </div>

        <RejectReasonTable
          reasons={data?.items ?? []}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0}
          totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          onEdit={(reason) => {
            setEditingReason(reason);
            setFormOpen(true);
          }}
          onStatusChange={setStatusChangeReason}
        />
      </PageContainer>

      <RejectReasonFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingReason(null);
        }}
        reason={editingReason}
        onSave={handleSubmit}
        savePending={createMutation.isPending || updateMutation.isPending}
      />

      <RejectReasonStatusDialog
        open={!!statusChangeReason}
        onOpenChange={(o) => !o && setStatusChangeReason(null)}
        reason={statusChangeReason}
        pending={deactivateMutation.isPending || restoreMutation.isPending}
        onConfirm={() =>
          statusChangeReason && handleStatusConfirm(statusChangeReason)
        }
      />
    </>
  );
}
