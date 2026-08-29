"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "../api/products-api";

interface ProductStatusDialogProps {
  open: boolean;
  product: Product | null;
  action: "deactivate" | "restore";
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
}

export function ProductStatusDialog({
  open,
  product,
  action,
  onOpenChange,
  onConfirm,
  pending,
}: ProductStatusDialogProps) {
  if (!product) return null;

  const isDeactivate = action === "deactivate";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isDeactivate ? (
              <AlertTriangle className="text-destructive size-5" />
            ) : (
              <CheckCircle2 className="text-success size-5" />
            )}
            {isDeactivate ? "ปิดใช้งานสินค้า" : "กู้คืนสินค้า"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDeactivate ? (
              <>
                ต้องการปิดใช้งาน <strong>{product.name}</strong> ({product.code}) หรือไม่?
                <br />
                สินค้าที่ปิดใช้งานจะไม่แสดงในรายการหลัก
              </>
            ) : (
              <>
                ต้องการกู้คืน <strong>{product.name}</strong> ({product.code}) หรือไม่?
                <br />
                สินค้าจะกลับมาแสดงในรายการอีกครั้ง
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>ยกเลิก</AlertDialogCancel>
          <Button
            variant={isDeactivate ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={pending}
            className="gap-2"
          >
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            {isDeactivate ? "ปิดใช้งาน" : "กู้คืน"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
