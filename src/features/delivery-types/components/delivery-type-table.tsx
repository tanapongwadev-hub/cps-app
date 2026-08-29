"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
import { Pencil, Power, RotateCcw } from "lucide-react";
import type { DeliveryType } from "../api/delivery-types-api";

export function DeliveryTypeTable({
  types,
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
  types: DeliveryType[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onEdit: (t: DeliveryType) => void;
  onStatusChange: (t: DeliveryType) => void;
}) {
  return (
    <Card className="p-4">
      <DataTable
        data={types}
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
            cell: ({ row }: { row: { original: DeliveryType } }) => (
              <code className="text-xs">{row.original.code}</code>
            ),
          },
          {
            id: "nameTh",
            header: "ชื่อ (ไทย)",
            cell: ({ row }: { row: { original: DeliveryType } }) => (
              <span className="font-medium">{row.original.nameTh}</span>
            ),
          },
          {
            id: "nameEn",
            header: "ชื่อ (EN)",
            cell: ({ row }: { row: { original: DeliveryType } }) => row.original.nameEn ?? "-",
          },
          {
            id: "status",
            header: "สถานะ",
            cell: ({ row }: { row: { original: DeliveryType } }) => (
              <Badge variant={row.original.isActive ? "success" : "muted"}>
                {row.original.isActive ? "ใช้งาน" : "ระงับ"}
              </Badge>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: DeliveryType } }) => {
              const items: ActionItem<DeliveryType>[] = [
                {
                  label: "แก้ไข",
                  icon: <Pencil className="h-3 w-3" />,
                  onClick: (row) => onEdit(row),
                },
              ];
              if (row.original.isActive)
                items.push({
                  label: "ปิดใช้งาน",
                  icon: <Power className="h-3 w-3" />,
                  onClick: (row) => onStatusChange(row),
                  variant: "danger" as const,
                });
              else
                items.push({
                  label: "เปิดใช้งาน",
                  icon: <RotateCcw className="h-3 w-3" />,
                  onClick: (row) => onStatusChange(row),
                });
              return (
                <ActionMenu row={row.original} label={`จัดการประเภทการจัดส่ง ${row.original.code}`} items={items} />
              );
            },
          },
        ]}
        emptyState={{
          title: "ไม่พบประเภทการจัดส่ง",
          description: "เพิ่มประเภทการจัดส่งใหม่เพื่อเริ่มต้นใช้งาน",
        }}
      />
    </Card>
  );
}
