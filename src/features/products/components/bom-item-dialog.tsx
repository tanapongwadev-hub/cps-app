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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMaterials, useMaterialLookups } from "@/features/materials/hooks/use-materials";
import type { CreateBomItemPayload } from "../api/products-api";

interface BomItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: CreateBomItemPayload) => Promise<void>;
  pending: boolean;
}

export function BomItemDialog({ open, onOpenChange, onSave, pending }: BomItemDialogProps) {
  const lookupsQuery = useMaterialLookups();
  const materialsQuery = useMaterials({ page: 1, pageSize: 1000 });
  const materials = materialsQuery.data?.items ?? [];
  const units = lookupsQuery.data?.units ?? [];

  const [materialId, setMaterialId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [unitId, setUnitId] = React.useState("");
  const [isScrap, setIsScrap] = React.useState(false);
  const [wastagePercent, setWastagePercent] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      setMaterialId("");
      setQuantity("");
      setUnitId("");
      setIsScrap(false);
      setWastagePercent("");
      setRemark("");
      setErrors({});
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!materialId) errs.materialId = "กรุณาเลือกวัตถุดิบ";
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0)
      errs.quantity = "กรุณากรอกจำนวนที่ถูกต้อง";
    if (!unitId) errs.unitId = "กรุณาเลือกหน่วย";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await onSave({
      materialId,
      quantity: Number(quantity),
      unitId,
      isScrap,
      wastagePercent: wastagePercent ? Number(wastagePercent) : null,
      remark: remark || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มวัตถุดิบลงใน BOM</DialogTitle>
          <DialogDescription>
            ระบุวัตถุดิบและจำนวนที่ใช้ต่อชิ้นสินค้า
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
          {/* Material */}
          <div className="space-y-1.5">
            <Label>วัตถุดิบ *</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger className={errors.materialId ? "border-destructive" : ""}>
                <SelectValue placeholder="เลือกวัตถุดิบ" />
              </SelectTrigger>
              <SelectContent>
                {materialsQuery.isLoading ? (
                  <div className="p-2 text-center text-muted-foreground text-xs">
                    กำลังโหลด...
                  </div>
                ) : (
                  materials.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.code} — {m.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.materialId && (
              <p className="text-destructive text-xs">{errors.materialId}</p>
            )}
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">จำนวน *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.0001"
                step="0.0001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.0000"
                className={errors.quantity ? "border-destructive" : ""}
              />
              {errors.quantity && (
                <p className="text-destructive text-xs">{errors.quantity}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>หน่วย *</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger className={errors.unitId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกหน่วย" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nameTh} ({u.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitId && (
                <p className="text-destructive text-xs">{errors.unitId}</p>
              )}
            </div>
          </div>

          {/* Wastage */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="wastagePercent">% ของเสีย</Label>
              <Input
                id="wastagePercent"
                type="number"
                min={0}
                max={100}
                value={wastagePercent}
                onChange={(e) => setWastagePercent(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={isScrap} onCheckedChange={setIsScrap} />
                <span className="text-sm">เป็นของเสีย</span>
              </label>
            </div>
          </div>

          {/* Remark */}
          <div className="space-y-1.5">
            <Label htmlFor="remark">หมายเหตุ</Label>
            <Input
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending || materialsQuery.isLoading}>
              {pending ? "กำลังเพิ่ม..." : "เพิ่มวัตถุดิบ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
