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
import type { ReportMaterialsDisbursementRow } from "../api/materials-disbursement-report-api";

interface Props {
  rows: ReportMaterialsDisbursementRow[];
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
  const { label, variant } = config[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={variant}>{label}</Badge>;
}

function TypeBadge({ type, label }: { type: string; label: string }) {
  const config: Record<string, "secondary" | "outline" | "default"> = {
    stock_cut: "outline",
    production: "secondary",
  };
  return <Badge variant={config[type] ?? "secondary"}>{label}</Badge>;
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

export function MaterialsDisbursementReportTable({ rows, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>วันที่จ่าย</TableHead>
              <TableHead>เลขที่ใบจ่าย</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>รหัส/ชื่อวัสดุ</TableHead>
              <TableHead>จำนวนขอ</TableHead>
              <TableHead>จำนวนจ่ายจริง</TableHead>
              <TableHead>Lot ต้นทาง</TableHead>
              <TableHead>เหตุผล</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} cols={9} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center text-muted-foreground">
        ไม่พบรายการจ่ายออกในช่วงที่เลือก
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>วันที่จ่าย</TableHead>
              <TableHead>เลขที่ใบจ่าย</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead>รหัส/ชื่อวัสดุ</TableHead>
              <TableHead className="text-right">จำนวนขอ</TableHead>
              <TableHead className="text-right">จำนวนจ่ายจริง</TableHead>
              <TableHead>Lot ต้นทาง</TableHead>
              <TableHead>เหตุผล/หมายเหตุ</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={`${row.id}-${row.materialCode}`} className="group">
                <TableCell className="whitespace-nowrap">
                  <span className="font-medium">{formatDate(row.disbursementDate)}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-mono text-sm text-primary">{row.disbursementNo}</span>
                </TableCell>
                <TableCell>
                  <TypeBadge type={row.disbursementType} label={row.disbursementTypeLabel} />
                </TableCell>
                <TableCell className="min-w-[200px]">
                  <div className="text-sm">
                    <div className="font-medium">{row.materialName || "—"}</div>
                    {row.materialCode && (
                      <div className="text-xs text-muted-foreground font-mono">{row.materialCode}</div>
                    )}
                    {row.materialType && (
                      <div className="text-xs text-muted-foreground">{row.materialType}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono">
                  {formatNumber(row.requestedQuantity)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono font-medium">
                  {formatNumber(row.disbursedQuantity)}
                  {row.unitSymbol && (
                    <span className="ml-1 text-xs text-muted-foreground font-normal">({row.unitSymbol})</span>
                  )}
                </TableCell>
                <TableCell className="min-w-[160px]">
                  {row.sourceLotNo ? (
                    <div className="space-y-0.5">
                      {row.sourceLotNo.split(",").map((lot, i) => (
                        <div key={i} className="font-mono text-xs text-muted-foreground">
                          {lot.trim()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                  {row.reason || row.cancelReason || "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                  {row.status === "cancelled" && row.cancelReason && (
                    <div className="text-xs text-destructive mt-0.5 truncate max-w-[150px]" title={row.cancelReason}>
                      {row.cancelReason}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
