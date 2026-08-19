"use client";

import * as React from "react";
import { FileDown, RefreshCw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useMaterialsUnifiedReport } from "@/features/materials-receiving/hooks/use-materials-unified-report";
import { MaterialsUnifiedReportFilters } from "@/features/materials-receiving/components/materials-unified-report-filters";
import { MaterialsUnifiedReportTable } from "@/features/materials-receiving/components/materials-unified-report-table";
import type { UnifiedReportFilters } from "@/features/materials-receiving/api/materials-unified-report-api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function exportCSV(
  items: Array<{
    docType: string;
    docDate: string;
    docNo: string;
    materialCode: string;
    materialName: string;
    materialType: string | null;
    unitSymbol: string;
    quantityIn: string | null;
    quantityOut: string | null;
    sourceLotNo: string | null;
    subLabel: string | null;
    poNo: string | null;
    supplierName: string | null;
    status: string;
    statusLabel: string;
  }>,
) {
  const headers = [
    "ประเภท",
    "วันที่",
    "เลขที่เอกสาร",
    "รหัสวัสดุ",
    "ชื่อวัสดุ",
    "ประเภทวัสดุ",
    "หน่วย",
    "รับเข้า",
    "จ่ายออก",
    "LOT ต้นทาง",
    "ผู้จัดจำหน่าย / ประเภทจ่าย",
    "PO / เหตุผล",
    "สถานะ",
  ];

  const rows = items.map((r) => [
    r.docType === "receive" ? "รับเข้า" : "จ่ายออก",
    r.docDate,
    r.docNo,
    r.materialCode,
    r.materialName,
    r.materialType ?? "",
    r.unitSymbol,
    r.quantityIn ?? "0",
    r.quantityOut ?? "0",
    r.sourceLotNo ?? "",
    r.supplierName ?? r.subLabel ?? "",
    r.poNo ?? "",
    r.statusLabel,
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `รายงานวัสดุคงคลัง_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function MaterialsReportPage() {
  const [filters, setFilters] = React.useState<UnifiedReportFilters>({});
  const reportQuery = useMaterialsUnifiedReport(filters);

  const handleSearch = React.useCallback(() => {
    reportQuery.refetch();
  }, [reportQuery]);

  const handleRefresh = React.useCallback(() => {
    reportQuery.refetch();
  }, [reportQuery]);

  const items = reportQuery.data?.items ?? [];
  const meta = reportQuery.data?.meta;
  const isLoading = reportQuery.isFetching;

  const handleExportCsv = React.useCallback(() => {
    if (items.length === 0) return;
    exportCSV(items);
  }, [items]);

  return (
    <PageContainer>
      <PageHeader
        title="รายงานวัสดุคงคลัง"
        description="รายงานสรุปการรับเข้าและจ่ายออกวัสดุ จำแนกตาม LOT ต้นทาง (FIFO)"
        primaryAction={
          items.length > 0 ? (
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <FileDown className="h-4 w-4 mr-1" />
              ส่งออก CSV
            </Button>
          ) : undefined
        }
        secondaryActions={
          <Button variant="outline" size="icon" onClick={handleRefresh} title="รีเฟรช">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      <MaterialsUnifiedReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Summary bar */}
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              พบ{" "}
              <strong className="text-foreground">{meta.totalItems.toLocaleString()}</strong>{" "}
              รายการ
            </span>
            <span className="text-green-700">
              รับเข้า{" "}
              <strong className="text-foreground">
                {items.filter((r) => r.docType === "receive").length}
              </strong>{" "}
              รายการ
            </span>
            <span className="text-red-600">
              จ่ายออก{" "}
              <strong className="text-foreground">
                {items.filter((r) => r.docType === "disbursement").length}
              </strong>{" "}
              รายการ
            </span>
          </span>
          {meta.generatedAt && (
            <span className="whitespace-nowrap">พิมพ์เมื่อ {formatDate(meta.generatedAt)}</span>
          )}
        </div>
      )}

      <MaterialsUnifiedReportTable rows={items} isLoading={isLoading} />
    </PageContainer>
  );
}
