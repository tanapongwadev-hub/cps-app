"use client";

/**
 * Materials Receiving Page
 * รับเข้าวัตถุดิบ (Single material per receiving + Package breakdown + QR Code + Stock Balance)
 * Backend contract: see /cps-api/API_ENDPOINTS.md (Materials Receiving section)
 */
import * as React from "react";
import { Plus, RefreshCw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { showToast } from "@/lib/toast";
import { MaterialsReceivingDetailDialog } from "@/features/materials-receiving/components/materials-receiving-detail-dialog";
import { MaterialsReceivingFilters } from "@/features/materials-receiving/components/materials-receiving-filters";
import { MaterialsReceivingFormDialog } from "@/features/materials-receiving/components/materials-receiving-form-dialog";
import { MaterialsReceivingTable } from "@/features/materials-receiving/components/materials-receiving-table";
import {
  useConfirmMaterialsReceiving,
  useCreateMaterialsReceiving,
  useDeleteMaterialsReceiving,
  useCancelMaterialsReceiving,
  useMaterialsReceivingDetail,
  useMaterialsReceivingLookups,
  useMaterialsReceivings,
  useUpdateMaterialsReceiving,
} from "@/features/materials-receiving/hooks/use-materials-receiving";
import type {
  CancelMaterialsReceivingPayload,
  CreateMaterialsReceivingPayload,
  ListMaterialsReceivingParams,
  MaterialsReceiving,
  MaterialsReceivingDetail,
  UpdateMaterialsReceivingPayload,
} from "@/features/materials-receiving/api/materials-receiving-api";

type SortBy = NonNullable<ListMaterialsReceivingParams["sortBy"]>;
type SortOrder = NonNullable<ListMaterialsReceivingParams["sortOrder"]>;

export default function MaterialsReceivingPage() {
  // List state
  const [filters, setFilters] = React.useState<ListMaterialsReceivingParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  // Dialog state
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MaterialsReceiving | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MaterialsReceiving | null>(
    null,
  );
  const [cancelTarget, setCancelTarget] = React.useState<MaterialsReceiving | null>(
    null,
  );
  const [cancelReason, setCancelReason] = React.useState("");

  // Queries
  const listQuery = useMaterialsReceivings(filters);
  const lookupsQuery = useMaterialsReceivingLookups();
  const detailQuery = useMaterialsReceivingDetail(selectedId ?? "");

  // Mutations
  const createMutation = useCreateMaterialsReceiving();
  const updateMutation = useUpdateMaterialsReceiving();
  const deleteMutation = useDeleteMaterialsReceiving();
  const confirmMutation = useConfirmMaterialsReceiving();
  const cancelMutation = useCancelMaterialsReceiving();

  const items = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.meta?.totalItems ?? 0;
  const lookups = lookupsQuery.data ?? {
    suppliers: [],
    materials: [],
    units: [],
  };

  // Handlers
  const handleSortChange = React.useCallback(
    (sortBy: SortBy, sortOrder: SortOrder) => {
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

  const handleEdit = (row: MaterialsReceiving) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleView = (row: MaterialsReceiving) => {
    setSelectedId(row.id);
    setDetailOpen(true);
  };

  const handleConfirmClick = (row: MaterialsReceiving) => {
    confirmMutation.mutate(row.id, {
      onSuccess: () => setDetailOpen(false),
    });
  };

  const handleCancelClick = (row: MaterialsReceiving) => {
    setCancelTarget(row);
    setCancelReason("");
  };

  const handleCancelConfirm = () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    const payload: CancelMaterialsReceivingPayload = {
      cancelReason: cancelReason.trim(),
    };
    cancelMutation.mutate(
      { id: cancelTarget.id, data: payload },
      {
        onSuccess: () => {
          setCancelTarget(null);
          setCancelReason("");
          setDetailOpen(false);
        },
      },
    );
  };

  const handleDeleteClick = (row: MaterialsReceiving) => {
    setDeleteTarget(row);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleSave = async (
    payload: CreateMaterialsReceivingPayload | UpdateMaterialsReceivingPayload,
  ): Promise<void> => {
    if (editing) {
      // For update, ensure updatedAt is passed
      const updatePayload: UpdateMaterialsReceivingPayload = {
        ...(payload as UpdateMaterialsReceivingPayload),
        updatedAt: editing.updatedAt,
      };
      await updateMutation.mutateAsync({
        id: editing.id,
        data: updatePayload,
      });
    } else {
      await createMutation.mutateAsync(
        payload as CreateMaterialsReceivingPayload,
      );
    }
  };

  const isFormPending =
    createMutation.isPending || updateMutation.isPending;

  // When user tries to confirm via detail dialog, optimistically close after success
  const handleDetailConfirm = (detail: MaterialsReceivingDetail) => {
    confirmMutation.mutate(detail.id, {
      onSuccess: () => setDetailOpen(false),
    });
  };

  const handleDetailCancel = (detail: MaterialsReceivingDetail) => {
    setCancelTarget(detail);
    setCancelReason("");
  };

  // Show toast for non-actionable errors
  React.useEffect(() => {
    if (createMutation.isError) {
      showToast.error(
        createMutation.error instanceof Error
          ? createMutation.error.message
          : "สร้างรายการรับเข้าไม่สำเร็จ",
      );
    }
  }, [createMutation.isError, createMutation.error]);

  return (
    <PermissionGuard
      anyPermission={[
        PERMISSIONS.MATERIALS_RECEIVING_VIEW,
        PERMISSIONS.MATERIALS_RECEIVING_CREATE,
        PERMISSIONS.MATERIALS_RECEIVING_UPDATE,
        PERMISSIONS.MATERIALS_RECEIVING_DELETE,
        PERMISSIONS.MATERIALS_RECEIVING_CONFIRM,
        PERMISSIONS.MATERIALS_RECEIVING_CANCEL,
      ]}
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <PageContainer>
        <PageHeader
          title="รับเข้าวัตถุดิบ (Materials Receiving)"
          description="สร้างใบรับเข้าวัตถุดิบ พร้อมคำนวณบรรจุภัณฑ์ + QR Code + อัปเดตสต็อกอัตโนมัติ"
          primaryAction={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => listQuery.refetch()}
                disabled={listQuery.isFetching}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${listQuery.isFetching ? "animate-spin" : ""}`}
                />
                รีเฟรช
              </Button>
              <PermissionGuard permission={PERMISSIONS.MATERIALS_RECEIVING_CREATE}>
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างรายการรับเข้า
                </Button>
              </PermissionGuard>
            </div>
          }
        />

        {/* Filters */}
        <MaterialsReceivingFilters
          filters={filters}
          onFiltersChange={setFilters}
          suppliers={lookups.suppliers.map((s) => ({
            id: s.id,
            nameTh: s.nameTh,
          }))}
          materials={lookups.materials.map((m) => ({
            id: m.id,
            code: m.code,
            name: m.name,
          }))}
        />

        {/* Table */}
        <MaterialsReceivingTable
          receivings={items}
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
        <MaterialsReceivingFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          receiving={editing}
          lookups={lookups}
          onSave={handleSave}
          savePending={isFormPending}
        />

        {/* Detail Dialog */}
        <MaterialsReceivingDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          receiving={detailQuery.data}
          isLoading={detailQuery.isLoading}
          onConfirm={handleDetailConfirm}
          onCancel={handleDetailCancel}
          onEdit={(detail) => {
            setEditing(detail);
            setDetailOpen(false);
            setFormOpen(true);
          }}
          confirmPending={confirmMutation.isPending}
          cancelPending={cancelMutation.isPending}
        />

        {/* Cancel Confirm Dialog (with reason textarea) */}
        <ConfirmDialog
          open={!!cancelTarget}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          title="ยกเลิกการรับเข้า"
          description={
            <div className="space-y-3">
              <p>
                {cancelTarget
                  ? `ยกเลิกการรับเข้า ${cancelTarget.internalLotNo}? ${
                      cancelTarget.status === "confirmed"
                        ? "ระบบจะ revert สต็อกกลับด้วย"
                        : ""
                    }`
                  : "ยกเลิกการรับเข้า?"}
              </p>
              <div className="space-y-1.5 text-left">
                <label htmlFor="cancel-reason" className="text-sm font-medium">
                  เหตุผลในการยกเลิก <span className="text-danger">*</span>
                </label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="ระบุเหตุผล..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
          }
          confirmText="ยกเลิกการรับเข้า"
          variant="danger"
          loading={cancelMutation.isPending}
          onConfirm={handleCancelConfirm}
        />

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="ลบรายการรับเข้า"
          description={`ต้องการลบรายการ ${deleteTarget?.internalLotNo ?? "ฉบับร่าง"}? การกระทำนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ลบ"
          variant="danger"
          loading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
        />
      </PageContainer>
    </PermissionGuard>
  );
}
