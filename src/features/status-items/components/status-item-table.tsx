"use client";

import type { ComponentProps } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
import { Pencil, Power, RotateCcw } from "lucide-react";
import type { StatusItem } from "../api/status-items-api";

export function StatusItemTable({
  items,
  isLoading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onStatusChange,
}: {
  items: StatusItem[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onEdit: (s: StatusItem) => void;
  onStatusChange: (s: StatusItem) => void;
}) {
  return (
    <Card className="p-4">
      <DataTable
        data={items}
        isLoading={isLoading}
        globalSearch={false}
        manualPagination
        pageIndex={page}
        pageSize={pageSize}
        totalItems={totalItems}
        pageCount={totalPages}
        onPaginationChange={({ pageIndex, pageSize }) => {
          onPageChange(pageIndex);
          onPageSizeChange(pageSize);
        }}
        columns={[
          {
            id: "code",
            header: "รหัส",
            cell: ({ row }: { row: { original: StatusItem } }) => (
              <code className="text-xs">{row.original.code}</code>
            ),
          },
          {
            id: "nameTh",
            header: "ชื่อ (ไทย)",
            cell: ({ row }: { row: { original: StatusItem } }) => (
              <span className="font-medium">{row.original.nameTh}</span>
            ),
          },
          {
            id: "module",
            header: "โมดูล",
            cell: ({ row }: { row: { original: StatusItem } }) => (
              <Badge variant="outline">{row.original.module}</Badge>
            ),
          },
          {
            id: "color",
            header: "สี",
            cell: ({ row }: { row: { original: StatusItem } }) => (
              <Badge variant={row.original.color as ComponentProps<typeof Badge>["variant"]}>
                {row.original.color}
              </Badge>
            ),
          },
          {
            id: "status",
            header: "สถานะ",
            cell: ({ row }: { row: { original: StatusItem } }) => (
              <Badge variant={row.original.isActive ? "success" : "muted"}>
                {row.original.isActive ? "ใช้งาน" : "ระงับ"}
              </Badge>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: StatusItem } }) => {
              const items: ActionItem[] = [
                {
                  label: "แก้ไข",
                  icon: Pencil,
                  onClick: () => onEdit(row.original),
                },
              ];
              if (row.original.isActive)
                items.push({
                  label: "ปิดใช้งาน",
                  icon: Power,
                  onClick: () => onStatusChange(row.original),
                  variant: "danger" as const,
                });
              else
                items.push({
                  label: "เปิดใช้งาน",
                  icon: RotateCcw,
                  onClick: () => onStatusChange(row.original),
                });
              return <ActionMenu label={`จัดการสถานะ ${row.original.code}`} items={items} />;
            },
          },
        ]}
        emptyState={{ title: "ไม่พบสถานะ", description: "เพิ่มสถานะใหม่เพื่อเริ่มต้นใช้งาน" }}
      />
    </Card>
  );
}
