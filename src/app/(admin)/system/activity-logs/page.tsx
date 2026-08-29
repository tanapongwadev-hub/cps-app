"use client";

import * as React from "react";
import { Download, RefreshCw, Eye } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import type { ColumnDef } from "@tanstack/react-table";
import type { ActivityAction, ActivityLog } from "@/features/activity-logs/types";
import { formatDateTime, formatRelative } from "@/utils/date";
import { useDebounce } from "@/hooks/use-debounce";
import { showToast } from "@/lib/toast";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import { TextField, SelectField } from "@/components/forms/form-field";
import { useActivityLogsList } from "@/features/activity-logs/hooks/use-activity-logs";
import { ActivityLogDetailDialog } from "@/features/activity-logs/components/activity-log-detail-dialog";

const actionVariant: Record<string, "success" | "info" | "warning" | "danger" | "default" | "muted"> = {
  create: "success",
  update: "info",
  delete: "danger",
  login: "info",
  logout: "muted",
  view: "default",
  export: "info",
  import: "info",
  approve: "success",
  reject: "warning",
  assign: "info",
  status_change: "info",
  permission_change: "warning",
};

const actionLabel: Record<string, string> = {
  create: "สร้าง",
  update: "แก้ไข",
  delete: "ลบ",
  login: "เข้าสู่ระบบ",
  logout: "ออกจากระบบ",
  view: "ดู",
  export: "ส่งออก",
  import: "นำเข้า",
  approve: "อนุมัติ",
  reject: "ปฏิเสธ",
  assign: "มอบหมาย",
  status_change: "เปลี่ยนสถานะ",
  permission_change: "เปลี่ยนสิทธิ์",
};

function actionVariantFor(action: ActivityAction) {
  return actionVariant[action] ?? "default";
}

function actionLabelFor(action: ActivityAction) {
  return actionLabel[action] ?? action;
}

export default function ActivityLogsPage() {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [action, setAction] = React.useState<string>("");
  const [module, setModule] = React.useState<string>("");
  const [viewingLogId, setViewingLogId] = React.useState<string | null>(null);

  const logsQuery = useActivityLogsList({
    page,
    pageSize,
    search: debouncedSearch || undefined,
    userId: undefined,
    action: action || undefined,
    module: module || undefined,
  });

  const columns: ColumnDef<ActivityLog>[] = React.useMemo(
    () => [
      {
        id: "timestamp",
        header: "เวลา",
        cell: ({ row }) => (
          <div>
            <p className="text-sm">{formatDateTime(row.original.timestamp)}</p>
            <p className="text-xs text-muted-foreground">{formatRelative(row.original.timestamp)}</p>
          </div>
        ),
      },
      {
        id: "user",
        header: "ผู้ใช้งาน",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.userName}</p>
            <p className="text-xs text-muted-foreground">{row.original.userEmail}</p>
          </div>
        ),
      },
      {
        id: "action",
        header: "การกระทำ",
        cell: ({ row }) => (
          <Badge variant={actionVariantFor(row.original.action)}>
            {actionLabelFor(row.original.action)}
          </Badge>
        ),
      },
      {
        id: "module",
        header: "โมดูล",
        cell: ({ row }) => <Badge variant="outline">{row.original.module}</Badge>,
      },
      {
        id: "description",
        header: "รายละเอียด",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground line-clamp-1">{row.original.description}</span>
        ),
      },
      {
        id: "ip",
        header: "IP",
        cell: ({ row }) => (
          <code className="text-xs text-muted-foreground">{row.original.ipAddress}</code>
        ),
      },
      {
        id: "status",
        header: "สถานะ",
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === "success" ? "success" : row.original.status === "failure" ? "danger" : "warning"}
          >
            {row.original.status === "success" ? "สำเร็จ" : row.original.status === "failure" ? "ล้มเหลว" : "เตือน"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <ActionMenu row={log}
            label={`เมนูบันทึกกิจกรรม ${row.original.id}`}
            items={[
              {
                label: "ดูรายละเอียด",
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => setViewingLogId(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageContainer>
        <PageHeader
          title="บันทึกกิจกรรม"
          description="ติดตามการเปลี่ยนแปลงและการกระทำทั้งหมดในระบบ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ระบบ" },
            { label: "บันทึกกิจกรรม" },
          ]}
          primaryAction={
            <Button onClick={() => showToast.info("ส่งออกบันทึกกิจกรรม", "ระบบจะส่งออกไฟล์ในไม่ช้า")}>
              <Download className="h-4 w-4" />
              ส่งออก
            </Button>
          }
          secondaryActions={
            <Button variant="outline" onClick={() => logsQuery.refetch()}>
              <RefreshCw className="h-4 w-4" />
              รีเฟรช
            </Button>
          }
        />

        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <SelectField
              placeholder="การกระทำทั้งหมด"
              value={action}
              onValueChange={(v) => {
                setAction(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "การกระทำทั้งหมด" },
                ...Object.entries(actionLabel).map(([k, v]) => ({ value: k, label: v })),
              ]}
            />
            <SelectField
              placeholder="โมดูลทั้งหมด"
              value={module}
              onValueChange={(v) => {
                setModule(v);
                setPage(1);
              }}
              options={[
                { value: "", label: "โมดูลทั้งหมด" },
                { value: "user", label: "ผู้ใช้งาน" },
                { value: "role", label: "บทบาท" },
                { value: "ticket", label: "คำขอ" },
                { value: "menu", label: "เมนู" },
                { value: "settings", label: "ตั้งค่า" },
                { value: "auth", label: "การยืนยันตัวตน" },
              ]}
            />
          </div>
        </Card>

        <DataTable
          columns={columns}
          data={logsQuery.data?.items ?? []}
          isLoading={logsQuery.isLoading}
          isError={logsQuery.isError}
          onRetry={() => logsQuery.refetch()}
          totalItems={logsQuery.data?.totalItems ?? 0}
          globalSearch={false}
          enableColumnVisibility
          enableRowSelection={false}
          pageIndex={page - 1}
          pageSize={pageSize}
          pageCount={logsQuery.data?.totalPages ?? 1}
          onPaginationChange={({ pageIndex, pageSize: ps }) => {
            setPage(pageIndex + 1);
            setPageSize(ps);
          }}
          manualPagination
          emptyState={{
            title: "ไม่พบบันทึกกิจกรรม",
            description: "ลองเปลี่ยนเงื่อนไขการค้นหา",
          }}
        />
      </PageContainer>
      <PageFooter />

      <ActivityLogDetailDialog
        logId={viewingLogId}
        open={!!viewingLogId}
        onOpenChange={(open) => {
          if (!open) setViewingLogId(null);
        }}
      />
    </>
  );
}
