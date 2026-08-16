"use client";

import * as React from "react";
import {
  Box,
  Calendar,
  Check,
  Copy,
  Download,
  Factory,
  Package,
  QrCode,
  Scissors,
  Tag,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showToast } from "@/lib/toast";
import { cn } from "@/utils/cn";
import type {
  MaterialsReceivingDetail,
  MaterialsReceivingStatus,
} from "../api/materials-receiving-api";

export interface MaterialsReceivingDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiving?: MaterialsReceivingDetail | null;
  isLoading?: boolean;
  onConfirm?: (receiving: MaterialsReceivingDetail) => void;
  onCancel?: (receiving: MaterialsReceivingDetail) => void;
  onEdit?: (receiving: MaterialsReceivingDetail) => void;
  confirmPending?: boolean;
  cancelPending?: boolean;
}

function StatusBadge({ status }: { status: MaterialsReceivingStatus }) {
  const config = {
    draft: { label: "ฉบับร่าง", variant: "secondary" as const },
    confirmed: { label: "ยืนยันแล้ว", variant: "default" as const },
    cancelled: { label: "ยกเลิก", variant: "destructive" as const },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return String(value);
  }
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

function copyToClipboard(text: string, label: string) {
  if (!navigator?.clipboard) {
    showToast.error("เบราว์เซอร์ไม่รองรับการคัดลอก");
    return;
  }
  void navigator.clipboard
    .writeText(text)
    .then(() => showToast.success(`คัดลอก ${label} แล้ว`))
    .catch(() => showToast.error("คัดลอกไม่สำเร็จ"));
}

function downloadQrCode(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getQrCodeUrl(text: string, size: number = 100): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png`;
}

function PiecesQrGrid({
  piecesQty,
  ratio,
  baseInternalLotNo,
}: {
  piecesQty: number;
  ratio: number;
  baseInternalLotNo: string;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const INITIAL_SHOW = 20;
  const allLots = React.useMemo<{ lotNo: string; pkg: number; piece: number }[]>(() => {
    const result: { lotNo: string; pkg: number; piece: number }[] = [];
    for (let p = 1; p <= piecesQty; p++) {
      const pkg = Math.ceil(p / ratio);
      const pieceInPkg = p - (pkg - 1) * ratio;
      result.push({
        lotNo: `${baseInternalLotNo}-${String(pkg).padStart(3, "0")}-${String(pieceInPkg).padStart(3, "0")}`,
        pkg,
        piece: pieceInPkg,
      });
    }
    return result;
  }, [piecesQty, ratio, baseInternalLotNo]);

  const visible = showAll ? allLots : allLots.slice(0, INITIAL_SHOW);
  const hidden = allLots.length - INITIAL_SHOW;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {visible.map((item) => (
          <PiecesQrCard
            key={item.lotNo}
            lotNo={item.lotNo}
            onCopy={() => copyToClipboard(item.lotNo, "Lot No.")}
            onDownload={() => {
              const url = getQrCodeUrl(item.lotNo, 200);
              downloadQrCode(url, `${item.lotNo}.png`);
            }}
          />
        ))}
      </div>
      {!showAll && hidden > 0 && (
        <div className="mt-3 text-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAll(true)}
          >
            แสดงทั้งหมด ({allLots.length} ชิ้น)
          </Button>
        </div>
      )}
    </div>
  );
}

function PiecesQrCard({
  lotNo,
  onCopy,
  onDownload,
}: {
  lotNo: string;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const [imgSrc, setImgSrc] = React.useState<string>("");
  // Generate QR on mount
  React.useEffect(() => {
    setImgSrc(getQrCodeUrl(lotNo, 120));
  }, [lotNo]);
  return (
    <div className="min-w-0 rounded-md border bg-white p-2 flex flex-col items-center gap-1.5">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={`QR ${lotNo}`}
          width={120}
          height={120}
          className="block max-w-full h-auto"
        />
      ) : (
        <div className="h-[120px] w-[120px] grid place-items-center text-muted-foreground text-xs">
          ...
        </div>
      )}
      <div className="w-full min-w-0 text-xs font-mono text-center break-all px-1">{lotNo}</div>
      <div className="flex flex-col gap-1 w-full">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={onCopy}
        >
          <Copy className="h-3 w-3 mr-1" />
          คัดลอก Lot
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={onDownload}
        >
          <Download className="h-3 w-3 mr-1" />
          ดาวน์โหลด PNG
        </Button>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-b-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0 min-w-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={cn(
          "min-w-0 text-sm font-medium text-right break-words",
          mono && "font-mono"
        )}
      >
        {value || "—"}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function MaterialsReceivingDetailDialog({
  open,
  onOpenChange,
  receiving,
  isLoading,
  onConfirm,
  onCancel,
  onEdit,
  confirmPending,
  cancelPending,
}: MaterialsReceivingDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="materials-receiving-detail-dialog"
        className="grid w-[calc(100vw-1rem)] max-w-4xl max-h-[calc(100dvh-1rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 sm:p-6"
      >
        <DialogHeader className="px-4 pt-4 pr-12 sm:px-0 sm:pt-0">
          <DialogTitle className="flex items-center gap-2">
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              <>
                <span className="font-mono break-all">{receiving?.internalLotNo}</span>
                {receiving && <StatusBadge status={receiving.status} />}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 pb-4 sm:px-0 sm:pb-0">
        {isLoading ? (
          <DetailSkeleton />
        ) : !receiving ? (
          <div className="text-center text-muted-foreground py-8">
            ไม่พบข้อมูลการรับเข้า
          </div>
        ) : (
          <div className="space-y-6">
            {/* Document Info + QR Header */}
            <div className="grid gap-4 grid-cols-1">
              {/* Document Info — full width */}
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-base">ข้อมูลเอกสาร</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <InfoRow
                    icon={<Package className="h-4 w-4" />}
                    label="วัสดุ"
                    value={
                      receiving.material
                        ? `${receiving.material.code} — ${receiving.material.name}`
                        : "—"
                    }
                  />
                  <InfoRow
                    icon={<Truck className="h-4 w-4" />}
                    label="ผู้จัดจำหน่าย"
                    value={receiving.supplier?.nameTh ?? "—"}
                  />
                  <InfoRow
                    icon={<Calendar className="h-4 w-4" />}
                    label="วันที่รับเข้า"
                    value={formatDate(receiving.receiveDate)}
                  />
                  <InfoRow
                    icon={<Factory className="h-4 w-4" />}
                    label="วันที่ Supplier ผลิต"
                    value={formatDate(receiving.supplierProductionDate)}
                  />
                  <InfoRow
                    icon={<Tag className="h-4 w-4" />}
                    label="Supplier Lot"
                    value={<span className="break-all">{receiving.supplierLotNo ?? "—"}</span>}
                    mono
                  />
                  <InfoRow
                    icon={<Box className="h-4 w-4" />}
                    label="จำนวนรับเข้า"
                    value={`${formatNumber(receiving.receiveQuantity)} ${receiving.unit?.code ?? ""}`}
                  />
                  {receiving.materialType && receiving.materialType !== "PCS" && receiving.piecesQuantity && (
                    <InfoRow
                      icon={<Scissors className="h-4 w-4 text-primary" />}
                      label="ชิ้นที่ใช้ได้"
                      value={`${formatNumber(receiving.piecesQuantity)} ชิ้น`}
                    />
                  )}
                  {receiving.materialType && (
                    <InfoRow
                      icon={<Package className="h-4 w-4" />}
                      label="ประเภทวัสดุ"
                      value={`${receiving.materialType}${receiving.ratio ? ` (×${receiving.ratio})` : ""}`}
                    />
                  )}
                  <InfoRow
                    icon={<Box className="h-4 w-4" />}
                    label="Packing / แพ็ก"
                    value={formatNumber(receiving.packingQuantity)}
                  />
                  <InfoRow
                    icon={<Package className="h-4 w-4" />}
                    label="จำนวนบรรจุภัณฑ์"
                    value={`${receiving.packageCount} ใบ`}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Pieces QR (Set 2) — for PIPE/SHEET/COIL only */}
            {receiving.materialType &&
              receiving.materialType !== "PCS" &&
              receiving.piecesQrPayload && (
                <Card className="min-w-0 border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-base flex flex-wrap items-center gap-2">
                      <QrCode className="h-4 w-4 text-primary" />
                      QR Code ชุดที่ 2 — ชิ้นงาน
                      <Badge variant="outline" className="ml-auto text-xs">
                        {receiving.piecesQrPayload.piecesQuantity} ชิ้น
                        {receiving.ratio ? ` (×${receiving.ratio})` : ""}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PiecesQrGrid
                      piecesQty={Number(receiving.piecesQrPayload.piecesQuantity)}
                      ratio={receiving.ratio ?? 1}
                      baseInternalLotNo={receiving.piecesQrPayload.internalLotNo}
                    />
                  </CardContent>
                </Card>
              )}

            {/* Package Breakdown */}
            {receiving.packages && receiving.packages.length > 0 && (
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-base">
                    รายละเอียดบรรจุภัณฑ์ ({receiving.packages.length} ใบ)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {receiving.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="min-w-0 rounded-md border bg-white p-3 flex flex-col items-center gap-2"
                      >
                        {pkg.qrCode ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={pkg.qrCode}
                            alt={`QR for ${pkg.lotDetailNo ?? pkg.id}`}
                            width={140}
                            height={140}
                            className="block max-w-full h-auto"
                          />
                        ) : (
                          <div className="h-[140px] w-[140px] grid place-items-center text-muted-foreground text-xs">
                            ไม่มี QR
                          </div>
                        )}
                        <div className="w-full min-w-0 text-xs font-mono text-center break-all">
                          {pkg.lotDetailNo ?? `#${pkg.packageNo}`}
                        </div>
                        <div className="text-sm tabular-nums">
                          {formatNumber(pkg.quantity)}{" "}
                          {receiving.unit?.code ?? ""}
                        </div>
                        <div className="flex gap-1.5 w-full">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              pkg.lotDetailNo &&
                              copyToClipboard(pkg.lotDetailNo, "Lot Detail No.")
                            }
                            disabled={!pkg.lotDetailNo}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            คัดลอก
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              if (pkg.qrCode) {
                                downloadQrCode(
                                  pkg.qrCode,
                                  `${pkg.lotDetailNo ?? pkg.id}.png`,
                                );
                              }
                            }}
                            disabled={!pkg.qrCode}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            PNG
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audit trail */}
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-base">ประวัติการดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="สร้างโดย"
                  value={receiving.createdBy ?? "—"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="สร้างเมื่อ"
                  value={formatDateTime(receiving.createdAt)}
                />
                {receiving.confirmedBy && (
                  <>
                    <InfoRow
                      icon={<User className="h-4 w-4" />}
                      label="ยืนยันโดย"
                      value={receiving.confirmedBy}
                    />
                    <InfoRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="ยืนยันเมื่อ"
                      value={formatDateTime(receiving.confirmedAt)}
                    />
                  </>
                )}
                {receiving.cancelledBy && (
                  <>
                    <InfoRow
                      icon={<User className="h-4 w-4" />}
                      label="ยกเลิกโดย"
                      value={receiving.cancelledBy}
                    />
                    <InfoRow
                      icon={<Calendar className="h-4 w-4" />}
                      label="ยกเลิกเมื่อ"
                      value={formatDateTime(receiving.cancelledAt)}
                    />
                    <InfoRow
                      icon={<XCircle className="h-4 w-4" />}
                      label="เหตุผลการยกเลิก"
                      value={receiving.cancelReason ?? "—"}
                    />
                  </>
                )}
                {receiving.remark && (
                  <InfoRow
                    icon={<Tag className="h-4 w-4" />}
                    label="หมายเหตุ"
                    value={receiving.remark}
                  />
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div
              data-testid="materials-receiving-detail-actions"
              className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex-row sm:flex-wrap sm:justify-end sm:border-0 sm:bg-transparent sm:p-0"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-1" />
                ปิด
              </Button>
              {onEdit && receiving.status === "draft" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onEdit(receiving)}
                  className="w-full sm:w-auto"
                >
                  แก้ไข
                </Button>
              )}
              {onConfirm && receiving.status === "draft" && (
                <Button
                  type="button"
                  onClick={() => onConfirm(receiving)}
                  disabled={confirmPending}
                  className="w-full sm:w-auto"
                >
                  <Check className="h-4 w-4 mr-1" />
                  {confirmPending ? "กำลังยืนยัน..." : "ยืนยันรับเข้า"}
                </Button>
              )}
              {onCancel && receiving.status !== "cancelled" && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => onCancel(receiving)}
                  disabled={cancelPending}
                  className="w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {cancelPending ? "กำลังยกเลิก..." : "ยกเลิก"}
                </Button>
              )}
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
