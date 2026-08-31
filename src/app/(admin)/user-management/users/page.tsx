"use client";

import * as React from "react";
import { Plus, Download, RefreshCw, Filter } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { ConfirmDeleteDialog, useConfirmDialog } from "@/components/forms/confirm-dialog";
import { SelectField, TextField } from "@/components/forms/form-field";
import { useDebounce } from "@/hooks/use-debounce";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { showToast } from "@/lib/toast";
import {
  useUsers,
  useDeleteUser,
  useUpdateUserStatus,
  useResetPassword,
} from "@/features/users/hooks/use-users";
import { useRevokeAllSessionsForUser } from "@/features/sessions/hooks/use-sessions";
import { useDepartments } from "@/features/departments/hooks/use-departments";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { UserDetailSheet } from "@/features/users/components/user-detail-sheet";
import { useUserColumns } from "@/features/users/components/use-user-columns";
import { PERMISSIONS } from "@/constants/permissions";
import type { User } from "@/features/auth/types";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";

export default function UsersPage() {
  const debounce = useDebounce;

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = debounce(search, 300);
  const [status, setStatus] = React.useState<string>("");
  const [departmentId, setDepartmentId] = React.useState<string>("");
  const [roleId, setRoleId] = React.useState<string>("");
  const [sorting, setSorting] = React.useState<Array<{ id: string; desc: boolean }>>([]);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [viewingUser, setViewingUser] = React.useState<User | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { data: deptData } = useDepartments();
  const { data: rolesData } = useRoles({ page: 1, pageSize: 100 });
  const deleteMutation = useDeleteUser();
  const statusMutation = useUpdateUserStatus();
  const resetMutation = useResetPassword();
  const revokeAllSessions = useRevokeAllSessionsForUser();
  const confirm = useConfirmDialog();

  const usersQuery = useUsers({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status || undefined,
    departmentId: departmentId || undefined,
    roleId: roleId || undefined,
    sortBy: sorting[0]?.id,
    sortOrder: sorting[0]?.desc ? "desc" : "asc",
  });

  const columns = useUserColumns({
    onView: setViewingUser,
    onEdit: (u) => {
      setEditingUser(u);
      setFormOpen(true);
    },
    onDelete: setDeleteId,
    statusMutation,
    resetMutation,
    revokeAllSessions,
    confirm,
  });

  return (
    <>
      <PageContainer>
        <PageHeader
          title="ผู้ใช้งาน"
          description="จัดการข้อมูลผู้ใช้งานในระบบ กำหนดสิทธิ์และแผนก"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "การจัดการผู้ใช้งาน" },
            { label: "ผู้ใช้งาน" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.USER_CREATE}>
              <Button
                onClick={() => {
                  setEditingUser(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                เพิ่มผู้ใช้งาน
              </Button>
            </PermissionGuard>
          }
          secondaryActions={
            <>
              <Button variant="outline" size="sm" onClick={() => usersQuery.refetch()}>
                <RefreshCw className="h-4 w-4" />
                <span className="hidden sm:inline">รีเฟรช</span>
              </Button>
              <PermissionGuard permission={PERMISSIONS.USER_EXPORT}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    showToast.info("กำลังส่งออกข้อมูล", "ระบบจะแจ้งเตือนเมื่อเสร็จสิ้น")
                  }
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">ส่งออก</span>
                </Button>
              </PermissionGuard>
            </>
          }
        />

        {/* Filter Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">ตัวกรอง</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              placeholder="ค้นหาชื่อ อีเมล หรือ username"
              aria-label="ค้นหาชื่อ อีเมล หรือ username"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <SelectField
              placeholder="ทุกสถานะ"
              value={status}
              onValueChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "ทุกสถานะ" },
                { value: "active", label: "ใช้งาน" },
                { value: "inactive", label: "ระงับการใช้งาน" },
              ]}
            />
            <SelectField
              placeholder="ทุกแผนก"
              value={departmentId}
              onValueChange={(v) => {
                setDepartmentId(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "ทุกแผนก" },
                ...(deptData?.items?.map((d) => ({
                  value: d.id,
                  label: d.nameTh || d.nameEn || d.code || d.id,
                })) ?? []),
              ]}
            />
            <SelectField
              placeholder="ทุกบทบาท"
              value={roleId}
              onValueChange={(v) => {
                setRoleId(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "ทุกบทบาท" },
                ...(rolesData?.items?.map((r) => ({
                  value: r.id,
                  label: r.nameTh || r.nameEn || r.name || r.code,
                })) ?? []),
              ]}
            />
          </div>
        </Card>

        <DataTable
          columns={columns}
          data={usersQuery.data?.items ?? []}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          onRetry={() => usersQuery.refetch()}
          // Real backend shape: { items, meta: { page, limit, totalItems, totalPages } }
          totalItems={usersQuery.data?.meta?.totalItems ?? 0}
          searchPlaceholder="ค้นหา..."
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          enableRowSelection
          enableColumnVisibility
          defaultHiddenColumns={["email", "telephone"]}
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={usersQuery.data?.meta?.totalPages ?? 1}
          onPaginationChange={({ pageIndex, pageSize: ps }) => {
            setPage(pageIndex + 1);
            setPageSize(ps);
          }}
          sorting={sorting as never}
          onSortingChange={(s) => setSorting(s as never)}
          manualPagination
          manualSorting
          emptyState={{
            title: "ไม่พบผู้ใช้งาน",
            description: "ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มผู้ใช้งานใหม่",
          }}
        />
      </PageContainer>

      <PageFooter />

      <UserFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingUser(null);
        }}
        user={editingUser}
      />

      {viewingUser && (
        <UserDetailSheet
          user={viewingUser}
          open={!!viewingUser}
          onOpenChange={(o) => !o && setViewingUser(null)}
        />
      )}

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        itemName="ผู้ใช้งาน"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deleteId) {
            try {
              await deleteMutation.mutateAsync(deleteId);
            } finally {
              setDeleteId(null);
            }
          }
        }}
        warning="ผู้ใช้งานจะถูกลบออกจากระบบ และอาจส่งผลต่อประวัติการใช้งาน"
      />

      {confirm.dialog}
    </>
  );
}
