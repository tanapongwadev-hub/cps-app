"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/lib/toast";
import type {
  ProductBom,
} from "../api/products-api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BomFormOnSave = (payload: any) => Promise<void>;

interface BomFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  bom?: ProductBom | null;
  onSave: BomFormOnSave;
  savePending: boolean;
}

export function BomFormModal({
  open,
  onOpenChange,
  productId,
  bom,
  onSave,
  savePending,
}: BomFormModalProps) {
  const [specification, setSpecification] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [effectiveFrom, setEffectiveFrom] = React.useState("");
  const [effectiveTo, setEffectiveTo] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      if (bom) {
        setSpecification(bom.specification ?? "");
        setRemark(bom.remark ?? "");
        setEffectiveFrom(bom.effectiveFrom ? bom.effectiveFrom.split("T")[0] ?? "" : "");
        setEffectiveTo(bom.effectiveTo ? bom.effectiveTo.split("T")[0] ?? "" : "");
      } else {
        setSpecification("");
        setRemark("");
        setEffectiveFrom("");
        setEffectiveTo("");
      }
      setErrors({});
    }
  }, [open, bom]);

  const isEditing = !!bom;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await onSave({
          specification: specification || null,
          remark: remark || null,
          effectiveFrom: effectiveFrom || null,
          effectiveTo: effectiveTo || null,
          updatedAt: bom.updatedAt,
        });
      } else {
        await onSave({
          productId,
          specification: specification || null,
          remark: remark || null,
          effectiveFrom: effectiveFrom || null,
          effectiveTo: effectiveTo || null,
          items: [],
        });
      }
    } catch {
      // Error handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `แก้ไข BOM ${bom!.version}` : "สร้าง BOM ใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูล BOM สำหรับวัสดุทดแทน"
              : `สร้าง BOM เวอร์ชันใหม่ สำหรับ Product ${productId}`}
          </DialogDescription>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground absolute right-4 top-4"
          >
            <X className="size-4" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="specification">สเปค/ข้อกำหนด</Label>
            <Textarea
              id="specification"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="BOM สำหรับ..."
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remark">หมายเหตุ</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="effectiveFrom">วันที่เริ่มใช้งาน</Label>
              <Input
                id="effectiveFrom"
                type="date"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="effectiveTo">วันที่สิ้นสุด</Label>
              <Input
                id="effectiveTo"
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
              />
            </div>
          </div>

          {!isEditing && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-amber-700 dark:text-amber-300 text-xs">
                <strong>หมายเหตุ:</strong> หลังสร้าง BOM ใหม่ คุณสามารถเพิ่มวัตถุดิบได้จากหน้า BOM
                version นั้นๆ
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={savePending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={savePending}>
              {savePending ? "กำลังบันทึก..." : isEditing ? "บันทึก" : "สร้าง BOM"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
