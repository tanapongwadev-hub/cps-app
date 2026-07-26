"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, FolderTree, Tag, Building } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import { ConfirmDeleteDialog } from "@/components/forms/confirm-dialog";
import { apiClient } from "@/services/api-client";
import { showToast } from "@/lib/toast";
import { QUERY_KEYS } from "@/constants/app";
import type { Category, Organization, StatusItem } from "@/types/master-data";

type AnyMasterItem = Category | Organization | StatusItem;

interface MasterPageConfig {
  key: string;
  title: string;
  description: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  queryKey: readonly unknown[];
  endpoint: string;
  icon: React.ComponentType<{ className?: string }>;
  columns: Array<{
    id: string;
    header: string;
    cell: (item: AnyMasterItem) => React.ReactNode;
  }>;
}

const configs: Record<string, MasterPageConfig> = {
  categories: {
    key: "categories",
    title: "หมวดหมู่",
    description: "จัดการหมวดหมู่ที่ใช้ในระบบ",
    breadcrumbs: [
      { label: "หน้าหลัก", href: "/dashboard" },
      { label: "ข้อมูลหลัก" },
      { label: "หมวดหมู่" },
    ],
    queryKey: QUERY_KEYS.MASTER_DATA.CATEGORIES,
    endpoint: "/master-data/categories",
    icon: FolderTree,
    columns: [
      { id: "code", header: "รหัส", cell: (i) => <code className="text-xs">{String((i as Category).code)}</code> },
      { id: "name", header: "ชื่อ", cell: (i) => <span className="font-medium">{(i as Category).name}</span> },
      {
        id: "sort",
        header: "ลำดับ",
        cell: (i) => <span className="text-sm text-muted-foreground">{(i as Category).sortOrder}</span>,
      },
      {
        id: "status",
        header: "สถานะ",
        cell: (i) => (
          <Badge variant={(i as Category).status === "active" ? "success" : "muted"}>
            {(i as Category).status === "active" ? "ใช้งาน" : "ระงับ"}
          </Badge>
        ),
      },
    ],
  },
  statuses: {
    key: "statuses",
    title: "สถานะ",
    description: "จัดการสถานะที่ใช้ในระบบ",
    breadcrumbs: [
      { label: "หน้าหลัก", href: "/dashboard" },
      { label: "ข้อมูลหลัก" },
      { label: "สถานะ" },
    ],
    queryKey: QUERY_KEYS.MASTER_DATA.STATUSES,
    endpoint: "/master-data/statuses",
    icon: Tag,
    columns: [
      { id: "code", header: "รหัส", cell: (i) => <code className="text-xs">{String((i as StatusItem).code)}</code> },
      { id: "name", header: "ชื่อ", cell: (i) => <span className="font-medium">{(i as StatusItem).name}</span> },
      {
        id: "color",
        header: "สี",
        cell: (i) => (
          <Badge variant={(i as StatusItem).color === "danger" ? "danger" : (i as StatusItem).color === "warning" ? "warning" : (i as StatusItem).color === "success" ? "success" : "info"}>
            {(i as StatusItem).color}
          </Badge>
        ),
      },
      {
        id: "module",
        header: "โมดูล",
        cell: (i) => <Badge variant="outline">{(i as StatusItem).module}</Badge>,
      },
    ],
  },
  organizations: {
    key: "organizations",
    title: "องค์กร",
    description: "จัดการข้อมูลองค์กรและสาขา",
    breadcrumbs: [
      { label: "หน้าหลัก", href: "/dashboard" },
      { label: "ข้อมูลหลัก" },
      { label: "องค์กร" },
    ],
    queryKey: QUERY_KEYS.MASTER_DATA.ORGANIZATIONS,
    endpoint: "/master-data/organizations",
    icon: Building,
    columns: [
      { id: "code", header: "รหัส", cell: (i) => <code className="text-xs">{String((i as Organization).code)}</code> },
      { id: "name", header: "ชื่อ (ไทย)", cell: (i) => <span className="font-medium">{(i as Organization).name}</span> },
      { id: "nameEn", header: "Name (EN)", cell: (i) => <span className="text-muted-foreground">{(i as Organization).nameEn ?? "-"}</span> },
      {
        id: "type",
        header: "ประเภท",
        cell: (i) => <Badge variant="outline">{(i as Organization).type}</Badge>,
      },
      {
        id: "status",
        header: "สถานะ",
        cell: (i) => (
          <Badge variant={(i as Organization).status === "active" ? "success" : "muted"}>
            {(i as Organization).status === "active" ? "ใช้งาน" : "ระงับ"}
          </Badge>
        ),
      },
    ],
  },
};

export default function MasterDataDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const config = slug ? configs[slug] : null;
  const qc = useQueryClient();

  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: config?.queryKey ?? ["md"],
    queryFn: () => apiClient.get<AnyMasterItem[]>(config?.endpoint ?? ""),
    enabled: !!config,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`${config?.endpoint}/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: config?.queryKey });
      showToast.success("ลบข้อมูลเรียบร้อย");
    },
    onError: (err: Error) => showToast.error("ลบไม่สำเร็จ", err.message),
  });

  if (!config) {
    return (
      <PageContainer>
        <Card className="p-8 text-center text-muted-foreground">ไม่พบหน้าที่ต้องการ</Card>
      </PageContainer>
    );
  }

  const Icon = config.icon;
  const list = (data ?? []) as AnyMasterItem[];

  return (
    <>
      <PageContainer>
        <PageHeader
          title={config.title}
          description={config.description}
          breadcrumbs={config.breadcrumbs}
          primaryAction={
            <Button onClick={() => showToast.info("เพิ่มข้อมูล", "ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้")}>
              <Plus className="h-4 w-4" />
              เพิ่ม{config.title}
            </Button>
          }
        />

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">ทั้งหมด {list.length} รายการ</h3>
          </div>
        </Card>

        <DataTable
          columns={
            config.columns.map((c) => ({
              id: c.id,
              header: c.header,
              cell: ({ row }: { row: { original: AnyMasterItem } }) => c.cell(row.original),
            })) as never
          }
          data={list}
          isLoading={isLoading}
          globalSearch={false}
          enableColumnVisibility={false}
          emptyState={{
            title: `ไม่พบ${config.title}`,
            description: "เพิ่มรายการใหม่เพื่อเริ่มต้นใช้งาน",
          }}
        />
      </PageContainer>

      <PageFooter />

      <ConfirmDeleteDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        itemName="รายการ"
        loading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingId) {
            await deleteMutation.mutateAsync(deletingId);
            setDeletingId(null);
          }
        }}
      />
    </>
  );
}
