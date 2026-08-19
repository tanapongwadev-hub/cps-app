"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
import { Pencil, Power, RotateCcw } from "lucide-react";
import type { MaterialModel } from "../api/material-models-api";

export interface MaterialModelTableProps {
  models: MaterialModel[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (m: MaterialModel) => void;
  onStatusChange: (m: MaterialModel) => void;
}

export function MaterialModelTable({
  models,
  isLoading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onStatusChange,
}: MaterialModelTableProps) {
  return (
    <Card className="p-4">
      <DataTable
        data={models}
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
            cell: ({ row }: { row: { original: MaterialModel } }) => (
              <code className="text-xs">{row.original.code}</code>
            ),
          },
          {
            id: "nameTh",
            header: "ชื่อ (ไทย)",
            cell: ({ row }: { row: { original: MaterialModel } }) => (
              <span className="font-medium">{row.original.nameTh}</span>
            ),
          },
          {
            id: "nameEn",
            header: "ชื่อ (EN)",
            cell: ({ row }: { row: { original: MaterialModel } }) => row.original.nameEn ?? "-",
          },
          {
            id: "status",
            header: "สถานะ",
            cell: ({ row }: { row: { original: MaterialModel } }) => (
              <Badge variant={row.original.isActive ? "success" : "muted"}>
                {row.original.isActive ? "ใช้งาน" : "ระงับ"}
              </Badge>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: MaterialModel } }) => {
              const items: ActionItem[] = [
                {
                  label: "แก้ไข",
                  icon: Pencil,
                  onClick: () => onEdit(row.original),
                },
              ];
              if (row.original.isActive) {
                items.push({
                  label: "ปิดใช้งาน",
                  icon: Power,
                  onClick: () => onStatusChange(row.original),
                  variant: "danger" as const,
                });
              } else {
                items.push({
                  label: "เปิดใช้งาน",
                  icon: RotateCcw,
                  onClick: () => onStatusChange(row.original),
                });
              }
              return <ActionMenu label={`จัดการรุ่นวัสดุ ${row.original.code}`} items={items} />;
            },
          },
        ]}
        emptyState={{
          title: "ไม่พบรุ่นวัสดุ",
          description: "เพิ่มรุ่นวัสดุใหม่เพื่อเริ่มต้นใช้งาน",
        }}
      />
    </Card>
  );
}
