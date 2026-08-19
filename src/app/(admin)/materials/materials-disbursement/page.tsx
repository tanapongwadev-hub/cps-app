"use client";

import * as React from "react";
import { Plus, QrCode, RefreshCw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { PERMISSIONS } from "@/constants/permissions";
import { showToast } from "@/lib/toast";
import { MaterialsDisbursementDetailDialog } from "@/features/materials-disbursement/components/materials-disbursement-detail-dialog";
import { MaterialsDisbursementFilters } from "@/features/materials-disbursement/components/materials-disbursement-filters";
import { MaterialsDisbursementFormDialog } from "@/features/materials-disbursement/components/materials-disbursement-form-dialog";
import { MaterialsDisbursementTable } from "@/features/materials-disbursement/components/materials-disbursement-table";
import { QrTrackingDialog } from "@/features/materials-disbursement/components/qr-tracking-dialog";
import {
  useCancelMaterialsDisbursement,
  useConfirmMaterialsDisbursement,
  useCreateMaterialsDisbursement,
  useDeleteMaterialsDisbursement,
  useMaterialsDisbursementDetail,
  useMaterialsDisbursementLookups,
  useMaterialsDisbursements,
  useUpdateMaterialsDisbursement,
} from "@/features/materials-disbursement/hooks/use-materials-disbursement";
import type {
  CreateMaterialsDisbursementPayload,
  ListMaterialsDisbursementParams,
  MaterialsDisbursement,
  MaterialsDisbursementDetail,
  UpdateMaterialsDisbursementPayload,
} from "@/features/materials-disbursement/api/materials-disbursement-api";

export default function MaterialsDisbursementPage() {
  // ── Filters ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = React.useState<ListMaterialsDisbursementParams>({
    page: 1,
    pageSize: 20,
  });

  // ── Dialog state ──────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MaterialsDisbursement | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MaterialsDisbursement | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<MaterialsDisbursement | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<MaterialsDisbursement | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");
  const [qrTrackingOpen, setQrTrackingOpen] = React.useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const listQuery = useMaterialsDisbursements(filters);
  const lookupsQuery = useMaterialsDisbursementLookups();
  const detailQuery = useMaterialsDisbursementDetail(selectedId ?? "");

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useCreateMaterialsDisbursement();
  const updateMutation = useUpdateMaterialsDisbursement();
  const deleteMutation = useDeleteMaterialsDisbursement();
  const confirmMutation = useConfirmMaterialsDisbursement();
  const cancelMutation = useCancelMaterialsDisbursement();

  // ── Derived ────────────────────────────────────────────────────────────────
  const items = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.meta?.totalItems ?? 0;
  const lookups = lookupsQuery.data ?? {
    disbursementTypes: [],
    materials: [],
    units: [],
  };

  // ── Error toasts ───────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (createMutation.isError) {
      showToast.error(
        createMutation.error instanceof Error
          ? createMutation.error.message
          : "สร้างใบจ่ายออกไม่สำเร็จ",
      );
    }
  }, [createMutation.isError, createMutation.error]);

  React.useEffect(() => {
    if (updateMutation.isError) {
      showToast.error(
        updateMutation.error instanceof Error
          ? updateMutation.error.message
          : "แก้ไขใบจ่ายออกไม่สำเร็จ",
      );
    }
  }, [updateMutation.isError, updateMutation.error]);

  React.useEffect(() => {
    if (deleteMutation.isError) {
      showToast.error(
        deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : "ลบใบจ่ายออกไม่สำเร็จ",
      );
    }
  }, [deleteMutation.isError, deleteMutation.error]);

  React.useEffect(() => {
    if (confirmMutation.isError) {
      showToast.error(
        confirmMutation.error instanceof Error
          ? confirmMutation.error.message
          : "ยืนยันจ่ายออกไม่สำเร็จ",
      );
    }
  }, [confirmMutation.isError, confirmMutation.error]);

  React.useEffect(() => {
    if (cancelMutation.isError) {
      showToast.error(
        cancelMutation.error instanceof Error
          ? cancelMutation.error.message
          : "ยกเลิกใบจ่ายออกไม่สำเร็จ",
      );
    }
  }, [cancelMutation.isError, cancelMutation.error]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSortChange = React.useCallback(
    (sortBy: NonNullable<ListMaterialsDisbursementParams["sortBy"]>, sortOrder: NonNullable<ListMaterialsDisbursementParams["sortOrder"]>) => {
      setFilters((prev) => ({ ...prev, page: 1, sortBy, sortOrder }));
    },
    [],
  );

  const handlePageChange = React.useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, pageSize }));
  }, []);

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (row: MaterialsDisbursement) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleView = (row: MaterialsDisbursement) => {
    setSelectedId(row.id);
    setDetailOpen(true);
  };

  const handleDeleteClick = (row: MaterialsDisbursement) => {
    setDeleteTarget(row);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        showToast.success("ลบใบจ่ายออกเรียบร้อย");
      },
    });
  };

  const handleConfirmClick = (row: MaterialsDisbursement) => {
    setConfirmTarget(row);
  };

  const handleConfirmConfirm = () => {
    if (!confirmTarget) return;
    confirmMutation.mutate(confirmTarget.id, {
      onSuccess: () => {
        setConfirmTarget(null);
        showToast.success("ยืนยันจ่ายออกเรียบร้อย");
        // Refresh detail if open
        if (selectedId === confirmTarget.id) {
          void detailQuery.refetch();
        }
      },
    });
  };

  const handleCancelClick = (row: MaterialsDisbursement) => {
    setCancelTarget(row);
    setCancelReason("");
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    cancelMutation.mutate(
      { id: cancelTarget.id, data: { cancelReason: cancelReason.trim() } },
      {
        onSuccess: () => {
          setCancelTarget(null);
          setCancelReason("");
          showToast.success("ยกเลิกใบจ่ายออกเรียบร้อย");
          if (selectedId === cancelTarget.id) {
            void detailQuery.refetch();
          }
        },
      },
    );
  };

  const handleSave = async (
    payload: CreateMaterialsDisbursementPayload | UpdateMaterialsDisbursementPayload,
  ): Promise<void> => {
    if (editing) {
      const updatePayload: UpdateMaterialsDisbursementPayload = {
        ...(payload as UpdateMaterialsDisbursementPayload),
        updatedAt: editing.updatedAt,
      };
      await updateMutation.mutateAsync({
        id: editing.id,
        data: updatePayload,
      });
    } else {
      await createMutation.mutateAsync(payload as CreateMaterialsDisbursementPayload);
    }
  };

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PermissionGuard
      anyPermission={[
        PERMISSIONS.MATERIALS_DISBURSEMENT_VIEW,
        PERMISSIONS.MATERIALS_DISBURSEMENT_CREATE,
        PERMISSIONS.MATERIALS_DISBURSEMENT_UPDATE,
        PERMISSIONS.MATERIALS_DISBURSEMENT_DELETE,
        PERMISSIONS.MATERIALS_DISBURSEMENT_CONFIRM,
        PERMISSIONS.MATERIALS_DISBURSEMENT_CANCEL,
      ]}
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <PageContainer>
        <PageHeader
          title="จ่ายออกวัสดุ"
          description="จัดการรายการจ่ายออกวัสดุ สองประเภท: ตัดสต็อก และ เบิกเพื่อผลิต"
          breadcrumbs={[
            { label: "วัสดุ", href: "/materials" },
            { label: "จ่ายออกวัสดุ" },
          ]}
          primaryAction={
            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:items-center">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => listQuery.refetch()}
                disabled={listQuery.isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${listQuery.isFetching ? "animate-spin" : ""}`}
                />
                รีเฟรช
              </Button>
              <PermissionGuard permission={PERMISSIONS.MATERIALS_DISBURSEMENT_CREATE}>
                <Button size="sm" className="w-full sm:w-auto" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างใบจ่ายออก
                </Button>
              </PermissionGuard>
            </div>
          }
          secondaryActions={
            <PermissionGuard permission={PERMISSIONS.MATERIALS_DISBURSEMENT_VIEW}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrTrackingOpen(true)}
              >
                <QrCode className="h-4 w-4 mr-2" />
                ติดตาม QR
              </Button>
            </PermissionGuard>
          }
        />

        {/* Filters */}
        <MaterialsDisbursementFilters
          filters={filters}
          onFiltersChange={setFilters}
          disbursementTypes={lookups.disbursementTypes}
        />

        {/* Table */}
        <MaterialsDisbursementTable
          disbursements={items}
          page={filters.page}
          pageSize={filters.pageSize}
          totalItems={totalItems}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          isLoading={listQuery.isLoading}
          isError={listQuery.isError}
          onRetry={() => listQuery.refetch()}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDeleteClick}
          onConfirm={handleConfirmClick}
          onCancel={handleCancelClick}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Form Dialog */}
        {lookupsQuery.data && (
          <MaterialsDisbursementFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            disbursement={editing}
            lookups={lookups}
            onSave={handleSave}
            savePending={isFormPending}
          />
        )}

        {/* Detail Dialog */}
        <MaterialsDisbursementDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          disbursement={detailQuery.data ?? null}
          isLoading={detailQuery.isLoading}
        />

        {/* QR Tracking Dialog */}
        <QrTrackingDialog
          open={qrTrackingOpen}
          onOpenChange={setQrTrackingOpen}
        />

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={!!confirmTarget}
          onOpenChange={(open) => !open && setConfirmTarget(null)}
          title="ยืนยันการจ่ายออก"
          description={
            confirmTarget
              ? `ยืนยันการจ่ายออก ${confirmTarget.disbursementNo}? ระบบจะตัดสต็อกวัสดุตาม FIFO โดยอัตโนมัติ`
              : ""
          }
          confirmText="ยืนยันจ่ายออก"
          loading={confirmMutation.isPending}
          variant="info"
          onConfirm={handleConfirmConfirm}
        />

        {/* Cancel Dialog */}
        <ConfirmDialog
          open={!!cancelTarget}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          title="ยกเลิกใบจ่ายออก"
          description={
            cancelTarget
              ? `ยกเลิก ${cancelTarget.disbursementNo}? หากเคยยืนยันแล้ว ระบบจะคืนสต็อกวัสดุ`
              : ""
          }
          confirmText="ยกเลิก"
          loading={cancelMutation.isPending}
          variant="danger"
          showTextInput
          textInputLabel="เหตุผลการยกเลิก"
          textInputValue={cancelReason}
          onTextInputChange={setCancelReason}
          textInputRequired
          onConfirm={handleCancelConfirm}
        />

        {/* Delete Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="ลบใบจ่ายออก"
          description={
            deleteTarget
              ? `ลบใบจ่ายออก ${deleteTarget.disbursementNo}? สามารถลบได้เฉพาะฉบับร่างเท่านั้น`
              : ""
          }
          confirmText="ลบ"
          loading={deleteMutation.isPending}
          variant="danger"
          onConfirm={handleDeleteConfirm}
        />
      </PageContainer>
    </PermissionGuard>
  );
}
