"use client";

import * as React from "react";
import { QrCode, Scan } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getQrCodeUrl(text: string, size: number = 120): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

export default function QrTrackingPage() {
  const [qrInput, setQrInput] = React.useState("");
  const [searchedQr, setSearchedQr] = React.useState<string | null>(null);

  const handleSearch = () => {
    if (qrInput.trim()) {
      setSearchedQr(qrInput.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // Placeholder tracking data
  const trackingData = searchedQr
    ? {
        qrCode: searchedQr,
        lotDetailNo: `CCI-2026H1700001-01`,
        materialCode: "MAT-A001",
        materialName: "แผ่นอลูมิเนียม 4x8 ฟุต",
        originalQuantity: "50",
        remainingQuantity: "30",
        status: "in_stock",
        receiveDate: "2026-08-10",
        receiveBy: "นายสมชาย มาก",
        disbursements: [
          {
            disbursementNo: "DIS-2026H170001",
            disbursementDate: "2026-08-15",
            disbursedQuantity: "10",
            disbursedBy: "นางสาวปิยะ ดี",
          },
          {
            disbursementNo: "DIS-2026H170003",
            disbursementDate: "2026-08-17",
            disbursedQuantity: "10",
            disbursedBy: "นายวิชัย มา",
          },
        ],
      }
    : null;

  const statusVariant = (status: string): "default" | "success" | "destructive" | "warning" | "secondary" => {
    switch (status) {
      case "in_stock": return "success";
      case "issued": return "destructive";
      case "damaged": return "warning";
      default: return "secondary";
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "รอดำเนินการ",
    in_stock: "อยู่ในสต็อก",
    issued: "จ่ายออกแล้ว",
    damaged: "ชำรุด",
  };

  return (
    <div className="container py-6 space-y-6">
      <PageHeader
        title="ติดตาม QR Code"
        description="ตรวจสอบสถานะและประวัติการจ่ายออกของ QR Code วัสดุ"
        breadcrumbs={[
          { label: "วัสดุ", href: "/materials" },
          { label: "การจ่ายออกวัสดุ", href: "/materials/materials-disbursement" },
          { label: "ติดตาม QR Code" },
        ]}
      />

      {/* Search */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <Scan className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="สแกนหรือพิมพ์เลข QR Code / Lot Detail No..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9 font-mono text-base"
            />
          </div>
          <Button onClick={handleSearch} disabled={!qrInput.trim()}>
            <QrCode className="h-4 w-4 mr-2" />
            ค้นหา
          </Button>
        </div>
      </div>

      {/* Result */}
      {!searchedQr && (
        <div className="rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center py-20 text-center">
          <QrCode className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="text-base font-medium text-muted-foreground">
            พิมพ์หรือสแกนเลข QR Code เพื่อติดตามสถานะ
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            ระบบจะแสดงข้อมูล lot ล็อต จำนวนคงเหลือ และประวัติการจ่ายออก
          </p>
        </div>
      )}

      {searchedQr && trackingData && (
        <div className="space-y-6">
          {/* QR Info Card */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3">
              {/* QR Image */}
              <div className="flex flex-col items-center justify-center p-6 bg-muted/20 border-r">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getQrCodeUrl(trackingData.qrCode, 140)}
                  alt={trackingData.qrCode}
                  className="w-36 h-36 rounded-lg border bg-white shadow-sm"
                />
                <p className="font-mono text-xs text-muted-foreground mt-2 text-center">
                  {trackingData.qrCode}
                </p>
              </div>

              {/* Material Info */}
              <div className="p-6 space-y-3 md:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {trackingData.materialCode} — {trackingData.materialName}
                    </h3>
                    <p className="text-sm text-muted-foreground font-mono">
                      Lot: {trackingData.lotDetailNo}
                    </p>
                  </div>
                  <Badge variant={statusVariant(trackingData.status)} className="text-sm">
                    {statusLabels[trackingData.status] ?? trackingData.status}
                  </Badge>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">จำนวนเดิม</span>
                    <p className="font-medium">{formatNumber(trackingData.originalQuantity)} ชิ้น</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">คงเหลือ</span>
                    <p className={`font-semibold ${Number(trackingData.remainingQuantity) === 0 ? "text-destructive" : "text-success"}`}>
                      {formatNumber(trackingData.remainingQuantity)} ชิ้น
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">วันที่รับเข้า</span>
                    <p className="font-medium">{formatDate(trackingData.receiveDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ผู้รับเข้า</span>
                    <p className="font-medium">{trackingData.receiveBy}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Disbursement History */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold">ประวัติการจ่ายออก</h3>
              <p className="text-sm text-muted-foreground">
                รายการใบจ่ายออกที่ใช้ QR Code นี้
              </p>
            </div>

            {trackingData.disbursements.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                ยังไม่เคยมีการจ่ายออกจาก QR Code นี้
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่ใบจ่าย</TableHead>
                    <TableHead>วันที่จ่าย</TableHead>
                    <TableHead>จำนวนที่จ่าย</TableHead>
                    <TableHead>ผู้จ่าย</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingData.disbursements.map((d) => (
                    <TableRow key={d.disbursementNo}>
                      <TableCell className="font-mono font-medium">{d.disbursementNo}</TableCell>
                      <TableCell>{formatDate(d.disbursementDate)}</TableCell>
                      <TableCell>
                        <span className="text-destructive font-medium">
                          -{formatNumber(d.disbursedQuantity)}
                        </span>
                      </TableCell>
                      <TableCell>{d.disbursedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
