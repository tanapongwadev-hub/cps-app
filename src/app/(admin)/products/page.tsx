"use client";

/**
 * Products — ชิ้นส่วนยานยนต์ page
 *
 * Features:
 * - Modern header with stats
 * - Filter by search, category, product type, active status
 * - Card grid / table toggle
 * - CRUD actions (create, edit, deactivate, restore)
 * - Link to BOM management per product
 */

import * as React from "react";
import {
  Car,
  Package,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { PERMISSIONS } from "@/constants/permissions";
import {
  useProducts,
  useProductLookups,
  useUploadProductImage,
  useCreateProduct,
  useUpdateProduct,
  useDeactivateProduct,
  useRestoreProduct,
} from "@/features/products/hooks/use-products";
import { ProductCardGrid } from "@/features/products/components/product-card-grid";
import { ProductTable } from "@/features/products/components/product-table";
import { ProductFilters } from "@/features/products/components/product-filters";
import { ProductFormModal } from "@/features/products/components/product-form-modal";
import { ProductStatusDialog } from "@/features/products/components/product-status-dialog";
import type {
  ListProductsParams,
  Product,
  ProductPayload,
  UpdateProductPayload,
} from "@/features/products/api/products-api";
import { useRouter } from "next/navigation";

type SortBy = NonNullable<ListProductsParams["sortBy"]>;
type SortOrder = NonNullable<ListProductsParams["sortOrder"]>;

const PRODUCT_PAGE_SIZE = 10;

export default function ProductsPage() {
  const router = useRouter();
  const [filters, setFilters] = React.useState<ListProductsParams>({
    page: 1,
    pageSize: PRODUCT_PAGE_SIZE,
  });
  const [viewMode, setViewMode] = React.useState<ViewMode>("card");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [statusChange, setStatusChange] = React.useState<{
    product: Product;
    action: "deactivate" | "restore";
  } | null>(null);

  const lookupsQuery = useProductLookups();
  const listQuery = useProducts(filters);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deactivateMutation = useDeactivateProduct();
  const restoreMutation = useRestoreProduct();
  const uploadImageMutation = useUploadProductImage();

  const items = listQuery.data?.items ?? [];
  const totalItems = listQuery.data?.meta?.totalItems ?? 0;
  const activeItems = items.filter((p) => p.isActive).length;
  const lookups = lookupsQuery.data ?? {
    units: [],
    productModels: [],
    customers: [],
    locations: [],
    productTypes: [],
    deliveryTypes: [],
    loadingPoints: [],
    processLines: [],
  };

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

  const handleEdit = React.useCallback((product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  }, []);

  const handleStatusChange = React.useCallback((product: Product) => {
    setStatusChange({
      product,
      action: product.isActive ? "deactivate" : "restore",
    });
  }, []);

  const handleGoToBom = React.useCallback((product: Product) => {
    router.push(`/products/${product.id}/bom`);
  }, [router]);

  const handleCreate = React.useCallback(() => {
    setEditingProduct(null);
    setFormOpen(true);
  }, []);

  const handleFormOpenChange = React.useCallback((open: boolean) => {
    setFormOpen(open);
    if (!open) setEditingProduct(null);
  }, []);

  const handleSave = React.useCallback(
    async (payload: ProductPayload | UpdateProductPayload) => {
      try {
        if ("updatedAt" in payload) {
          const editing = editingProduct;
          if (!editing) return;
          await updateMutation.mutateAsync({ id: editing.id, data: payload });
        } else {
          await createMutation.mutateAsync(payload as ProductPayload);
        }
        setFormOpen(false);
        setEditingProduct(null);
      } catch {
        // Error handled by mutation
      }
    },
    [createMutation, editingProduct, updateMutation],
  );

  const handleUploadImage = React.useCallback(
    (file: File) => uploadImageMutation.mutateAsync(file),
    [uploadImageMutation],
  );

  const handleConfirmStatusChange = React.useCallback(async () => {
    if (!statusChange) return;
    if (statusChange.action === "deactivate") {
      await deactivateMutation.mutateAsync(statusChange.product.id);
    } else {
      await restoreMutation.mutateAsync(statusChange.product.id);
    }
    setStatusChange(null);
  }, [deactivateMutation, restoreMutation, statusChange]);

  const lookupsLoading = lookupsQuery.isLoading;
  const lookupsError = lookupsQuery.error as Error | null;
  const canSave = !lookupsLoading && !lookupsError;

  return (
    <>
      <PageContainer>
        {/* Header */}
        <PageHeader
          title="ชิ้นส่วนยานยนต์"
          description="Product Master — สินค้าสำเร็จรูปและชิ้นส่วนยานยนต์"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ชิ้นส่วนยานยนต์" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.PRODUCTS_CREATE}>
              <Button
                onClick={handleCreate}
                disabled={!canSave}
                className="gap-2"
              >
                <Plus className="size-4" />
                เพิ่มสินค้า
              </Button>
            </PermissionGuard>
          }
          secondaryActions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => listQuery.refetch()}
                disabled={listQuery.isFetching}
              >
                <RefreshCw
                  className={listQuery.isFetching ? "size-4 animate-spin" : "size-4"}
                />
                <span className="hidden sm:inline">รีเฟรช</span>
              </Button>
            </>
          }
        />

        {/* Stats Row */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Package className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">ทั้งหมด</p>
                <p className="text-2xl font-semibold">{totalItems}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-success/10 text-success flex size-10 items-center justify-center rounded-lg">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">กำลังใช้งาน</p>
                <p className="text-2xl font-semibold">{activeItems}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
                <Car className="size-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">ประเภทสินค้า</p>
                <p className="text-2xl font-semibold">
                  {lookups.productTypes.length > 0 ? lookups.productTypes.length : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <ProductFilters
          value={filters}
          lookups={lookups}
          onChange={setFilters}
        />

        {/* View Toggle & Count */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Car className="size-4" />
            <span>
              แสดง {items.length} รายการ {totalItems > 0 && `จาก ${totalItems}`}
            </span>
          </div>
          <ViewToggle
            value={viewMode}
            onValueChange={setViewMode}
            storageKey="products:view-mode"
          />
        </div>

        {/* Content */}
        <div className="mt-4">
          {viewMode === "card" ? (
            <ProductCardGrid
              products={items}
              page={filters.page ?? 1}
              pageSize={filters.pageSize ?? PRODUCT_PAGE_SIZE}
              totalItems={totalItems}
              isLoading={listQuery.isLoading || lookupsLoading}
              isError={listQuery.isError}
              onRetry={() => listQuery.refetch()}
              onCreate={canSave ? handleCreate : undefined}
              onEdit={canSave ? handleEdit : undefined}
              onStatusChange={canSave ? handleStatusChange : undefined}
              onGoToBom={handleGoToBom}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          ) : (
            <ProductTable
              products={items}
              page={filters.page ?? 1}
              pageSize={filters.pageSize ?? PRODUCT_PAGE_SIZE}
              totalItems={totalItems}
              sortBy={filters.sortBy}
              sortOrder={filters.sortOrder}
              isLoading={listQuery.isLoading || lookupsLoading}
              isError={listQuery.isError}
              onRetry={() => listQuery.refetch()}
              onCreate={canSave ? handleCreate : undefined}
              onEdit={canSave ? handleEdit : undefined}
              onStatusChange={canSave ? handleStatusChange : undefined}
              onGoToBom={handleGoToBom}
              onSortChange={handleSortChange}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </div>
      </PageContainer>

      <PageFooter />

      {/* Form Modal */}
      <ProductFormModal
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        product={editingProduct}
        lookups={lookups}
        onUploadImage={handleUploadImage}
        onSave={handleSave}
        savePending={createMutation.isPending || updateMutation.isPending}
        uploadPending={uploadImageMutation.isPending}
      />

      {/* Status Dialog */}
      <ProductStatusDialog
        open={!!statusChange}
        product={statusChange?.product ?? null}
        action={statusChange?.action ?? "deactivate"}
        onOpenChange={(open) => {
          if (!open) setStatusChange(null);
        }}
        onConfirm={handleConfirmStatusChange}
        pending={deactivateMutation.isPending || restoreMutation.isPending}
      />
    </>
  );
}
