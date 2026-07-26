"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, KeyRound, ShieldOff, ShieldCheck, Eye, Download, RefreshCw, Filter } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import { ConfirmDeleteDialog, useConfirmDialog } from "@/components/forms/confirm-dialog";
import { SelectField, TextField } from "@/components/forms/form-field";
import { useDebounce } from "@/hooks/use-debounce";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { showToast } from "@/lib/toast";
import { useUsers, useDeleteUser, useUpdateUserStatus, useResetPassword } from "@/features/users/hooks/use-users";
import { useDepartments } from "@/features/users/hooks/use-departments";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/constants/permissions";
import type { User } from "@/types/auth";
import { formatRelative } from "@/utils/date";
import { getInitials } from "@/utils/format";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";

const statusVariants = {
  active: "success" as const,
  inactive: "muted" as const,
  pending: "warning" as const,
  archived: "muted" as const,
};

const statusLabels: Record<string, string> = {
  active: "ใช้งาน",
  inactive: "ระงับ",
  pending: "รอเปิดใช้งาน",
  archived: "เก็บถาวร",
};

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const columns: ColumnDef<User>[] = React.useMemo(
    () => [
      {
        id: "user",
        header: "ผู้ใช้งาน",
        size: 260,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={u.avatarUrl} alt={u.fullName} />
                <AvatarFallback>{getInitials(u.firstName, u.lastName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setViewingUser(u);
                  }}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {u.fullName}
                </Link>
                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "email",
        header: "อีเมล",
        accessorKey: "email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        id: "department",
        header: "แผนก",
        cell: ({ row }) =>
          row.original.departmentName ? (
            <Badge variant="outline">{row.original.departmentName}</Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: "role",
        header: "บทบาท",
        cell: ({ row }) => {
          const roleNames = row.original.roleNames ?? [];
          return (
            <div className="flex flex-wrap gap-1">
              {roleNames.slice(0, 2).map((name) => (
                <Badge key={name} variant="secondary" className="text-[10px]">
                  {name}
                </Badge>
              ))}
              {roleNames.length > 2 && (
                <Badge variant="muted" className="text-[10px]">
                  +{roleNames.length - 2}
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "สถานะ",
        accessorKey: "status",
        cell: ({ row }) => (
          <Badge variant={statusVariants[row.original.status]}>
            {statusLabels[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
      {
        id: "lastLogin",
        header: "เข้าสู่ระบบล่าสุด",
        cell: ({ row }) =>
          row.original.lastLoginAt ? (
            <span className="text-xs text-muted-foreground">
              {formatRelative(row.original.lastLoginAt)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <ActionMenu
              label={`เมนู ${u.fullName}`}
              items={[
                {
                  label: "ดูรายละเอียด",
                  icon: <Eye className="h-3.5 w-3.5" />,
                  onClick: () => setViewingUser(u),
                },
                {
                  label: "แก้ไข",
                  icon: <Pencil className="h-3.5 w-3.5" />,
                  onClick: () => {
                    setEditingUser(u);
                    setFormOpen(true);
                  },
                  hidden: !(u.permissions ?? []).includes("*"), // no-op placeholder, real guard via component
                },
                {
                  label: u.status === "active" ? "ระงับการใช้งาน" : "เปิดใช้งาน",
                  icon:
                    u.status === "active" ? (
                      <ShieldOff className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ),
                  onClick: () => {
                    statusMutation.mutate({
                      id: u.id,
                      status: u.status === "active" ? "inactive" : "active",
                    });
                  },
                },
                {
                  label: "รีเซ็ตรหัสผ่าน",
                  icon: <KeyRound className="h-3.5 w-3.5" />,
                  onClick: () => {
                    confirm.open({
                      title: `รีเซ็ตรหัสผ่านของ ${u.fullName}?`,
                      description: "ระบบจะส่งรหัสผ่านใหม่ไปยังอีเมลของผู้ใช้งาน",
                      variant: "warning",
                      confirmText: "ยืนยันรีเซ็ต",
                      onConfirm: async () => {
                        await resetMutation.mutateAsync(u.id);
                      },
                    });
                  },
                },
                {
                  label: "ลบ",
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  variant: "danger",
                  onClick: () => setDeleteId(u.id),
                },
              ]}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusMutation, resetMutation],
  );

  const totalSelected = 0; // selection state managed inside DataTable

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
                  onClick={() => showToast.info("กำลังส่งออกข้อมูล", "ระบบจะแจ้งเตือนเมื่อเสร็จสิ้น")}
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
            <h3 className="text-sm font-medium">ตัวกรอง</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              placeholder="ค้นหาชื่อ อีเมล หรือ username"
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
                { value: "pending", label: "รอเปิดใช้งาน" },
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
                ...(deptData?.items?.map((d) => ({ value: d.id, label: d.name })) ?? []),
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
                ...(rolesData?.items?.map((r) => ({ value: r.id, label: r.name })) ?? []),
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
          defaultHiddenColumns={["email"]}
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

  void totalSelected;
  void searchParams;
  void router;
}

function UserDetailSheet({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{user.fullName}</SheetTitle>
              <SheetDescription>@{user.username}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Tabs defaultValue="info">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info">ข้อมูล</TabsTrigger>
              <TabsTrigger value="role">สิทธิ์</TabsTrigger>
              <TabsTrigger value="activity">กิจกรรม</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-3 text-sm">
              <DetailRow label="อีเมล" value={user.email} />
              <DetailRow label="เบอร์โทรศัพท์" value={user.phone ?? "-"} />
              <DetailRow label="แผนก" value={user.departmentName ?? "-"} />
              <DetailRow
                label="สถานะ"
                value={
                  <Badge variant={statusVariants[user.status]}>
                    {statusLabels[user.status]}
                  </Badge>
                }
              />
              <DetailRow label="ยืนยันอีเมล" value={user.emailVerified ? "✓ ยืนยันแล้ว" : "✗ ยังไม่ยืนยัน"} />
              <DetailRow label="ยืนยันเบอร์โทร" value={user.phoneVerified ? "✓ ยืนยันแล้ว" : "✗ ยังไม่ยืนยัน"} />
              <DetailRow label="เข้าสู่ระบบล่าสุด" value={user.lastLoginAt ? formatRelative(user.lastLoginAt) : "-"} />
              <DetailRow label="สร้างเมื่อ" value={formatRelative(user.createdAt)} />
            </TabsContent>

            <TabsContent value="role" className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-2">บทบาท</p>
                <div className="flex flex-wrap gap-1.5">
                  {(user.roleNames ?? []).map((name) => (
                    <Badge key={name} variant="default">{name}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">สิทธิ์ ({(user.permissions ?? []).length})</p>
                <div className="rounded-md border bg-muted/30 p-3 max-h-64 overflow-y-auto">
                  {(user.permissions ?? []).slice(0, 30).map((p) => (
                    <code key={p} className="block text-xs text-foreground/70 py-0.5">
                      {p}
                    </code>
                  ))}
                  {(user.permissions ?? []).length > 30 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      และอีก {(user.permissions ?? []).length - 30} สิทธิ์
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4 text-sm text-muted-foreground text-center py-8">
              <p>ไม่มีประวัติกิจกรรม</p>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-2 last:border-b-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
