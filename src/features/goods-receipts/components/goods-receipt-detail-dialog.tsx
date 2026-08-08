"use client";

import * as React from "react";
import {
  Calendar,
  FileCheck,
  FileX,
  Package,
  Paperclip,
  Truck,
  User,
  X,
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
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/utils/cn";
import type { GoodsReceiptDetail } from "../api/goods-receipts-api";

export interface GoodsReceiptDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string | null;
  isLoading?: boolean;
  receipt?: GoodsReceiptDetail | null;
  onPost?: (receipt: GoodsReceiptDetail) => void;
  onCancel?: (receipt: GoodsReceiptDetail) => void;
  postPending?: boolean;
  cancelPending?: boolean;
}

function StatusBadge({ status }: { status: GoodsReceiptDetail["status"] }) {
  const config = {
    draft: { label: "ฉบับร่าง", variant: "secondary" as const },
    posted: { label: "รับแล้ว", variant: "default" as const },
    cancelled: { label: "ยกเลิก", variant: "destructive" as const },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatNumber(value: string): string {
  try {
    return parseFloat(value).toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return value;
  }
}

export function GoodsReceiptDetailDialog({
  open,
  onOpenChange,
  receiptId,
  isLoading,
  receipt,
  onPost,
  onCancel,
  postPending,
  cancelPending,
}: GoodsReceiptDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            รายละเอียดรายการรับวัสดุ
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {isLoading || !receipt ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Info */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {receipt.receiptNo ?? "ฉบับร่าง"}
                  </CardTitle>
                  <StatusBadge status={receipt.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <Label className="text-muted-foreground">วันที่รับ</Label>
                      <p className="font-medium">{formatDate(receipt.receiptDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div>
                      <Label className="text-muted-foreground">ผู้จัดจำหน่าย</Label>
                      <p className="font-medium">
                        {receipt.supplier?.nameTh ?? "—"}
                      </p>
                      {receipt.supplier?.code && (
                        <p className="text-xs text-muted-foreground">
                          {receipt.supplier.code}
                        </p>
                      )}
                    </div>
                  </div>

                  {receipt.postedAt && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <Label className="text-muted-foreground">รับรองโดย</Label>
                        <p className="font-medium">
                          {receipt.postedBy ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(receipt.postedAt)}
                        </p>
                      </div>
                    </div>
                  )}

                  {receipt.cancelReason && (
                    <div className="flex items-start gap-2">
                      <FileX className="h-4 w-4 mt-0.5 text-danger" />
                      <div>
                        <Label className="text-danger">เหตุผลยกเลิก</Label>
                        <p className="font-medium text-danger">
                          {receipt.cancelReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {receipt.remark && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-3">
                    <Label className="text-muted-foreground">หมายเหตุ</Label>
                    <p className="mt-1">{receipt.remark}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  รายการวัสดุ ({receipt.items?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เลขที่ PO</TableHead>
                      <TableHead>เลขที่ใบส่งของ</TableHead>
                      <TableHead>วัสดุ</TableHead>
                      <TableHead>Lot No.</TableHead>
                      <TableHead className="text-right">ส่ง</TableHead>
                      <TableHead className="text-right">รับ</TableHead>
                      <TableHead className="text-right">ปฏิเสธ</TableHead>
                      <TableHead>สาเหตุ</TableHead>
                      <TableHead>วันผลิต</TableHead>
                      <TableHead>วันหมดอายุ</TableHead>
                      <TableHead>ไฟล์แนบ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.poNo ?? "—"}</TableCell>
                        <TableCell className="text-sm">
                          {item.noSupplierDocument
                            ? "ไม่มีใบส่งของ"
                            : item.supplierDocNo ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.materialName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.materialCode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{item.lotNo ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.qtyDelivered)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatNumber(item.qtyReceived)}
                        </TableCell>
                        <TableCell className="text-right">
                          {parseFloat(item.qtyRejected) > 0 ? (
                            <span className="text-danger">
                              {formatNumber(item.qtyRejected)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {item.rejectReason?.nameTh ?? "—"}
                          {item.rejectNote && (
                            <p className="text-xs text-muted-foreground">
                              {item.rejectNote}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.productionDate
                            ? formatDate(item.productionDate)
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {item.expiryDate ? formatDate(item.expiryDate) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.fileName ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Attachments */}
            {receipt.attachments && receipt.attachments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    ไฟล์แนบ ({receipt.attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {receipt.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2"
                      >
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{att.fileName}</span>
                        <Badge variant="outline" className="text-xs">
                          {att.docType}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              {receipt.status === "draft" && onPost && (
                <Button
                  variant="default"
                  onClick={() => onPost(receipt)}
                  disabled={postPending}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  {postPending ? "กำลังรับรอง..." : "รับรองเอกสาร"}
                </Button>
              )}
              {receipt.status === "posted" && onCancel && (
                <Button
                  variant="destructive"
                  onClick={() => onCancel(receipt)}
                  disabled={cancelPending}
                >
                  <FileX className="h-4 w-4 mr-2" />
                  {cancelPending ? "กำลังยกเลิก..." : "ยกเลิกเอกสาร"}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                ปิด
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
