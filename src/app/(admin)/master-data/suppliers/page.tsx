"use client";

import * as React from "react";
import { Plus, RefreshCw, Truck } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeactivateSupplier,
  useRestoreSupplier,
} from "@/features/suppliers/hooks/use-suppliers";
import { SupplierFormDialog } from "@/features/suppliers/components/supplier-form-dialog";
import { SupplierTable } from "@/features/suppliers/components/supplier-table";
import { SupplierFilters } from "@/features/suppliers/components/supplier-filters";
import { SupplierStatusDialog } from "@/features/suppliers/components/supplier-status-dialog";
import type {
  Supplier,
  SupplierPayload,
  UpdateSupplierPayload,
} from "@/features/suppliers/api/suppliers-api";
import type { SupplierFormValues } from "@/features/suppliers/schemas/supplier-schema";

export default function SuppliersPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<"code" | "nameTh" | "isActive" | "createdAt" | "updatedAt">("code");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Supplier | null>(null);
  const [statusChange, setStatusChange] = React.useState<Supplier | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useSuppliers({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    isActive,
    sortBy,
    sortOrder,
  });

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const deactivateMutation = useDeactivateSupplier();
  const restoreMutation = useRestoreSupplier();

  const handleSubmit = async (values: SupplierFormValues) => {
    const payload = {
      code: values.code,
      nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      taxId: values.taxId?.trim() ? values.taxId.trim() : null,
      contactName: values.contactName?.trim() ? values.contactName.trim() : null,
      telephone: values.telephone?.trim() ? values.telephone.trim() : null,
      email: values.email?.trim() ? values.email.trim() : null,
      address: values.address?.trim() ? values.address.trim() : null,
      isActive: values.isActive,
    };
    if (editing) {
      const updatePayload: UpdateSupplierPayload = {
        ...payload,
        updatedAt: editing.updatedAt,
      };
      await updateMutation.mutateAsync({ id: editing.id, data: updatePayload });
    } else {
      await createMutation.mutateAsync(payload as SupplierPayload);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusConfirm = async (supplier: Supplier) => {
    if (supplier.isActive) {
      await deactivateMutation.mutateAsync(supplier.id);
    } else {
      await restoreMutation.mutateAsync(supplier.id);
    }
    setStatusChange(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการผู้จัดจำหน่าย"
          description="จัดการข้อมูลผู้จัดจำหน่ายที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ข้อมูลหลัก" },
            { label: "ผู้จัดจำหน่าย" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.SUPPLIER_CREATE}>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />
                เพิ่มผู้จัดจำหน่าย
              </Button>
            </PermissionGuard>
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </Button>
        </div>

        <SupplierFilters
          value={{ search, isActive }}
          onChange={(v) => {
            setSearch(v.search);
            setIsActive(v.isActive);
            setPage(1);
          }}
        />

        <SupplierTable
          suppliers={data?.items ?? []}
          isLoading={isLoading}
          page={page}
          pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0}
          totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onEdit={(s) => {
            setEditing(s);
            setFormOpen(true);
          }}
          onStatusChange={setStatusChange}
        />
      </PageContainer>

      <PageFooter />

      <SupplierFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        supplier={editing}
        pending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      />

      <SupplierStatusDialog
        supplier={statusChange}
        onOpenChange={(o) => !o && setStatusChange(null)}
        pending={deactivateMutation.isPending || restoreMutation.isPending}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
}
