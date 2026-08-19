"use client";

import * as React from "react";
import { FileDown, RefreshCw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { MaterialsDisbursementReportFilters } from "@/features/materials-disbursement/components/materials-disbursement-report-filters";
import { MaterialsDisbursementReportTable } from "@/features/materials-disbursement/components/materials-disbursement-report-table";
import { useMaterialsDisbursementReport } from "@/features/materials-disbursement/hooks/use-materials-disbursement-report";
import type {
  ReportMaterialsDisbursementFilters,
  ReportMaterialsDisbursementRow,
} from "@/features/materials-disbursement/api/materials-disbursement-report-api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MaterialsDisbursementReportPage() {
  const [filters, setFilters] = React.useState<ReportMaterialsDisbursementFilters>({});

  const reportQuery = useMaterialsDisbursementReport(filters);

  const handleSearch = React.useCallback(() => {
    reportQuery.refetch();
  }, [reportQuery]);

  const handleRefresh = React.useCallback(() => {
    reportQuery.refetch();
  }, [reportQuery]);

  const reportData = reportQuery.data;
  const rows: ReportMaterialsDisbursementRow[] = reportData?.items ?? [];
  const meta = reportData?.meta;
  const isLoading = reportQuery.isFetching;

  const handleExportCsv = React.useCallback(() => {
    if (rows.length === 0) {
      showToast.error("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    const headers = [
      "วันที่จ่าย",
      "เลขที่ใบจ่าย",
      "ประเภท",
      "รหัสวัสดุ",
      "ชื่อวัสดุ",
      "จำนวนขอ",
      "จำนวนจ่ายจริง",
      "หน่วย",
      "Lot ต้นทาง",
      "เหตุผล/หมายเหตุ",
      "สถานะ",
      "วันยืนยัน",
      "วันยกเลิก",
      "สาเหตุยกเลิก",
    ];

    const csvRows = rows.map((r: ReportMaterialsDisbursementRow) => [
      r.disbursementDate,
      r.disbursementNo,
      r.disbursementTypeLabel,
      r.materialCode,
      r.materialName,
      r.requestedQuantity,
      r.disbursedQuantity,
      r.unitSymbol,
      r.sourceLotNo ?? "",
      r.reason ?? "",
      r.statusLabel,
      r.confirmedAt ?? "",
      r.cancelledAt ?? "",
      r.cancelReason ?? "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row: string[]) =>
        row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `รายงานจ่ายออกวัสดุ_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast.success(`ส่งออก ${rows.length} รายการ`);
  }, [rows]);

  return (
    <PageContainer>
      <PageHeader
        title="รายงานจ่ายออกวัสดุ"
        description="รายงานสอบกลับการจ่ายออกวัสดุ จำแนกตามวันที่จ่าย ประเภท วัสดุ LOT ต้นทาง และสถานะ"
        primaryAction={
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <FileDown className="h-4 w-4 mr-1" />
            ส่งออก CSV
          </Button>
        }
        secondaryActions={
          <Button variant="outline" size="icon" onClick={handleRefresh} title="รีเฟรช">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        }
      />

      {/* Filters */}
      <MaterialsDisbursementReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Summary bar */}
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{meta.totalDocuments.toLocaleString()}</strong> ใบจ่าย
            {" — "}
            <strong className="text-foreground">{meta.totalItems.toLocaleString()}</strong> รายการ
          </span>
          {meta.generatedAt && (
            <span>พิมพ์เมื่อ {formatDate(meta.generatedAt)}</span>
          )}
        </div>
      )}

      {/* Table */}
      <MaterialsDisbursementReportTable rows={rows} isLoading={isLoading} />
    </PageContainer>
  );
}
