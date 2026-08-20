"use client";

import * as React from "react";
import { Plus, QrCode, Scissors } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  useCancelMaterialsDisbursement,
  useCreateMaterialsDisbursement,
  useDeleteMaterialsDisbursement,
  useMaterialsDisbursementDetail,
  useMaterialsDisbursementLookups,
  useMaterialsDisbursements,
  useConfirmMaterialsDisbursement,
  useUpdateMaterialsDisbursement,
} from "@/features/materials-disbursement/hooks/use-materials-disbursement";
import { MaterialsDisbursementTable } from "@/features/materials-disbursement/components/materials-disbursement-table";
import { MaterialsDisbursementFilters } from "@/features/materials-disbursement/components/materials-disbursement-filters";
import { MaterialsDisbursementFormDialog } from "@/features/materials-disbursement/components/materials-disbursement-form-dialog";
import { MaterialsDisbursementDetailDialog } from "@/features/materials-disbursement/components/materials-disbursement-detail-dialog";
import { QrTrackingDialog } from "@/features/materials-disbursement/components/qr-tracking-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { useHasPermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/constants/permissions";
import type {
  CreateMaterialsDisbursementPayload,
  ListMaterialsDisbursementParams,
  MaterialsDisbursement,
  UpdateMaterialsDisbursementPayload,
} from "@/features/materials-disbursement/api/materials-disbursement-api";

export default function MaterialsDisbursementPage() {
  // ── Permission ──────────────────────────────────────────────────────────────
  const canCreate = useHasPermission(PERMISSIONS.MATERIALS_DISBURSEMENT_CREATE);
  const canEdit = useHasPermission(PERMISSIONS.MATERIALS_DISBURSEMENT_UPDATE);
  const canDelete = useHasPermission(PERMISSIONS.MATERIALS_DISBURSEMENT_DELETE);
  const canConfirm = useHasPermission(PERMISSIONS.MATERIALS_DISBURSEMENT_CONFIRM);
  const canCancel = useHasPermission(PERMISSIONS.MATERIALS_DISBURSEMENT_CANCEL);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filters, setFilters] = React.useState<ListMaterialsDisbursementParams>({
    page: 1,
    pageSize: 20,
  });

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useMaterialsDisbursements(filters);
  const { data: lookups, isLoading: lookupsLoading } = useMaterialsDisbursementLookups();
  const disbursements = data?.items ?? [];
  const totalItems = data?.meta?.totalItems ?? 0;

  // ── Dialogs ─────────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [qrTrackingOpen, setQrTrackingOpen] = React.useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = React.useState<MaterialsDisbursement | null>(null);

  const { data: detailData, isLoading: detailLoading } = useMaterialsDisbursementDetail(
    selectedDisbursement?.id ?? "",
  );

  // ── Confirm / Cancel ────────────────────────────────────────────────────────
  const [confirmTarget, setConfirmTarget] = React.useState<MaterialsDisbursement | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<MaterialsDisbursement | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");

  const confirmMutation = useConfirmMaterialsDisbursement();
  const cancelMutation = useCancelMaterialsDisbursement();

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    await confirmMutation.mutateAsync(confirmTarget.id);
    setConfirmTarget(null);
  };

  const handleCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    await cancelMutation.mutateAsync({ id: cancelTarget.id, data: { cancelReason: cancelReason.trim() } });
    setCancelTarget(null);
    setCancelReason("");
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = React.useState<MaterialsDisbursement | null>(null);
  const deleteMutation = useDeleteMaterialsDisbursement();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // ── Create / Edit ───────────────────────────────────────────────────────────
  const createMutation = useCreateMaterialsDisbursement();
  const updateMutation = useUpdateMaterialsDisbursement();

  const handleSave = async (
    payload: CreateMaterialsDisbursementPayload | UpdateMaterialsDisbursementPayload,
  ) => {
    if (!selectedDisbursement) {
      await createMutation.mutateAsync(payload as CreateMaterialsDisbursementPayload);
    } else {
      await updateMutation.mutateAsync({
        id: selectedDisbursement.id,
        data: payload as UpdateMaterialsDisbursementPayload,
      });
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleView = (d: MaterialsDisbursement) => {
    setSelectedDisbursement(d);
    setDetailOpen(true);
  };

  const handleEdit = (d: MaterialsDisbursement) => {
    setSelectedDisbursement(d);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedDisbursement(null);
    setFormOpen(true);
  };

  const handleSortChange = (sortBy: NonNullable<ListMaterialsDisbursementParams["sortBy"]>, sortOrder: NonNullable<ListMaterialsDisbursementParams["sortOrder"]>) => {
    setFilters((f) => ({ ...f, sortBy, sortOrder, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((f) => ({ ...f, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters((f) => ({ ...f, pageSize, page: 1 }));
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="การจ่ายออกวัสดุ"
        description="จัดการรายการจ่ายออกวัสดุ สองประเภท: ตัดสต็อก และ เบิกเพื่อผลิต"
        breadcrumbs={[
          { label: "วัสดุ", href: "/materials" },
          { label: "การจ่ายออกวัสดุ" },
        ]}
        secondaryActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrTrackingOpen(true)}
          >
            <QrCode className="h-4 w-4 mr-1" />
            ติดตาม QR
          </Button>
        }
        primaryAction={
          canCreate ? (
            <Button size="sm" onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" />
              สร้างใบจ่ายออก
            </Button>
          ) : undefined
        }
      />

      <MaterialsDisbursementFilters
        filters={filters}
        onFiltersChange={(f) => setFilters(f)}
        disbursementTypes={lookups?.disbursementTypes}
      />

      <MaterialsDisbursementTable
        disbursements={disbursements}
        page={filters.page}
        pageSize={filters.pageSize}
        totalItems={totalItems}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onCreate={canCreate ? handleCreate : undefined}
        onView={handleView}
        onEdit={canEdit ? handleEdit : undefined}
        onDelete={canDelete ? (d) => setDeleteTarget(d) : undefined}
        onConfirm={canConfirm ? (d) => setConfirmTarget(d) : undefined}
        onCancel={canCancel ? (d) => setCancelTarget(d) : undefined}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

      {/* Form Dialog */}
      {lookups && (
        <MaterialsDisbursementFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          disbursement={selectedDisbursement}
          lookups={lookups}
          onSave={handleSave}
          savePending={createMutation.isPending}
        />
      )}

      {/* Detail Dialog */}
      <MaterialsDisbursementDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        disbursement={detailData ?? null}
        isLoading={detailLoading}
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
        onConfirm={handleConfirm}
        loading={confirmMutation.isPending}
        variant="info"
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
        title="ยกเลิกใบจ่ายออก"
        description={
          cancelTarget
            ? `ยกเลิก ${cancelTarget.disbursementNo}? หากเคยยืนยันแล้ว ระบบจะคืนสต็อกวัสดุ`
            : ""
        }
        confirmText="ยกเลิก"
        onConfirm={handleCancel}
        loading={cancelMutation.isPending}
        variant="danger"
        showTextInput
        textInputLabel="เหตุผลการยกเลิก"
        textInputValue={cancelReason}
        onTextInputChange={setCancelReason}
        textInputRequired
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
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
