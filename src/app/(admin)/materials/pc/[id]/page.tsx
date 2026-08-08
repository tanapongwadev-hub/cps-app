"use client";

/**
 * Materials — PC detail page (`/materials/pc/[id]`)
 * Displays material detail in a modal dialog
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Cpu, RefreshCw, Slash, X } from "lucide-react";
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

  const handleClose = React.useCallback(() => {
    router.push("/materials/pc");
  }, [router]);

  const handleBack = React.useCallback(() => {
    router.push("/materials/pc");
  }, [router]);

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

  return (
    <>
      {/* Detail Modal */}
      <Dialog open={!isLoading} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 [&>button]:hidden">
          {/* Custom header with back button */}
          <div className="flex items-center justify-between border-b px-6 py-4">
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
              <DialogTitle className="text-base font-semibold">
                รายละเอียดวัสดุ
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => detailQuery.refetch()}
                disabled={detailQuery.isFetching}
              >
                <RefreshCw
                  className={
                    detailQuery.isFetching ? "size-4 animate-spin" : "size-4"
                  }
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {isError && !isLoading ? (
              <Card className="border-danger/30 bg-danger/5">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <div className="bg-danger/10 text-danger flex size-12 items-center justify-center rounded-full">
                    <Slash className="size-5" />
                  </div>
                  <p className="font-semibold">โหลดข้อมูลวัสดุไม่สำเร็จ</p>
                  <p className="text-muted-foreground text-sm">
                    ไม่พบวัสดุรหัสนี้ หรือเซิร์ฟเวอร์มีปัญหา
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => detailQuery.refetch()}
                    >
                      ลองใหม่
                    </Button>
                    <Button asChild type="button" variant="ghost" size="sm">
                      <Link href="/materials/pc">
                        <Cpu className="size-4" />
                        กลับไปรายการ
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : isLoading || !material ? (
              <MaterialDetailCardSkeleton />
            ) : (
              <MaterialDetailCard
                material={material}
                onEdit={canEdit ? handleEdit : undefined}
                onStatusChange={canEdit ? handleStatusChange : undefined}
              />
            )}
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

      {!hasPermission(PERMISSIONS.MATERIAL_VIEW) && !isLoading && !isError && (
        <MaterialDetailEmpty message="คุณไม่มีสิทธิ์เข้าถึงข้อมูลวัสดุนี้" />
      )}
    </>
  );
}
