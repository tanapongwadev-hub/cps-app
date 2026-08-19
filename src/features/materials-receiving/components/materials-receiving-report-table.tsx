"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportMaterialsReceivingRow } from "../api/materials-receiving-report-api";

interface Props {
  rows: ReportMaterialsReceivingRow[];
  isLoading?: boolean;
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: "secondary" | "default" | "destructive" | "outline" }> = {
    draft: { label: "ฉบับร่าง", variant: "secondary" },
    confirmed: { label: "ยืนยันแล้ว", variant: "default" },
    cancelled: { label: "ยกเลิก", variant: "destructive" },
  };
  const entry = config[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

function MaterialTypeBadge({ type }: { type: string | null }) {
  if (!type) return "—";
  const config: Record<string, string> = {
    PCS: "PCS",
    PIPE: "ท่อ",
    SHEET: "แผ่น",
    COIL: "ม้วน",
  };
  return <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{config[type] ?? type}</span>;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  );
}

export function MaterialsReceivingReportTable({ rows, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>วันที่รับ</TableHead>
              <TableHead>เลขที่ใบรับ</TableHead>
              <TableHead>วันผลิต</TableHead>
              <TableHead>ผู้จัดจำหน่าย</TableHead>
              <TableHead>รหัส/ชื่อวัสดุ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead className="text-right">จำนวนรับ</TableHead>
              <TableHead className="text-right">หน่วย</TableHead>
              <TableHead className="text-right">จำนวน PKG</TableHead>
              <TableHead>PO No.</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} cols={11} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center text-muted-foreground">
        ไม่พบรายการรับเข้าในช่วงที่เลือก
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>วันที่รับ</TableHead>
              <TableHead>เลขที่ใบรับ</TableHead>
              <TableHead>วันผลิต</TableHead>
              <TableHead>ผู้จัดจำหน่าย</TableHead>
              <TableHead>รหัส/ชื่อวัสดุ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead className="text-right">จำนวนรับ</TableHead>
              <TableHead className="text-right">หน่วย</TableHead>
              <TableHead className="text-right">จำนวน PKG</TableHead>
              <TableHead>PO No.</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="group">
                <TableCell className="whitespace-nowrap">
                  <span className="font-medium">{formatDate(row.receiveDate)}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-mono text-sm text-primary">{row.internalLotNo}</span>
                  {row.runNo && (
                    <span className="ml-1 font-mono text-xs text-muted-foreground">({row.runNo})</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(row.supplierProductionDate)}
                </TableCell>
                <TableCell className="min-w-[160px]">
                  <div className="text-sm">
                    <div className="font-medium">{row.supplierName || "—"}</div>
                    {row.supplierCode && (
                      <div className="text-xs text-muted-foreground">{row.supplierCode}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="text-sm">
                    <div className="font-medium">{row.materialName || "—"}</div>
                    {row.materialCode && (
                      <div className="text-xs text-muted-foreground font-mono">{row.materialCode}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <MaterialTypeBadge type={row.materialType} />
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono font-medium">
                  {formatNumber(row.receiveQuantity)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {row.unitSymbol || "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-sm">
                  {row.packageCount}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {row.poNo || "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
