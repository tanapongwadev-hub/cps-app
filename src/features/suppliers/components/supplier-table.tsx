"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu, type ActionItem } from "@/components/tables/action-menu";
import { Pencil, Power, RotateCcw } from "lucide-react";
import type { Supplier } from "../api/suppliers-api";

export interface SupplierTableProps {
  suppliers: Supplier[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (supplier: Supplier) => void;
  onStatusChange: (supplier: Supplier) => void;
}

export function SupplierTable({
  suppliers,
  isLoading,
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onStatusChange,
}: SupplierTableProps) {
  return (
    <Card className="p-4">
      <DataTable
        data={suppliers}
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
        emptyState={{
          title: "ไม่พบผู้จัดจำหน่าย",
          description: "เพิ่มผู้จัดจำหน่ายใหม่เพื่อเริ่มต้นใช้งาน",
        }}
        columns={[
          {
            id: "code",
            header: "รหัส",
            cell: ({ row }: { row: { original: Supplier } }) => (
              <code className="text-xs">{row.original.code}</code>
            ),
          },
          {
            id: "nameTh",
            header: "ชื่อ (ไทย)",
            cell: ({ row }: { row: { original: Supplier } }) => (
              <span className="font-medium">{row.original.nameTh}</span>
            ),
          },
          {
            id: "taxId",
            header: "เลขผู้เสียภาษี",
            cell: ({ row }: { row: { original: Supplier } }) => row.original.taxId ?? "-",
          },
          {
            id: "contact",
            header: "ผู้ติดต่อ",
            cell: ({ row }: { row: { original: Supplier } }) => row.original.contactName ?? "-",
          },
          {
            id: "telephone",
            header: "โทรศัพท์",
            cell: ({ row }: { row: { original: Supplier } }) => row.original.telephone ?? "-",
          },
          {
            id: "status",
            header: "สถานะ",
            cell: ({ row }: { row: { original: Supplier } }) => (
              <Badge variant={row.original.isActive ? "success" : "muted"}>
                {row.original.isActive ? "ใช้งาน" : "ระงับ"}
              </Badge>
            ),
          },
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: Supplier } }) => {
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
              return (
                <ActionMenu label={`จัดการผู้จัดจำหน่าย ${row.original.code}`} items={items} />
              );
            },
          },
        ]}
      />
    </Card>
  );
}
