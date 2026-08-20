"use client";

import * as React from "react";
import { Plus, RefreshCw, FolderTree } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { PERMISSIONS } from "@/constants/permissions";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useCategories, useCreateCategory, useUpdateCategory,
  useDeactivateCategory, useRestoreCategory,
} from "@/features/categories/hooks/use-categories";
import { CategoryFormDialog } from "@/features/categories/components/category-form-dialog";
import { CategoryTable } from "@/features/categories/components/category-table";
import { CategoryFilters } from "@/features/categories/components/category-filters";
import { CategoryStatusDialog } from "@/features/categories/components/category-status-dialog";
import type { Category, CategoryPayload, UpdateCategoryPayload } from "@/features/categories/api/categories-api";
import type { CategoryFormValues } from "@/features/categories/schemas/category-schema";

export default function CategoriesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [isActive, setIsActive] = React.useState<boolean | undefined>(undefined);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [statusChange, setStatusChange] = React.useState<Category | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useCategories({
    page, pageSize, search: debouncedSearch || undefined, isActive, sortBy: "sortOrder", sortOrder: "asc",
  });

  const createM = useCreateCategory();
  const updateM = useUpdateCategory();
  const deactivateM = useDeactivateCategory();
  const restoreM = useRestoreCategory();

  const handleSubmit = async (values: CategoryFormValues) => {
    const payload = {
      code: values.code, nameTh: values.nameTh,
      nameEn: values.nameEn?.trim() ? values.nameEn.trim() : null,
      parentId: values.parentId?.trim() ? values.parentId.trim() : null,
      sortOrder: values.sortOrder,
      iconColor: values.iconColor?.trim() ? values.iconColor.trim() : null,
      description: values.description?.trim() ? values.description.trim() : null,
      isActive: values.isActive,
    };
    if (editing) {
      await updateM.mutateAsync({ id: editing.id, data: { ...payload, updatedAt: editing.updatedAt } as UpdateCategoryPayload });
    } else {
      await createM.mutateAsync(payload as CategoryPayload);
    }
    setFormOpen(false);
    setEditing(null);
  };

  const handleStatusConfirm = async (c: Category) => {
    if (c.isActive) await deactivateM.mutateAsync(c.id);
    else await restoreM.mutateAsync(c.id);
    setStatusChange(null);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการหมวดหมู่"
          description="จัดการข้อมูลหมวดหมู่ที่ใช้ในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" }, { label: "ข้อมูลหลัก" }, { label: "หมวดหมู่" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.CATEGORY_CREATE}>
              <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
                <Plus className="h-4 w-4" />เพิ่มหมวดหมู่
              </Button>
            </PermissionGuard>
          }
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderTree className="h-4 w-4" />ทั้งหมด {data?.meta.totalItems ?? 0} รายการ
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className="h-4 w-4" />รีเฟรช
          </Button>
        </div>
        <CategoryFilters value={{ search, isActive }} onChange={(v) => { setSearch(v.search); setIsActive(v.isActive); setPage(1); }} />
        <CategoryTable
          categories={data?.items ?? []} isLoading={isLoading}
          page={page} pageSize={pageSize}
          totalItems={data?.meta.totalItems ?? 0} totalPages={data?.meta.totalPages ?? 0}
          onPageChange={setPage} onPageSizeChange={setPageSize}
          onEdit={(c) => { setEditing(c); setFormOpen(true); }}
          onStatusChange={setStatusChange}
        />
      </PageContainer>
      <PageFooter />
      <CategoryFormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}
        category={editing} pending={createM.isPending || updateM.isPending} onSubmit={handleSubmit} />
      <CategoryStatusDialog category={statusChange} onOpenChange={(o) => !o && setStatusChange(null)}
        pending={deactivateM.isPending || restoreM.isPending} onConfirm={handleStatusConfirm} />
    </>
  );
}
