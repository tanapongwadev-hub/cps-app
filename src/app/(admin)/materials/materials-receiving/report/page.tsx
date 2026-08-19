"use client";

import * as React from "react";
import { FileDown, RefreshCw } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { MaterialsReceivingReportFilters } from "@/features/materials-receiving/components/materials-receiving-report-filters";
import { MaterialsReceivingReportTable } from "@/features/materials-receiving/components/materials-receiving-report-table";
import { useMaterialsReceivingReport } from "@/features/materials-receiving/hooks/use-materials-receiving-report";
import { useMaterialsReceivingLookups } from "@/features/materials-receiving/hooks/use-materials-receiving";
import type {
  ReportMaterialsReceivingFilters,
  ReportMaterialsReceivingRow,
} from "@/features/materials-receiving/api/materials-receiving-report-api";
import type { MaterialsReceivingLookups } from "@/features/materials-receiving/api/materials-receiving-api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MaterialsReceivingReportPage() {
  const [filters, setFilters] = React.useState<ReportMaterialsReceivingFilters>({});

  const lookupsQuery = useMaterialsReceivingLookups();
  const reportQuery = useMaterialsReceivingReport(filters);

  const handleSearch = React.useCallback(() => {
    reportQuery.refetch();
  }, [reportQuery]);

  const handleRefresh = React.useCallback(() => {
    reportQuery.refetch();
  }, [reportQuery]);

  const reportData = reportQuery.data;
  const rows: ReportMaterialsReceivingRow[] = reportData?.items ?? [];
  const meta = reportData?.meta;
  const isLoading = reportQuery.isFetching;

  const lookups: MaterialsReceivingLookups = lookupsQuery.data ?? {
    suppliers: [],
    materials: [],
    units: [],
  };

  const handleExportCsv = React.useCallback(() => {
    if (rows.length === 0) {
      showToast.error("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }

    const headers = [
      "วันที่รับ",
      "เลขที่ใบรับ",
      "วันผลิต Supplier",
      "รหัส Supplier",
      "ชื่อ Supplier",
      "รหัสวัสดุ",
      "ชื่อวัสดุ",
      "ประเภทวัสดุ",
      "จำนวนรับ",
      "หน่วย",
      "จำนวน Package",
      "PO No.",
      "สถานะ",
      "วันที่ยืนยัน",
    ];

    const csvRows = rows.map((r: ReportMaterialsReceivingRow) => [
      r.receiveDate,
      r.internalLotNo,
      r.supplierProductionDate ?? "",
      r.supplierCode,
      r.supplierName,
      r.materialCode,
      r.materialName,
      r.materialType ?? "",
      r.receiveQuantity,
      r.unitSymbol,
      String(r.packageCount),
      r.poNo ?? "",
      r.status,
      r.confirmedAt ?? "",
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
    link.download = `รายงานรับเข้าวัสดุ_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast.success(`ส่งออก ${rows.length} รายการ`);
  }, [rows]);

  return (
    <PageContainer>
      <PageHeader
        title="รายงานรับเข้าวัสดุ"
        description="รายงานสอบกลับการรับเข้าวัตถุดิบ จำแนกตามวันที่รับ ผู้จัดจำหน่าย วัสดุ และสถานะ"
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
      <MaterialsReceivingReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        suppliers={lookups.suppliers.map((s) => ({ id: s.id, nameTh: s.nameTh }))}
        materials={lookups.materials.map((m) => ({ id: m.id, code: m.code, name: m.name }))}
        onSearch={handleSearch}
      />

      {/* Summary bar */}
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          <span>
            พบ <strong className="text-foreground">{meta.totalItems.toLocaleString()}</strong> รายการ
          </span>
          {meta.generatedAt && (
            <span>พิมพ์เมื่อ {formatDate(meta.generatedAt)}</span>
          )}
        </div>
      )}

      {/* Table */}
      <MaterialsReceivingReportTable rows={rows} isLoading={isLoading} />
    </PageContainer>
  );
}
