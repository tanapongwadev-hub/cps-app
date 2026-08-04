"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/tables/data-table";
import { ActionMenu } from "@/components/tables/action-menu";
import { Pencil, Power, RotateCcw } from "lucide-react";
import type { LoadingPoint } from "../api/loading-points-api";

export function LoadingPointTable({ points, isLoading, page, pageSize, totalItems, totalPages, onPageChange, onPageSizeChange, onEdit, onStatusChange }: {
  points: LoadingPoint[]; isLoading: boolean;
  page: number; pageSize: number; totalItems: number; totalPages: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
  onEdit: (p: LoadingPoint) => void; onStatusChange: (p: LoadingPoint) => void;
}) {
  return (
    <Card className="p-4">
      <DataTable
        data={points} isLoading={isLoading} globalSearch={false}
        page={page} pageSize={pageSize} totalItems={totalItems} totalPages={totalPages}
        onPageChange={onPageChange} onPageSizeChange={onPageSizeChange}
        emptyState={{ title: "ไม่พบจุดขนถ่าย", description: "เพิ่มจุดขนถ่ายใหม่เพื่อเริ่มต้นใช้งาน" }}
        columns={[
          { id: "code", header: "รหัส", cell: ({ row }: any) => <code className="text-xs">{row.original.code}</code> },
          { id: "nameTh", header: "ชื่อ (ไทย)", cell: ({ row }: any) => <span className="font-medium">{row.original.nameTh}</span> },
          { id: "nameEn", header: "ชื่อ (EN)", cell: ({ row }: any) => row.original.nameEn ?? "-" },
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
