"use client";

/**
 * Materials — PC detail page (`/materials/pc/[id]`)
 *
 * แสดงรายละเอียดของวัสดุ 1 รายการ ผ่าน `MaterialDetailCard`
 * ใช้ hooks `useMaterial`, `useMaterialLookups` และ
 * `useDeactivateMaterial` / `useRestoreMaterial` เดิมจาก `@/features/materials/hooks`
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Cpu, RefreshCw, Slash } from "lucide-react";
import {
  PageContainer,
  PageFooter,
  PageHeader,
} from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
      <PageContainer>
        <PageHeader
          title={material?.name ?? "รายละเอียดวัสดุ"}
          description={
            material
              ? `${material.code} · ${material.model?.nameTh ?? "ไม่ระบุรุ่น"}`
              : "Material Master — อะไหล่ PC"
          }
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "จัดการอะไหล่", href: "/materials" },
            { label: "อะไหล่ PC", href: "/materials/pc" },
            { label: material?.code ?? "รายละเอียด" },
          ]}
          primaryAction={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => detailQuery.refetch()}
                disabled={detailQuery.isFetching}
                aria-label="รีเฟรชข้อมูลวัสดุ"
              >
                <RefreshCw
                  className={
                    detailQuery.isFetching ? "size-4 animate-spin" : "size-4"
                  }
                />
                <span className="hidden sm:inline">รีเฟรช</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBack}
                aria-label="กลับไปหน้ารายการอะไหล่ PC"
              >
                <ArrowLeft className="size-4" />
                <span className="hidden sm:inline">กลับ</span>
              </Button>
            </div>
          }
        />

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
                    กลับไปรายการอะไหล่ PC
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
      </PageContainer>

      <PageFooter />

      {material && (
        <>
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

          <MaterialStatusDialog
            open={statusChangeOpen}
            material={material}
            action={material.isActive ? "deactivate" : "restore"}
            onOpenChange={setStatusChangeOpen}
            onConfirm={handleConfirmStatusChange}
            pending={deactivateMutation.isPending || restoreMutation.isPending}
          />
        </>
      )}

      {/* Floating action bar — fixed bottom on mobile, pill bottom-right on desktop.
          Keeps the card clean while staying one tap away. */}
      {material && canEdit && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center md:justify-end md:pr-6"
          aria-hidden="false"
        >
          <div
            data-testid="material-detail-floating-actions"
            className="bg-card/90 border-border/60 pointer-events-auto m-3 flex items-center gap-1.5 rounded-full border p-1.5 shadow-lg backdrop-blur md:m-0 md:mb-6"
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="rounded-full"
            >
              แก้ไข
            </Button>
            <Button
              type="button"
              variant={material.isActive ? "danger" : "success"}
              size="sm"
              onClick={handleStatusChange}
              className="rounded-full"
            >
              {material.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
            </Button>
          </div>
        </div>
      )}

      {!hasPermission(PERMISSIONS.MATERIAL_VIEW) && !isLoading && !isError && (
        <MaterialDetailEmpty message="คุณไม่มีสิทธิ์เข้าถึงข้อมูลวัสดุนี้" />
      )}
    </>
  );
}
