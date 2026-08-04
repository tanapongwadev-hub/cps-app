"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import { Pencil, Power, RotateCcw } from "lucide-react";
import type { Unit } from "../api/units-api";
import { PERMISSIONS } from "@/constants/permissions";

export interface UnitTableProps {
  units: Unit[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (unit: Unit) => void;
  onStatusChange: (unit: Unit) => void;
  canEdit: boolean;
  canDelete: boolean;
  canRestore?: boolean;
}

export function UnitTable({
  units,
  isLoading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onStatusChange,
  canEdit,
  canDelete,
  canRestore,
}: UnitTableProps) {
  return (
    <Card className="p-4">
      <DataTable
        data={units}
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
            cell: ({ row }: { row: { original: Unit } }) => (
              <code className="text-xs">{row.original.code}</code>
            ),
          },
          {
            id: "nameTh",
            header: "ชื่อ (ไทย)",
            cell: ({ row }: { row: { original: Unit } }) => (
              <span className="font-medium">{row.original.nameTh}</span>
            ),
          },
          {
            id: "nameEn",
            header: "ชื่อ (EN)",
            cell: ({ row }: { row: { original: Unit } }) => (
              <span className="text-muted-foreground">
                {row.original.nameEn ?? "-"}
              </span>
            ),
          },
          {
            id: "symbol",
            header: "สัญลักษณ์",
            cell: ({ row }: { row: { original: Unit } }) =>
              row.original.symbol ?? "-",
          },
          {
            id: "status",
            header: "สถานะ",
            cell: ({ row }: { row: { original: Unit } }) => (
              <Badge variant={row.original.isActive ? "success" : "muted"}>
                {row.original.isActive ? "ใช้งาน" : "ระงับ"}
              </Badge>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: Unit } }) => {
              const actions = [];
              if (canEdit) {
                actions.push({
                  label: "แก้ไข",
                  icon: <Pencil className="h-3 w-3" />,
                  onClick: () => onEdit(row.original),
                });
              }
              if (row.original.isActive && canDelete) {
                actions.push({
                  label: "ปิดใช้งาน",
                  icon: <Power className="h-3 w-3" />,
                  onClick: () => onStatusChange(row.original),
                  variant: "danger" as const,
                });
              }
              if (!row.original.isActive && canRestore) {
                actions.push({
                  label: "เปิดใช้งาน",
                  icon: <RotateCcw className="h-3 w-3" />,
                  onClick: () => onStatusChange(row.original),
                });
              }
              return actions.length > 0 ? <ActionMenu items={actions as any} /> : null;
            },
          },
        ]}
        emptyState={{
          title: "ไม่พบหน่วยนับ",
          description: "เพิ่มหน่วยนับใหม่เพื่อเริ่มต้นใช้งาน",
        }}
      />
    </Card>
  );
}
