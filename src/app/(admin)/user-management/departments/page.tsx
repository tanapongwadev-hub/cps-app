"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  RefreshCw,
  Filter,
} from "lucide-react";
import {
  PageHeader,
  PageContainer,
  PageFooter,
} from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import {
  ConfirmDeleteDialog,
  useConfirmDialog,
} from "@/components/forms/confirm-dialog";
import { SelectField, TextField } from "@/components/forms/form-field";
import { useDebounce } from "@/hooks/use-debounce";
import { PermissionGuard } from "@/components/ui/permission-guard";
import { showToast } from "@/lib/toast";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from "@/features/departments/hooks/use-departments";
import { DepartmentFormDialog } from "@/features/departments/components/department-form-dialog";
import { PERMISSIONS } from "@/constants/permissions";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { cn } from "@/utils/cn";
import type { Department } from "@/features/departments/types";

/**
 * Real backend notes:
 *   - `isActive` is read-only (no PATCH/status endpoint) — we display it
 *     as a badge but don't expose a toggle.
 *   - `/departments/tree` returns 500 (broken on backend) — we build
 *     the tree client-side from the flat list using `parent?.id`.
 *   - The list response is paginated; we read `data.items` (not `data`).
 */
export default function DepartmentsPage() {
  const debounce = useDebounce;

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = debounce(search, 300);
  const [status, setStatus] = React.useState<string>("");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<Department | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const departmentsQuery = useDepartments({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    status: status || undefined,
  });

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();
  const confirm = useConfirmDialog();

  const items = departmentsQuery.data?.items ?? [];

  // Build the tree client-side (backend /tree is broken). Items whose
  // parent isn't in the list are treated as roots. Sort each level by
  // `code` (or `nameTh`) for stable display.
  const tree = React.useMemo<Department[]>(() => {
    const sorted = [...items].sort((a, b) =>
      (a.code ?? "").localeCompare(b.code ?? ""),
    );
    const map = new Map<string, Department>();
    for (const d of sorted) {
      map.set(d.id, { ...d, children: [] });
    }
    const roots: Department[] = [];
    for (const d of sorted) {
      const node = map.get(d.id);
      if (!node) continue;
      const parentId = d.parentId ?? d.parent?.id ?? null;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, [items]);

  const columns: ColumnDef<Department>[] = React.useMemo(
    () => [
      {
        id: "department",
        header: "แผนก",
        size: 320,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {d.nameTh}
                  {d.nameEn && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      ({d.nameEn})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  <code className="font-mono">{d.code}</code>
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "parent",
        header: "แผนกแม่",
        cell: ({ row }) => {
          const parentName =
            row.original.parent?.nameTh ??
            row.original.parent?.nameEn ??
            row.original.parent?.code ??
            (row.original.parentId ? `#${row.original.parentId}` : "—");
          return (
            <span className="text-sm text-muted-foreground">{parentName}</span>
          );
        },
      },
      {
        id: "users",
        header: "ผู้ใช้งาน",
        cell: ({ row }) => {
          const count = row.original.userCount;
          if (count == null) {
            return <span className="text-xs text-muted-foreground">-</span>;
          }
          return (
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {count}
            </Badge>
          );
        },
      },
      {
        id: "status",
        header: "สถานะ",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge variant="success">ใช้งาน</Badge>
          ) : (
            <Badge variant="muted">ระงับ</Badge>
          ),
      },
      {
        id: "updated",
        header: "อัพเดทล่าสุด",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.original.updatedAt
              ? new Date(row.original.updatedAt).toLocaleString("th-TH", {
                  dateStyle: "short",
                })
              : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const d = row.original;
          return (
            <ActionMenu row={department}
              label={`เมนู ${d.nameTh}`}
              items={[
                {
                  label: "แก้ไข",
                  icon: <Pencil className="h-3.5 w-3.5" />,
                  onClick: () => {
                    setEditingDept(d);
                    setFormOpen(true);
                  },
                },
                {
                  label: "ลบ",
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  variant: "danger",
                  onClick: () => setDeleteId(d.id),
                },
              ]}
            />
          );
        },
      },
    ],
    [],
  );

  return (
    <>
      <PageContainer>
        <PageHeader
          title="แผนก"
          description="จัดการโครงสร้างแผนกในองค์กร"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "การจัดการผู้ใช้งาน" },
            { label: "แผนก" },
          ]}
          primaryAction={
            <PermissionGuard permission={PERMISSIONS.DEPARTMENT_CREATE}>
              <Button
                onClick={() => {
                  setEditingDept(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                เพิ่มแผนก
              </Button>
            </PermissionGuard>
          }
          secondaryActions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => departmentsQuery.refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">รีเฟรช</span>
            </Button>
          }
        />

        {/* Filter Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">ตัวกรอง</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              placeholder="ค้นหารหัสหรือชื่อแผนก"
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
                { value: "inactive", label: "ระงับ" },
              ]}
            />
          </div>
        </Card>

        <DataTable
          columns={columns}
          data={items}
          isLoading={departmentsQuery.isLoading}
          isError={departmentsQuery.isError}
          onRetry={() => departmentsQuery.refetch()}
          totalItems={departmentsQuery.data?.meta?.totalItems ?? 0}
          searchPlaceholder="ค้นหา..."
          searchValue={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          enableRowSelection
          enableColumnVisibility
          defaultHiddenColumns={["parent", "updated"]}
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={departmentsQuery.data?.meta?.totalPages ?? 1}
          onPaginationChange={({ pageIndex, pageSize: ps }) => {
            setPage(pageIndex + 1);
            setPageSize(ps);
          }}
          manualPagination
          emptyState={{
            title: "ไม่พบแผนก",
            description: "ลองเปลี่ยนเงื่อนไขการค้นหาหรือเพิ่มแผนกใหม่",
          }}
        />

        {/* Tree view (collapsed by default) — only if there are parent-child relationships */}
        {tree.some((d) => d.children && d.children.length > 0) && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              โครงสร้างแผนก
            </h3>
            <ul className="space-y-1">
              {tree.map((dept) => (
                <DepartmentTreeNode key={dept.id} dept={dept} level={0} />
              ))}
            </ul>
          </Card>
        )}
      </PageContainer>

      <PageFooter />

      <DepartmentFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditingDept(null);
        }}
        department={editingDept}
      />

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        itemName="แผนก"
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
        warning="แผนกที่ถูกลบจะไม่สามารถกู้คืนได้ และอาจส่งผลต่อผู้ใช้งานที่สังกัดแผนกนี้"
      />

      {confirm.dialog}
    </>
  );
}

function DepartmentTreeNode({
  dept,
  level,
}: {
  dept: Department;
  level: number;
}) {
  const children = dept.children ?? [];
  return (
    <>
      <li
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border bg-card p-3",
          !dept.isActive && "opacity-60",
        )}
        style={{ marginLeft: level * 24 }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{dept.nameTh}</p>
            <p className="text-xs text-muted-foreground">
              <code className="font-mono">{dept.code}</code>
              {dept.nameEn && ` · ${dept.nameEn}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {dept.isActive ? (
            <Badge variant="success" className="text-[10px]">
              ใช้งาน
            </Badge>
          ) : (
            <Badge variant="muted" className="text-[10px]">
              ระงับ
            </Badge>
          )}
        </div>
      </li>
      {children.map((c) => (
        <DepartmentTreeNode key={c.id} dept={c} level={level + 1} />
      ))}
    </>
  );
}
