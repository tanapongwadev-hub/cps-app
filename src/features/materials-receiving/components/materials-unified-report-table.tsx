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
import type { UnifiedReportRow } from "../api/materials-unified-report-api";

interface Props {
  rows: UnifiedReportRow[];
  isLoading?: boolean;
}

function formatNumber(value: string | number | null): string {
  if (value === null || value === "") return "—";
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

function DocTypeBadge({ type }: { type: string }) {
  if (type === "receive") {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        รับเข้า
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-orange-500 hover:bg-orange-600 text-white">
      จ่ายออก
    </Badge>
  );
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

export function MaterialsUnifiedReportTable({ rows, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>ประเภท</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>เลขที่เอกสาร</TableHead>
              <TableHead>รหัส/ชื่อวัสดุ</TableHead>
              <TableHead>ประเภท</TableHead>
              <TableHead className="text-right">รับเข้า</TableHead>
              <TableHead className="text-right">จ่ายออก</TableHead>
              <TableHead>หน่วย</TableHead>
              <TableHead>LOT ต้นทาง</TableHead>
              <TableHead>ผู้จัดจำหน่าย / ประเภทจ่าย</TableHead>
              <TableHead>PO / เหตุผล</TableHead>
              <TableHead>สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} cols={12} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border py-16 text-center text-muted-foreground">
        ไม่พบรายการในช่วงที่เลือก
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px]">ประเภท</TableHead>
              <TableHead className="w-[110px]">วันที่</TableHead>
              <TableHead className="w-[160px]">เลขที่เอกสาร</TableHead>
              <TableHead>รหัส/ชื่อวัสดุ</TableHead>
              <TableHead className="w-[60px]">ประเภท</TableHead>
              <TableHead className="text-right w-[100px]">รับเข้า</TableHead>
              <TableHead className="text-right w-[100px]">จ่ายออก</TableHead>
              <TableHead className="w-[60px]">หน่วย</TableHead>
              <TableHead className="w-[180px]">LOT ต้นทาง</TableHead>
              <TableHead className="w-[140px]">ผู้จัดจำหน่าย / ประเภทจ่าย</TableHead>
              <TableHead className="w-[140px]">PO / เหตุผล</TableHead>
              <TableHead className="w-[90px]">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow
                key={`${row.docType}-${row.docNo}-${idx}`}
                className={row.docType === "receive" ? "bg-green-50/50" : "bg-orange-50/30"}
              >
                <TableCell>
                  <DocTypeBadge type={row.docType} />
                </TableCell>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatDate(row.docDate)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="font-mono text-sm text-primary">{row.docNo}</span>
                </TableCell>
                <TableCell className="min-w-[180px]">
                  <div className="text-sm">
                    <div className="font-medium">{row.materialName || "—"}</div>
                    {row.materialCode && (
                      <div className="text-xs text-muted-foreground font-mono">{row.materialCode}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.materialType || "—"}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono font-medium text-green-700">
                  {formatNumber(row.quantityIn)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap font-mono font-medium text-red-600">
                  {formatNumber(row.quantityOut)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.unitSymbol || "—"}
                </TableCell>
                <TableCell className="min-w-[160px]">
                  {row.sourceLotNo ? (
                    <div className="space-y-0.5">
                      {row.sourceLotNo.split(",").map((lot, i) => (
                        <div key={i} className="font-mono text-xs text-muted-foreground truncate max-w-[160px]">
                          {lot.trim()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {row.supplierName ? (
                    <span className="truncate block max-w-[130px]">{row.supplierName}</span>
                  ) : row.subLabel ? (
                    <span className="text-xs">{row.subLabel}</span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[130px] truncate" title={row.poNo ?? undefined}>
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
