"use client";

import * as React from "react";
import { Plus, RefreshCw, Ruler } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { showToast } from "@/lib/toast";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeactivateUnit,
  useRestoreUnit,
} from "@/features/units/hooks/use-units";
import { UnitFormDialog } from "@/features/units/components/unit-form-dialog";
import { UnitTable } from "@/features/units/components/unit-table";
import { UnitFilters } from "@/features/units/components/unit-filters";
import { UnitStatusDialog } from "@/features/units/components/unit-status-dialog";
import type { Unit, UnitPayload, UpdateUnitPayload } from "@/features/units/api/units-api";
import type { UnitFormValues } from "@/features/units/schemas/unit-schema";

export default function UnitsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<"code" | "nameTh" | "isActive" | "createdAt" | "updatedAt">("code");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<Unit | null>(null);
  const [statusChangeUnit, setStatusChangeUnit] = React.useState<Unit | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useUnits({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deactivateMutation = useDeactivateUnit();
  const restoreMutation = useRestoreUnit();

  const handleSubmit = async (values: UnitFormValues) => {
    const payload = {
      code: values.code,
      nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      symbol: values.symbol?.trim() ? values.symbol.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
      isActive: values.isActive,
    };
    if (editingUnit) {
      const updatePayload: UpdateUnitPayload = {
        ...payload,
        updatedAt: editingUnit.updatedAt,
      };
      await updateMutation.mutateAsync({ id: editingUnit.id, data: updatePayload });
    } else {
      await createMutation.mutateAsync(payload as UnitPayload);
    }
    setFormOpen(false);
    setEditingUnit(null);
  };

  const handleStatusConfirm = async (unit: Unit) => {
    if (unit.isActive) {
      await deactivateMutation.mutateAsync(unit.id);
    } else {
      await restoreMutation.mutateAsync(unit.id);
    }
    setStatusChangeUnit(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการหน่วยนับ"
          description="จัดการข้อมูลหน่วยนับที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "หน่วยนับ" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.UNIT_CREATE}>
              <Button onClick={() => { setEditingUnit(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />
                เพิ่มหน่วยนับ
              </Button>
            </PermissionGuard>
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ruler className="h-4 w-4" />
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

        <UnitFilters
          value={{ search, isActive }}
          onChange={(v) => {
            setSearch(v.search);
            setIsActive(v.isActive);
            setPage(1);
          }}
        />

        <UnitTable
          units={data?.items ?? []}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0}
          totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(unit) => {
            setEditingUnit(unit);
            setFormOpen(true);
          }}
          onStatusChange={setStatusChangeUnit}
          canEdit
          canDelete
          canRestore
        />
      </PageContainer>

      <PageFooter />

      <UnitFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingUnit(null);
        }}
        unit={editingUnit}
        pending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <UnitStatusDialog
        unit={statusChangeUnit}
        onOpenChange={(o) => !o && setStatusChangeUnit(null)}
        pending={deactivateMutation.isPending || restoreMutation.isPending}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
