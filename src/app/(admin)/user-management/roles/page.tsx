"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Copy, Shield, Users, Search, Eye } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { TextField } from "@/components/forms/form-field";
import { useDebounce } from "@/hooks/use-debounce";
import { usePermission } from "@/hooks/use-permission";
import {
  useRoles,
  useDeleteRole,
  useCloneRole,
} from "@/features/roles/hooks/use-roles";
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog";
import { RoleDetailDialog } from "@/features/roles/components/role-detail-dialog";
import { PERMISSIONS } from "@/constants/permissions";
import { showToast } from "@/lib/toast";
import type { Role } from "@/types/auth";
import { formatDate } from "@/utils/date";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";

export default function RolesPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [status, setStatus] = React.useState<string>("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Role | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);

  const { isSuperAdmin } = usePermission();

  const rolesQuery = useRoles({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status || undefined,
  });
  const deleteMutation = useDeleteRole();
  const cloneMutation = useCloneRole();

  const columns: ColumnDef<Role>[] = React.useMemo(
    () => [
      {
        id: "role",
        header: "Role",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.nameTh ?? r.nameEn ?? r.name}</p>
                <p className="text-xs text-muted-foreground truncate">{r.code}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "description",
        header: "คำอธิบาย",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1">
            {row.original.description || "-"}
          </span>
        ),
      },
      {
        id: "permissions",
        header: "สิทธิ์",
        cell: ({ row }) => (
          <Badge variant="muted">
            {row.original.permissionCount ?? (row.original.permissions ?? []).length} สิทธิ์
          </Badge>
        ),
      },
      {
        id: "users",
        header: "ผู้ใช้งาน",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium tabular-nums">{row.original.userCount ?? 0}</span>
          </div>
        ),
      },
      {
        id: "type",
        header: "ประเภท",
        cell: ({ row }) =>
          row.original.isSystem ? (
            <Badge variant="info">System</Badge>
          ) : (
            <Badge variant="outline">Custom</Badge>
          ),
      },
      {
        id: "status",
        header: "สถานะ",
        cell: ({ row }) => (
          <Badge
            variant={
              (row.original.isActive ?? row.original.status === "active") ? "success" : "muted"
            }
          >
            {(row.original.isActive ?? row.original.status === "active") ? "ใช้งาน" : "ระงับ"}
          </Badge>
        ),
      },
      {
        id: "updated",
        header: "อัพเดท",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.updatedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <ActionMenu
              label={`เมนู ${r.name}`}
              items={[
                {
                  label: "ดูรายละเอียด",
                  icon: Eye,
                  onClick: () => setViewingId(r.id),
                },
                {
                  label: "แก้ไข",
                  icon: Pencil,
                  onClick: () => {
                    setEditing(r);
                    setFormOpen(true);
                  },
                },
                {
                  label: "คัดลอก",
                  icon: Copy,
                  onClick: () => cloneMutation.mutate(r.id),
                  disabled: cloneMutation.isPending,
                },
                {
                  label: "ลบ",
                  icon: Trash2,
                  variant: "danger",
                  onClick: () => setDeletingId(r.id),
                  hidden: r.isSystem && !isSuperAdmin(),
                },
              ]}
            />
          );
        },
      },
    ],
    [cloneMutation, isSuperAdmin],
  );

  return (
    <>
      <PageContainer>
        <PageHeader
          title="บทบาท (Roles)"
          description="จัดการบทบาทและสิทธิ์การใช้งานในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "การจัดการผู้ใช้งาน" },
            { label: "บทบาท" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.ROLE_CREATE}>
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                เพิ่ม Role
              </Button>
            </PermissionGuard>
          }
        />

        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <TextField
                placeholder="ค้นหา Role..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant={status === "" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("")}
              >
                ทั้งหมด
              </Button>
              <Button
                variant={status === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("active")}
              >
                ใช้งาน
              </Button>
              <Button
                variant={status === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("inactive")}
              >
                ระงับ
              </Button>
            </div>
          </div>
        </Card>

        <DataTable
          columns={columns}
          data={rolesQuery.data?.items ?? []}
          isLoading={rolesQuery.isLoading}
          isError={rolesQuery.isError}
          onRetry={() => rolesQuery.refetch()}
          // Real backend shape: { items, meta: { page, limit, totalItems, totalPages } }
          totalItems={rolesQuery.data?.meta?.totalItems ?? 0}
          globalSearch={false}
          enableColumnVisibility
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={rolesQuery.data?.meta?.totalPages ?? 1}
          onPaginationChange={({ pageIndex, pageSize: ps }) => {
            setPage(pageIndex + 1);
            setPageSize(ps);
          }}
          manualPagination
          emptyState={{
            title: "ไม่พบ Role",
            description: "ลองเปลี่ยนเงื่อนไขการค้นหาหรือสร้าง Role ใหม่",
          }}
        />
      </PageContainer>

      <PageFooter />

      <RoleFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        role={editing}
      />

      <RoleDetailDialog
        roleId={viewingId}
        onOpenChange={(o) => !o && setViewingId(null)}
      />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        itemName="Role"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingId) {
            await deleteMutation.mutateAsync(deletingId);
            setDeletingId(null);
          }
        }}
        warning="ผู้ใช้งานที่มี Role นี้จะสูญเสียสิทธิ์ทั้งหมด"
      />
    </>
  );

  void showToast;
}
