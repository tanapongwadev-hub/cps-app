"use client";

/**
 * BOM Management — Bill of Materials page
 *
 * Shows all BOM versions for a product.
 * Allows create, edit, activate/deactivate BOMs.
 * Add/remove materials from a BOM.
 */

import * as React from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, FileText, Loader2, Plus, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useBom,
  useBomsByProduct,
  useCreateBom,
  useUpdateBom,
  useAddBomItem,
  useRemoveBomItem,
  useActivateBom,
  useDeactivateBom,
  useDeleteBom,
} from "@/features/products/hooks/use-products";
import { BomItemDialog } from "@/features/products/components/bom-item-dialog";
import { BomCard } from "@/features/products/components/bom-card";

// Code-split: only fetched once the user opens the create/edit modal.
const BomFormModal = dynamic(
  () => import("@/features/products/components/bom-form-modal").then((mod) => mod.BomFormModal),
  { ssr: false },
);
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { showToast } from "@/lib/toast";
import type {
  CreateBomItemPayload,
  CreateBomPayload,
  ProductBom,
  UpdateBomPayload,
} from "@/features/products/api/products-api";

export default function BomPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const bomsQuery = useBomsByProduct(productId);
  const boms: ProductBom[] = (bomsQuery.data as ProductBom[]) ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  // Only mount the (code-split) create modal once the user opens it.
  const [hasOpenedCreate, setHasOpenedCreate] = React.useState(false);
  React.useEffect(() => {
    if (createOpen) setHasOpenedCreate(true);
  }, [createOpen]);
  const [selectedBom, setSelectedBom] = React.useState<ProductBom | null>(null);
  const [editBomOpen, setEditBomOpen] = React.useState(false);
  const [addItemBomId, setAddItemBomId] = React.useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);

  const createMutation = useCreateBom();
  const updateMutation = useUpdateBom();
  const addItemMutation = useAddBomItem();
  const removeItemMutation = useRemoveBomItem();
  const activateMutation = useActivateBom();
  const deactivateMutation = useDeactivateBom();
  const deleteMutation = useDeleteBom();

  const handleCreate = async (payload: CreateBomPayload) => {
    await createMutation.mutateAsync(payload);
    setCreateOpen(false);
  };

  const handleEditBom = async (id: string, payload: UpdateBomPayload) => {
    await updateMutation.mutateAsync({ id, data: payload });
    setEditBomOpen(false);
    setSelectedBom(null);
  };

  const handleAddItem = async (bomId: string, item: CreateBomItemPayload) => {
    await addItemMutation.mutateAsync({ bomId, data: item });
    setAddItemBomId(null);
  };

  const handleRemoveItem = async (bomId: string, itemId: string) => {
    await removeItemMutation.mutateAsync({ bomId, itemId });
  };

  const handleActivate = async (id: string) => {
    await activateMutation.mutateAsync(id);
  };

  const handleDeactivate = async (id: string) => {
    await deactivateMutation.mutateAsync(id);
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    await deleteMutation.mutateAsync(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const activeBom = boms.find((b) => b.status === "ACTIVE");
  const draftBoms = boms.filter((b) => b.status === "DRAFT");
  const inactiveBoms = boms.filter((b) => b.status === "INACTIVE");

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/products">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Bill of Materials</h1>
              <p className="text-muted-foreground text-sm">
                {activeBom
                  ? `${activeBom.product.name} (${activeBom.product.code})`
                  : `Product ID: ${productId}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bomsQuery.refetch()}
              disabled={bomsQuery.isFetching}
            >
              <RefreshCw className={bomsQuery.isFetching ? "size-3.5 animate-spin" : "size-3.5"} />
              รีเฟรช
            </Button>
            <PermissionGuard permission={PERMISSIONS.BOMS_CREATE}>
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="size-4" />
                สร้าง BOM ใหม่
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Loading */}
        {bomsQuery.isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="text-primary size-8 animate-spin" />
          </div>
        )}

        {/* Error */}
        {bomsQuery.isError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
            <p className="text-destructive text-sm">โหลด BOM ล้มเหลว</p>
            <Button variant="outline" size="sm" onClick={() => bomsQuery.refetch()} className="mt-2">
              ลองใหม่
            </Button>
          </div>
        )}

        {!bomsQuery.isLoading && boms.length === 0 && (
          <div className="rounded-xl border border-dashed py-16 text-center">
            <FileText className="text-muted-foreground/40 mx-auto mb-3 size-10" />
            <p className="text-muted-foreground">ยังไม่มี BOM สำหรับสินค้านี้</p>
            <PermissionGuard permission={PERMISSIONS.BOMS_CREATE}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="mt-3 gap-1.5"
              >
                <Plus className="size-3.5" />
                สร้าง BOM ใหม่
              </Button>
            </PermissionGuard>
          </div>
        )}

        {/* Active BOM */}
        {activeBom && (
          <BomCard
            bom={activeBom}
            label="ACTIVE"
            labelClass="success"
            onEdit={() => { setSelectedBom(activeBom); setEditBomOpen(true); }}
            onAddItem={() => setAddItemBomId(activeBom.id)}
            onRemoveItem={handleRemoveItem}
            onActivate={null}
            onDeactivate={handleDeactivate}
            onDelete={null}
            canEdit={false}
            canActivate={false}
            canDeactivate={PERMISSIONS.BOMS_DEACTIVATE}
            canDelete={false}
            isUpdating={deactivateMutation.isPending}
          />
        )}

        {/* Draft BOMs */}
        {draftBoms.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">DRAFT</h2>
            {draftBoms.map((bom) => (
              <BomCard
                key={bom.id}
                bom={bom}
                label="DRAFT"
                labelClass="secondary"
                onEdit={() => { setSelectedBom(bom); setEditBomOpen(true); }}
                onAddItem={() => setAddItemBomId(bom.id)}
                onRemoveItem={handleRemoveItem}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
                onDelete={handleDelete}
                canEdit={PERMISSIONS.BOMS_UPDATE}
                canActivate={PERMISSIONS.BOMS_ACTIVATE}
                canDeactivate={PERMISSIONS.BOMS_DEACTIVATE}
                canDelete={PERMISSIONS.BOMS_DELETE}
                isUpdating={activateMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Inactive BOMs */}
        {inactiveBoms.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">INACTIVE</h2>
            {inactiveBoms.map((bom) => (
              <BomCard
                key={bom.id}
                bom={bom}
                label="INACTIVE"
                labelClass="secondary"
                onEdit={() => { setSelectedBom(bom); setEditBomOpen(true); }}
                onAddItem={() => setAddItemBomId(bom.id)}
                onRemoveItem={handleRemoveItem}
                onActivate={handleActivate}
                onDeactivate={null}
                onDelete={handleDelete}
                canEdit={PERMISSIONS.BOMS_UPDATE}
                canActivate={PERMISSIONS.BOMS_ACTIVATE}
                canDeactivate={false}
                canDelete={PERMISSIONS.BOMS_DELETE}
                isUpdating={activateMutation.isPending || deactivateMutation.isPending || deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create BOM Modal — lazily mounted; see hasOpenedCreate above */}
      {hasOpenedCreate && (
        <BomFormModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          productId={productId}
          onSave={handleCreate}
          savePending={createMutation.isPending}
        />
      )}

      {/* Edit BOM Modal */}
      {selectedBom && (
        <BomFormModal
          open={editBomOpen}
          onOpenChange={(v) => { setEditBomOpen(v); if (!v) setSelectedBom(null); }}
          productId={productId}
          bom={selectedBom}
          onSave={(payload) => handleEditBom(selectedBom.id, payload as UpdateBomPayload)}
          savePending={updateMutation.isPending}
        />
      )}

      {/* Add Item Dialog */}
      {addItemBomId && (
        <BomItemDialog
          open={!!addItemBomId}
          onOpenChange={(v) => { if (!v) setAddItemBomId(null); }}
          onSave={(item) => handleAddItem(addItemBomId, item)}
          pending={addItemMutation.isPending}
        />
      )}

      {/* Delete BOM confirmation */}
      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(v) => { if (!v) setPendingDeleteId(null); }}
        title="ลบ BOM"
        description="ลบ BOM นี้ (เฉพาะ Draft/Inactive)? การกระทำนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
