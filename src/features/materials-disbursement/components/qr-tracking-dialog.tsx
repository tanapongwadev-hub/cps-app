"use client";

import * as React from "react";
import { Check, Package, QrCode, Scan, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { materialsDisbursementApi } from "../api/materials-disbursement-api";
import { useQuery } from "@tanstack/react-query";

interface QrTrackingResult {
  qrCode: string;
  lotDetailNo: string;
  materialCode: string;
  materialName: string;
  originalQuantity: string;
  remainingQuantity: string;
  status: string;
  disbursements: {
    disbursementNo: string;
    disbursementDate: string;
    disbursedQuantity: string;
  }[];
}

interface QrTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQrCode?: string;
}

function getQrCodeUrl(text: string, size: number = 120): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png`;
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "รอดำเนินการ",
  in_stock: "อยู่ในสต็อก",
  issued: "จ่ายออกแล้ว",
  damaged: "ชำรุด",
  returned: "คืนสต็อก",
};

export function QrTrackingDialog({ open, onOpenChange, initialQrCode }: QrTrackingDialogProps) {
  const [qrInput, setQrInput] = React.useState("");
  const [searchedQr, setSearchedQr] = React.useState<string | null>(null);

  // TODO: Wire up to a real QR lookup endpoint once backend provides it
  // For now, this is a placeholder structure
  const { data, isLoading, isError } = useQuery({
    queryKey: ["qr-tracking", searchedQr],
    queryFn: async () => {
      // Placeholder: in real implementation, call /materials-disbursement/qr/:qrCode
      // const res = await materialsDisbursementApi.getQrByCode(searchedQr!);
      // return res as QrTrackingResult;
      return null;
    },
    enabled: !!searchedQr,
  });

  const handleSearch = () => {
    if (qrInput.trim()) {
      setSearchedQr(qrInput.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // Status color
  const statusVariant = (status: string): "default" | "success" | "warning" | "destructive" | "secondary" => {
    switch (status) {
      case "in_stock": return "success";
      case "issued": return "destructive";
      case "damaged": return "warning";
      default: return "secondary";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <DialogTitle>ติดตาม QR Code</DialogTitle>
          </div>
          <DialogDescription>
            สแกนหรือกรอกเลข QR Code เพื่อดูสถานะและประวัติการจ่ายออก
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Scan className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="กรอกเลข QR Code หรือ Lot Detail No..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9 font-mono"
              />
            </div>
            <Button onClick={handleSearch} disabled={!qrInput.trim()}>
              ค้นหา
            </Button>
          </div>

          {/* Result area */}
          {isLoading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">ไม่พบ QR Code นี้ในระบบ</p>
            </div>
          )}

          {!searchedQr && !isLoading && (
            <div className="rounded-xl border-2 border-dashed border-muted flex flex-col items-center justify-center py-12 text-center">
              <QrCode className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                พิมพ์เลข QR หรือ Lot Detail No แล้วกดค้นหา
              </p>
            </div>
          )}

          {data === null && searchedQr && !isLoading && (
            <div className="rounded-lg border border-dashed border-muted flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">
                ไม่พบข้อมูลสำหรับ <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{searchedQr}</code>
              </p>
              <p className="text-xs text-muted-foreground">
                ฟีเจอร์ติดตาม QR กำลังรอ API endpoint
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
