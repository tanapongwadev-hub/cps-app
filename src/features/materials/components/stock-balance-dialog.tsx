"use client";

import * as React from "react";
import { Package, Scale, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { stockBalanceApi } from "@/features/materials/api/materials-api";
import type { Material } from "@/features/materials/api/materials-api";
import { showToast } from "@/lib/toast";

interface StockBalanceDialogProps {
  open: boolean;
  material: Material | null;
  onOpenChange: (open: boolean) => void;
}

export function StockBalanceDialog({
  open,
  material,
  onOpenChange,
}: StockBalanceDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [stockBalance, setStockBalance] = React.useState<{
    quantity: string;
    unitCode: string;
    unitNameTh: string;
    lastMovementAt: string | null;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !material) {
      setStockBalance(null);
      setError(null);
      return;
    }

    const fetchStockBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await stockBalanceApi.getByMaterialId(material.id);
        setStockBalance({
          quantity: response.quantity,
          unitCode: response.unitCode,
          unitNameTh: response.unitNameTh,
          lastMovementAt: response.lastMovementAt,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลสต็อกได้";
        setError(message);
        showToast(message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchStockBalance();
  }, [open, material]);

  const formatQuantity = (qty: string) => {
    const num = parseFloat(qty);
    if (isNaN(num)) return qty;
    return num.toLocaleString("th-TH", { maximumFractionDigits: 4 });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="size-5" />
            จำนวนคงเหลือ
          </DialogTitle>
        </DialogHeader>

        {material && (
          <div className="space-y-4">
            {/* Material Info */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 flex size-10 items-center justify-center rounded-lg">
                    <Package className="text-primary size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{material.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {material.code}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Balance */}
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : error ? (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4 text-center text-destructive">
                  {error}
                </CardContent>
              </Card>
            ) : stockBalance ? (
              <div className="space-y-3">
                {/* Quantity Card */}
                <Card className="border-border/60">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="bg-success/10 text-success flex size-12 items-center justify-center rounded-lg">
                      <Scale className="size-6" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        จำนวนคงเหลือ
                      </p>
                      <p className="text-3xl font-bold">
                        {formatQuantity(stockBalance.quantity)}
                        <span className="text-primary ml-2 text-lg font-medium">
                          {stockBalance.unitNameTh || stockBalance.unitCode}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Last Movement */}
                <Card className="border-border/60">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="bg-muted flex size-10 items-center justify-center rounded-lg">
                      <Clock className="text-muted-foreground size-4" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        อัปเดตล่าสุด
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(stockBalance.lastMovementAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-border/60">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground">
                    ไม่มีข้อมูลสต็อก
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
