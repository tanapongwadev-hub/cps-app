"use client";

import * as React from "react";
import { Plus, RefreshCw, Building } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useOrganizations, useCreateOrganization, useUpdateOrganization,
  useDeactivateOrganization, useRestoreOrganization,
} from "@/features/organizations/hooks/use-organizations";
import { OrganizationFormDialog } from "@/features/organizations/components/organization-form-dialog";
import { OrganizationTable } from "@/features/organizations/components/organization-table";
import { OrganizationFilters } from "@/features/organizations/components/organization-filters";
import { OrganizationStatusDialog } from "@/features/organizations/components/organization-status-dialog";
import type { Organization, OrganizationPayload, UpdateOrganizationPayload } from "@/features/organizations/api/organizations-api";
import type { OrganizationFormValues } from "@/features/organizations/schemas/organization-schema";

export default function OrganizationsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Organization | null>(null);
  const [statusChange, setStatusChange] = React.useState<Organization | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useOrganizations({
    page, pageSize, search: debouncedSearch || undefined, isActive, sortBy: "code", sortOrder: "asc",
  });

  const createM = useCreateOrganization();
  const updateM = useUpdateOrganization();
  const deactivateM = useDeactivateOrganization();
  const restoreM = useRestoreOrganization();

  const handleSubmit = async (values: OrganizationFormValues) => {
    const payload = {
      code: values.code, nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      taxId: values.taxId?.trim() ? values.taxId.trim() : null,
      address: values.address?.trim() ? values.address.trim() : null,
      phone: values.phone?.trim() ? values.phone.trim() : null,
      email: values.email?.trim() ? values.email.trim() : null,
      website: values.website?.trim() ? values.website.trim() : null,
      logoUrl: values.logoUrl?.trim() ? values.logoUrl.trim() : null,
      parentId: values.parentId?.trim() ? values.parentId.trim() : null,
      type: values.type,
      isActive: values.isActive,
    };
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, data: { ...payload, updatedAt: editing.updatedAt } as UpdateOrganizationPayload });
    } else {
      await createM.mutateAsync(payload as OrganizationPayload);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusConfirm = async (o: Organization) => {
    if (o.isActive) await deactivateM.mutateAsync(o.id);
    else await restoreM.mutateAsync(o.id);
    setStatusChange(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการองค์กร"
          description="จัดการข้อมูลองค์กรและสาขา"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" }, { label: "ข้อมูลหลัก" }, { label: "องค์กร" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.ORGANIZATION_CREATE}>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />เพิ่มองค์กร
              </Button>
            </PermissionGuard>
          }
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />รีเฟรช
          </Button>
        </div>
        <OrganizationFilters value={{ search, isActive }} onChange={(v) => { setSearch(v.search); setIsActive(v.isActive); setPage(1); }} />
        <OrganizationTable
          organizations={data?.items ?? []} isLoading={isLoading}
          page={page} pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0} totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage} onPageSizeChange={setPageSize}
          onEdit={(o) => { setEditing(o); setFormOpen(true); }}
          onStatusChange={setStatusChange}
        />
      </PageContainer>
      <PageFooter />
      <OrganizationFormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        organization={editing} pending={createM.isPending || updateM.isPending} onSubmit={handleSubmit} />
      <OrganizationStatusDialog organization={statusChange} onOpenChange={(o) => !o && setStatusChange(null)}
        pending={deactivateM.isPending || restoreM.isPending} onConfirm={handleStatusConfirm} />
    </>
  );
}
