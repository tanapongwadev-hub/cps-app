"use client";

/**
 * Materials — PC detail page (`/materials/pc/[id]`)
 *
 * Displays material detail in a modal overlay.
 * - Modal opens on page load
 * - Close button hides modal without navigation
 * - Back button navigates to list
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Cpu, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useDeactivateMaterial,
  useMaterial,
  useMaterialLookups,
  useRestoreMaterial,
  useUpdateMaterial,
  useUploadMaterialImage,
} from "@/features/materials/hooks/use-materials";
import {
  MaterialDetailCard,
  MaterialDetailCardSkeleton,
  MaterialDetailEmpty,
} from "@/features/materials/components/material-detail-card";
import { MaterialFormModal } from "@/features/materials/components/material-form-modal";
import { MaterialStatusDialog } from "@/features/materials/components/material-status-dialog";
import type {
  MaterialPayload,
  UpdateMaterialPayload,
} from "@/features/materials/api/materials-api";

export default function MaterialPCDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";

  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PERMISSIONS.MATERIAL_UPDATE);

  const detailQuery = useMaterial(id);
  const lookupsQuery = useMaterialLookups();
  const updateMutation = useUpdateMaterial();
  const deactivateMutation = useDeactivateMaterial();
  const restoreMutation = useRestoreMaterial();
  const uploadMutation = useUploadMaterialImage();

  const [detailOpen, setDetailOpen] = React.useState(true);
  const [editOpen, setEditOpen] = React.useState(false);
  const [statusChangeOpen, setStatusChangeOpen] = React.useState(false);

  const material = detailQuery.data ?? null;
  const lookups = lookupsQuery.data ?? {
    units: [],
    suppliers: [],
    models: [],
    deliveryTypes: [],
    loadingPoints: [],
  };

  const isError = detailQuery.isError;
  const isLoading = detailQuery.isLoading;
  const isFetching = detailQuery.isFetching;

  // Navigate back to list
  const handleBack = React.useCallback(() => {
    router.back();
  }, [router]);

  // Close modal and navigate back
  const handleClose = React.useCallback(() => {
    setDetailOpen(false);
    // Small delay to allow modal animation before navigation
    setTimeout(() => {
      router.back();
    }, 150);
  }, [router]);

  // Toggle edit modal
  const handleEdit = React.useCallback(() => setEditOpen(true), []);
  const handleStatusChange = React.useCallback(
    () => setStatusChangeOpen(true),
    [],
  );

  const handleSave = React.useCallback(
    async (payload: MaterialPayload | UpdateMaterialPayload) => {
      if (!material) return;
      if ("updatedAt" in payload) {
        await updateMutation.mutateAsync({ id: material.id, data: payload });
      }
    },
    [material, updateMutation],
  );

  const handleUploadImage = React.useCallback(
    (file: File) => uploadMutation.mutateAsync(file),
    [uploadMutation],
  );

  const handleConfirmStatusChange = React.useCallback(async () => {
    if (!material) return;
    if (material.isActive) {
      await deactivateMutation.mutateAsync(material.id);
    } else {
      await restoreMutation.mutateAsync(material.id);
    }
    setStatusChangeOpen(false);
  }, [deactivateMutation, material, restoreMutation]);

  // Determine what content to show
  const showSkeleton = isLoading && !material;
  const showDetail = !isLoading && material !== null && !isError;
  const showError = isError && !isLoading && material === null;
  const showPermissionError = !hasPermission(PERMISSIONS.MATERIAL_VIEW) && !isLoading && !isError && material === null;

  return (
    <>
      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent
          className="max-w-5xl max-h-[92vh] overflow-hidden p-0"
          hideClose={true}
          onPointerDownOutside={(e) => {
            // Prevent close on backdrop click - user must use buttons
            e.preventDefault();
          }}
        >
          {/* Custom Header */}
          <div className="flex items-center justify-between border-b bg-card px-6 py-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="h-8 gap-1.5"
              >
                <ArrowLeft className="size-4" />
                กลับ
              </Button>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                  <Cpu className="size-4" />
                </div>
                <DialogTitle className="text-base font-semibold">
                  รายละเอียดอะไหล่ PC
                </DialogTitle>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => detailQuery.refetch()}
                disabled={isFetching}
                className="h-8 w-8 p-0"
                aria-label="รีเฟรชข้อมูล"
              >
                <RefreshCw
                  className={isFetching ? "size-4 animate-spin" : "size-4"}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
                aria-label="ปิด"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(92vh-65px)] overflow-y-auto p-6">
            {showSkeleton && <MaterialDetailCardSkeleton />}
            {showDetail && (
              <MaterialDetailCard
                material={material}
                onEdit={canEdit ? handleEdit : undefined}
                onStatusChange={canEdit ? handleStatusChange : undefined}
              />
            )}
            {showError && (
              <Card className="border-danger/30 bg-danger/5">
                <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="bg-danger/10 text-danger flex size-14 items-center justify-center rounded-xl">
                    <X className="size-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-danger">โหลดข้อมูลวัสดุไม่สำเร็จ</p>
                    <p className="text-muted-foreground mt-1">
                      ไม่พบวัสดุรหัสนี้ หรือเซิร์ฟเวอร์มีปัญหา
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => detailQuery.refetch()}
                    >
                      ลองใหม่
                    </Button>
                    <Button asChild type="button" variant="ghost">
                      <Link href="/materials/pc">
                        <Cpu className="size-4" />
                        กลับไปรายการ
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {showPermissionError && <MaterialDetailEmpty message="คุณไม่มีสิทธิ์เข้าถึงข้อมูลวัสดุนี้" />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      {material && (
        <MaterialFormModal
          open={editOpen}
          onOpenChange={setEditOpen}
          material={material}
          lookups={lookups}
          onSave={handleSave}
          onUploadImage={handleUploadImage}
          savePending={updateMutation.isPending}
          uploadPending={uploadMutation.isPending}
        />
      )}

      {/* Status Dialog */}
      {material && (
        <MaterialStatusDialog
          open={statusChangeOpen}
          material={material}
          action={material.isActive ? "deactivate" : "restore"}
          onOpenChange={setStatusChangeOpen}
          onConfirm={handleConfirmStatusChange}
          pending={deactivateMutation.isPending || restoreMutation.isPending}
        />
      )}
    </>
  );
}
