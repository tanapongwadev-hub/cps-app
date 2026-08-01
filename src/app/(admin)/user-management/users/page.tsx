"use client";

import * as React from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  ShieldOff,
  ShieldCheck,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Building2,
  ShieldCheck as ShieldIcon,
} from "lucide-react";
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
import {
  useUsers,
  useDeleteUser,
  useUpdateUserStatus,
  useResetPassword,
  useUserAssignments,
} from "@/features/users/hooks/use-users";
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
import { cn } from "@/utils/cn";

/**
 * Map the real backend `isActive` boolean to a derived UI status.
 * (The legacy `status` field is no longer in the backend response — we
 *  compute it here so the table can keep its badge column.)
 */
function toUiStatus(u: User): "active" | "inactive" {
  return u.isActive ? "active" : "inactive";
}

const statusVariants: Record<"active" | "inactive", "success" | "muted"> = {
  active: "success",
  inactive: "muted",
};

const statusLabels: Record<"active" | "inactive", string> = {
  active: "ใช้งาน",
  inactive: "ระงับ",
};

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
          const fullName = `${u.firstName} ${u.lastName}`.trim();
          return (
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarImage src={u.avatarUrl} alt={fullName} />
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
                  {fullName || u.username}
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
        id: "telephone",
        header: "เบอร์โทร",
        cell: ({ row }) =>
          row.original.telephone ? (
            <span className="text-sm tabular-nums">{row.original.telephone}</span>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          ),
      },
      {
        id: "status",
        header: "สถานะ",
        cell: ({ row }) => {
          const s = toUiStatus(row.original);
          return (
            <div className="flex items-center gap-1">
              <Badge variant={statusVariants[s]}>{statusLabels[s]}</Badge>
              {row.original.isLocked && (
                <Badge variant="warning" className="text-[10px]">ล็อก</Badge>
              )}
            </div>
          );
        },
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
          const uiStatus = toUiStatus(u);
          return (
            <ActionMenu
              label={`เมนู ${u.firstName} ${u.lastName}`}
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
                },
                {
                  label: uiStatus === "active" ? "ระงับการใช้งาน" : "เปิดใช้งาน",
                  icon:
                    uiStatus === "active" ? (
                      <ShieldOff className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    ),
                  onClick: () => {
                    // Real backend uses {isActive: boolean} — send the opposite
                    // of the current status.
                    statusMutation.mutate({
                      id: u.id,
                      isActive: uiStatus !== "active",
                    });
                  },
                },
                {
                  label: "รีเซ็ตรหัสผ่าน",
                  icon: <KeyRound className="h-3.5 w-3.5" />,
                  onClick: () => {
                    confirm.open({
                      title: `รีเซ็ตรหัสผ่านของ ${u.firstName} ${u.lastName}?`,
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

function UserDetailSheet({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.username;
  const uiStatus = toUiStatus(user);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg" className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={user.avatarUrl} alt={fullName} />
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle>{fullName}</SheetTitle>
              <SheetDescription>@{user.username}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <Tabs defaultValue="info">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="info">ข้อมูล</TabsTrigger>
              <TabsTrigger value="assignments">แผนก & บทบาท</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4 space-y-3 text-sm">
              <DetailRow label="ชื่อ-นามสกุล" value={fullName} />
              <DetailRow label="Username" value={`@${user.username}`} />
              <DetailRow label="อีเมล" value={user.email} />
              <DetailRow label="เบอร์โทรศัพท์" value={user.telephone ?? "-"} />
              <DetailRow
                label="สถานะ"
                value={
                  <div className="flex items-center gap-1">
                    <Badge variant={statusVariants[uiStatus]}>{statusLabels[uiStatus]}</Badge>
                    {user.isLocked && <Badge variant="warning">ล็อก</Badge>}
                  </div>
                }
              />
              <DetailRow
                label="login attempts"
                value={
                  <span className="tabular-nums">
                    {user.failedLoginAttempts ?? 0}
                    {user.lockedUntil && ` (until ${formatRelative(user.lockedUntil)})`}
                  </span>
                }
              />
              <DetailRow
                label="permissionVersion"
                value={<span className="tabular-nums">{user.permissionVersion ?? "-"}</span>}
              />
              <DetailRow
                label="เข้าสู่ระบบล่าสุด"
                value={user.lastLoginAt ? formatRelative(user.lastLoginAt) : "-"}
              />
              <DetailRow
                label="IP ล่าสุด"
                value={user.lastLoginIp ?? "-"}
              />
              <DetailRow label="สร้างเมื่อ" value={formatRelative(user.createdAt)} />
            </TabsContent>

            <TabsContent value="assignments" className="mt-4 text-sm">
              <UserAssignmentsList userId={user.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UserAssignmentsList({ userId }: { userId: string }) {
  const { data, isLoading } = useUserAssignments(userId);
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        ผู้ใช้นี้ยังไม่มี assignment (แผนก + บทบาท)
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {data.map((a) => (
        <div
          key={a.id}
          className={cn(
            "flex items-center justify-between gap-3 rounded-md border bg-card p-3",
            !a.isActive && "opacity-60",
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="truncate text-sm font-medium">
                {a.department?.nameTh ?? a.department?.name ?? a.departmentId}
              </p>
              <span className="text-xs text-muted-foreground">·</span>
              <ShieldIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="truncate text-sm">
                {a.role?.nameTh ?? a.role?.nameEn ?? a.role?.name ?? a.roleId}
              </p>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              assigned {a.assignedAt ? formatRelative(a.assignedAt) : "-"}
            </p>
          </div>
          {a.isActive ? (
            <Badge variant="success" className="text-[10px]">ใช้งาน</Badge>
          ) : (
            <Badge variant="muted" className="text-[10px]">ระงับ</Badge>
          )}
        </div>
      ))}
    </div>
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
