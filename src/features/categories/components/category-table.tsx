"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import { Pencil, Power, RotateCcw } from "lucide-react";
import type { Category } from "../api/categories-api";

export function CategoryTable({ categories, isLoading, page, pageSize, totalItems, totalPages, onPageChange, onPageSizeChange, onEdit, onStatusChange }: {
  categories: Category[]; isLoading: boolean;
  page: number; pageSize: number; totalItems: number; totalPages: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
  onEdit: (c: Category) => void; onStatusChange: (c: Category) => void;
}) {
  return (
    <Card className="p-4">
      <DataTable
        data={categories} isLoading={isLoading} globalSearch={false}
        page={page} pageSize={pageSize} totalItems={totalItems} totalPages={totalPages}
        onPageChange={onPageChange} onPageSizeChange={onPageSizeChange}
        emptyState={{ title: "ไม่พบหมวดหมู่", description: "เพิ่มหมวดหมู่ใหม่เพื่อเริ่มต้นใช้งาน" }}
        columns={[
          { id: "code", header: "รหัส", cell: ({ row }: any) => <code className="text-xs">{row.original.code}</code> },
          { id: "nameTh", header: "ชื่อ (ไทย)", cell: ({ row }: any) => <span className="font-medium">{row.original.nameTh}</span> },
          { id: "sortOrder", header: "ลำดับ", cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.sortOrder}</span> },
          { id: "status", header: "สถานะ", cell: ({ row }: any) => <Badge variant={row.original.isActive ? "success" : "muted"}>{row.original.isActive ? "ใช้งาน" : "ระงับ"}</Badge> },
          { id: "actions", header: "", cell: ({ row }: any) => {
            const items: any[] = [{ label: "แก้ไข", icon: <Pencil className="h-3 w-3" />, onClick: () => onEdit(row.original) }];
            if (row.original.isActive) items.push({ label: "ปิดใช้งาน", icon: <Power className="h-3 w-3" />, onClick: () => onStatusChange(row.original), variant: "danger" as const });
            else items.push({ label: "เปิดใช้งาน", icon: <RotateCcw className="h-3 w-3" />, onClick: () => onStatusChange(row.original) });
            return <ActionMenu items={items} />;
          }},
        ]}
      />
    </Card>
  );
}
