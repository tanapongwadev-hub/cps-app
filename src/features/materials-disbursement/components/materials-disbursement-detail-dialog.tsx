"use client";

import * as React from "react";
import {
  AlertCircle,
  Check,
  ClipboardList,
  Download,
  Package,
  Scissors,
  X,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  DisbursementStatus,
  DisbursementType,
  MaterialsDisbursementDetail,
} from "../api/materials-disbursement-api";

const STATUS_LABELS: Record<DisbursementStatus, string> = {
  draft: "ฉบับร่าง",
  confirmed: "ยืนยันแล้ว",
  cancelled: "ยกเลิก",
};

const TYPE_LABELS: Record<DisbursementType, string> = {
  stock_cut: "ตัดสต็อก",
  production: "เบิกเพื่อผลิต",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

export interface MaterialsDisbursementDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disbursement: MaterialsDisbursementDetail | null;
  isLoading?: boolean;
}

export function MaterialsDisbursementDetailDialog({
  open,
  onOpenChange,
  disbursement,
  isLoading,
}: MaterialsDisbursementDetailDialogProps) {
  if (isLoading || !disbursement) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Skeleton className="h-6 w-40" />
          </DialogHeader>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusBadge = (status: DisbursementStatus) => {
    const variants: Record<DisbursementStatus, "default" | "success" | "destructive" | "secondary" | "warning"> = {
      draft: "secondary",
      confirmed: "success",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status]}>{STATUS_LABELS[status]}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="font-mono text-lg">
                {disbursement.disbursementNo}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {formatDate(disbursement.disbursementDate)} ·{" "}
                {TYPE_LABELS[disbursement.disbursementType]}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {statusBadge(disbursement.status)}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">ข้อมูลใบจ่าย</TabsTrigger>
            <TabsTrigger value="items">รายการวัสดุ</TabsTrigger>
            <TabsTrigger value="packages">
              QR Packages ({disbursement.packages?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="ประเภท" value={TYPE_LABELS[disbursement.disbursementType]} />
              <InfoRow label="วันที่จ่ายออก" value={formatDate(disbursement.disbursementDate)} />
              <InfoRow label="สถานะ" value={STATUS_LABELS[disbursement.status]} />
              <InfoRow label="สร้างเมื่อ" value={formatDateTime(disbursement.createdAt)} />
            </div>

            {disbursement.reason && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">เหตุผลการตัดสต็อก</span>
                <div className="flex items-start gap-2 rounded-md border bg-warning/5 border-warning/20 p-3">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm">{disbursement.reason}</p>
                </div>
              </div>
            )}

            {disbursement.attachmentUrl && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">เอกสารแนบ</span>
                <a
                  href={disbursement.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {disbursement.attachmentName ?? "ดาวน์โหลดไฟล์"}
                </a>
              </div>
            )}

            {disbursement.remark && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">หมายเหตุ</span>
                <p className="text-sm rounded-md border p-3">{disbursement.remark}</p>
              </div>
            )}

            <Separator />

            {/* Confirmation / Cancellation info */}
            {disbursement.status === "confirmed" && (
              <div className="rounded-md border border-success/20 bg-success/5 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <Check className="h-4 w-4" />
                  ยืนยันการจ่ายออกแล้ว
                </div>
                <p className="text-xs text-muted-foreground">
                  ณ. {formatDateTime(disbursement.confirmedAt ?? "")}
                </p>
              </div>
            )}

            {disbursement.status === "cancelled" && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <XCircle className="h-4 w-4" />
                  ยกเลิกแล้ว
                </div>
                <p className="text-xs text-muted-foreground">
                  {disbursement.cancelReason
                    ? `${disbursement.cancelReason} · ${formatDateTime(disbursement.cancelledAt ?? "")}`
                    : `ยกเลิกเมื่อ ${formatDateTime(disbursement.cancelledAt ?? "")}`}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="items" className="mt-4">
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {disbursement.items?.map((item, i) => (
                  <div key={item.id} className="rounded-lg border p-3 flex items-center gap-4">
                    <Badge variant="outline" className="shrink-0">#{i + 1}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {item.material?.code ?? "—"} — {item.material?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ขอจ่าย: {formatNumber(item.requestedQuantity)}
                        {disbursement.status === "confirmed" && (
                          <span className="ml-2">
                            | จ่ายจริง: <span className="font-medium">{formatNumber(item.disbursedQuantity)}</span>
                          </span>
                        )}
                      </p>
                    </div>
                    {disbursement.status === "confirmed" && (
                      <Badge
                        variant={
                          Number(item.disbursedQuantity) >= Number(item.requestedQuantity)
                            ? "success"
                            : "warning"
                        }
                        className="shrink-0"
                      >
                        {formatNumber(item.disbursedQuantity)} / {formatNumber(item.requestedQuantity)}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="packages" className="mt-4">
            <ScrollArea className="max-h-[400px]">
              {(!disbursement.packages || disbursement.packages.length === 0) ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  ยังไม่มีข้อมูล QR Packages
                </div>
              ) : (
                <div className="space-y-2">
                  {disbursement.packages.map((pkg, i) => (
                    <div key={pkg.id} className="rounded-lg border p-3 flex items-center gap-4">
                      <Badge variant="outline" className="shrink-0">#{i + 1}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-medium truncate">
                          {pkg.package?.lotDetailNo ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          QR: {pkg.package?.qrCode ?? "—"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {formatNumber(pkg.disbursedQuantity)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          จาก {formatNumber(pkg.package?.quantity ?? "0")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          pkg.package?.status === "issued" ? "destructive" : "secondary"
                        }
                        className="shrink-0"
                      >
                        {pkg.package?.status === "issued" ? "จ่ายหมด" : "คงเหลือ"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <p className="text-sm">{value}</p>
    </div>
  );
}
