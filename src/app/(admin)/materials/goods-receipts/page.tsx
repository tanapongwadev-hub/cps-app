"use client";

/**
 * Goods Receipts Page
 * รายการรับวัสดุ (Goods Receipts)
 * Backend contract: see API_ENDPOINTS.md
 */
import * as React from "react";
import { FileInput, Plus, RefreshCw } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useGoodsReceipts,
  useGoodsReceiptDetail,
  useGoodsReceiptLookups,
  useCreateGoodsReceipt,
  useUpdateGoodsReceipt,
  useDeleteGoodsReceipt,
  usePostGoodsReceipt,
  useCancelGoodsReceipt,
  useUploadGoodsReceiptAttachment,
} from "@/features/goods-receipts/hooks/use-goods-receipts";
import { GoodsReceiptTable } from "@/features/goods-receipts/components/goods-receipt-table";
import { GoodsReceiptFilters } from "@/features/goods-receipts/components/goods-receipt-filters";
import { GoodsReceiptFormDialog } from "@/features/goods-receipts/components/goods-receipt-form-dialog";
import { GoodsReceiptDetailDialog } from "@/features/goods-receipts/components/goods-receipt-detail-dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import type {
  CreateGoodsReceiptPayload,
  UpdateGoodsReceiptPayload,
  GoodsReceipt,
  GoodsReceiptDetail,
  ListGoodsReceiptsParams,
} from "@/features/goods-receipts/api/goods-receipts-api";

type SortBy = NonNullable<ListGoodsReceiptsParams["sortBy"]>;
type SortOrder = NonNullable<ListGoodsReceiptsParams["sortOrder"]>;

export default function GoodsReceiptsPage() {
  // State
  const [filters, setFilters] = React.useState<ListGoodsReceiptsParams>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingReceipt, setEditingReceipt] = React.useState<GoodsReceipt | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GoodsReceipt | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<GoodsReceipt | null>(null);
  const [cancelReason, setCancelReason] = React.useState("");

  // Queries
  const listQuery = useGoodsReceipts(filters);
  const lookupsQuery = useGoodsReceiptLookups();
  const detailQuery = useGoodsReceiptDetail(selectedReceiptId ?? "");

  // Mutations
  const createMutation = useCreateGoodsReceipt();
  const updateMutation = useUpdateGoodsReceipt();
  const deleteMutation = useDeleteGoodsReceipt();
  const postMutation = usePostGoodsReceipt();
  const cancelMutation = useCancelGoodsReceipt();
  const uploadMutation = useUploadGoodsReceiptAttachment();

  // Derived data
  const items = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.meta?.totalItems ?? 0;
  const lookups = lookupsQuery.data ?? {
    suppliers: [],
    materials: [],
    units: [],
    rejectReasons: [],
  };

  // Handlers
  const handleSortChange = React.useCallback(
    (sortBy: SortBy, sortOrder: SortOrder) => {
      setFilters((prev) => ({ ...prev, page: 1, sortBy, sortOrder }));
    },
    []
  );

  const handlePageChange = React.useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handlePageSizeChange = React.useCallback((pageSize: number) => {
    setFilters((prev) => ({ ...prev, page: 1, pageSize }));
  }, []);

  const handleCreate = () => {
    setEditingReceipt(null);
    setFormOpen(true);
  };

  const handleEdit = (receipt: GoodsReceipt) => {
    setEditingReceipt(receipt);
    setFormOpen(true);
  };

  const handleView = (receipt: GoodsReceipt) => {
    setSelectedReceiptId(receipt.id);
    setDetailOpen(true);
  };

  const handlePost = (receipt: GoodsReceipt) => {
    postMutation.mutate(receipt.id, {
      onSuccess: () => {
        setDetailOpen(false);
      },
    });
  };

  const handleCancelClick = (receipt: GoodsReceipt) => {
    setCancelTarget(receipt);
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
          setDetailOpen(false);
        },
      }
    );
  };

  const handleDeleteClick = (receipt: GoodsReceipt) => {
    setDeleteTarget(receipt);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  };

  const handleSave = async (payload: CreateGoodsReceiptPayload | UpdateGoodsReceiptPayload) => {
    if (editingReceipt) {
      await updateMutation.mutateAsync({ id: editingReceipt.id, data: { ...payload, updatedAt: editingReceipt.updatedAt } });
    } else {
      await createMutation.mutateAsync(payload as CreateGoodsReceiptPayload);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    return uploadMutation.mutateAsync(file);
  };

  const isFormPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PermissionGuard
      anyPermission={[
        PERMISSIONS.GOODS_RECEIPT_VIEW,
        PERMISSIONS.GOODS_RECEIPT_CREATE,
        PERMISSIONS.GOODS_RECEIPT_UPDATE,
        PERMISSIONS.GOODS_RECEIPT_DELETE,
        PERMISSIONS.GOODS_RECEIPT_POST,
        PERMISSIONS.GOODS_RECEIPT_CANCEL,
      ]}
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
        </div>
      }
    >
      <PageContainer>
        <PageHeader
          title="รายการรับวัสดุ"
          description="จัดการรายการรับวัสดุ (Goods Receipts)"
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
              <PermissionGuard permission={PERMISSIONS.GOODS_RECEIPT_CREATE}>
                <Button size="sm" onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างรายการรับวัสดุ
                </Button>
              </PermissionGuard>
            </div>
          }
        />

        {/* Filters */}
        <GoodsReceiptFilters
          filters={filters}
          onFiltersChange={setFilters}
          suppliers={lookups.suppliers.map((s) => ({ id: s.id, nameTh: s.nameTh }))}
        />

        {/* Table */}
        <GoodsReceiptTable
          receipts={items}
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
          onPost={(receipt) => {
            setSelectedReceiptId(receipt.id);
            setDetailOpen(true);
          }}
          onCancel={(receipt) => {
            setSelectedReceiptId(receipt.id);
            setDetailOpen(true);
          }}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        {/* Form Dialog */}
        <GoodsReceiptFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          receipt={editingReceipt}
          lookups={lookups}
          onSave={handleSave}
          onUploadAttachment={handleUploadAttachment}
          savePending={isFormPending}
          uploadPending={uploadMutation.isPending}
        />

        {/* Detail Dialog */}
        <GoodsReceiptDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          receiptId={selectedReceiptId}
          isLoading={detailQuery.isLoading}
          receipt={detailQuery.data}
          onPost={handlePost}
          onCancel={handleCancelClick}
          postPending={postMutation.isPending}
          cancelPending={cancelMutation.isPending}
        />

        {/* Cancel Confirm Dialog */}
        <ConfirmDialog
          open={!!cancelTarget}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          title="ยกเลิกเอกสาร"
          description={
            <div className="space-y-3">
              <p>{`ยกเลิกเอกสาร ${cancelTarget?.receiptNo ?? "ฉบับร่าง"}? การกระทำนี้ไม่สามารถย้อนกลับได้`}</p>
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
          confirmText="ยกเลิกเอกสาร"
          variant="danger"
          loading={cancelMutation.isPending}
          onConfirm={handleCancelConfirm}
        />

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="ลบรายการรับวัสดุ"
          description={`ต้องการลบรายการ ${deleteTarget?.receiptNo ?? "ฉบับร่าง"}? การกระทำนี้ไม่สามารถย้อนกลับได้`}
          confirmText="ลบ"
          variant="danger"
          loading={deleteMutation.isPending}
          onConfirm={handleDeleteConfirm}
        />
      </PageContainer>
    </PermissionGuard>
  );
}
