"use client";

import * as React from "react";
import { Calculator, Camera, ImagePlus, Loader2, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type {
  Product,
  ProductImageUpload,
  ProductLookups,
  ProductPayload,
  UpdateProductPayload,
} from "../api/products-api";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  lookups: ProductLookups;
  onUploadImage: (file: File) => Promise<ProductImageUpload>;
  onSave: (payload: ProductPayload | UpdateProductPayload) => Promise<void>;
  savePending: boolean;
  uploadPending: boolean;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const EMPTY_FORM: ProductPayload = {
  code: "",
  name: "",
  unitId: "",
  modelId: "",
  customerId: "",
  locationId: "",
  productTypeId: "",
  deliveryTypeId: "",
  loadingPointId: "",
  processLineId: "",
  packing: 1,
  lotSize: 1,
  safetyStock: null,
  minStock: null,
  scale: "",
  productImagePath: null,
  isActive: true,
};

export function ProductFormModal({
  open,
  onOpenChange,
  product,
  lookups,
  onUploadImage,
  onSave,
  savePending,
  uploadPending,
}: ProductFormModalProps) {
  const [form, setForm] = React.useState<ProductPayload>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  // Tracks whether the user explicitly overrode safetyStock/minStock.
  // When false, the server's formula (safety = lotSize, min = packing)
  // will be applied; we surface that in the form preview as well.
  const [safetyOverridden, setSafetyOverridden] = React.useState(false);
  const [minOverridden, setMinOverridden] = React.useState(false);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);

  const revokeObjectUrl = React.useCallback(() => {
    if (!objectUrlRef.current) return;
    URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }, []);

  React.useEffect(() => {
    if (open) {
      revokeObjectUrl();
      setImageFile(null);
      setPreviewUrl(product?.productImagePath ?? null);
      setImageRemoved(false);
      setImageError(null);
      if (product) {
        setForm({
          code: product.code,
          name: product.name,
          unitId: product.unitId,
          modelId: product.modelId,
          customerId: product.customerId,
          locationId: product.locationId,
          productTypeId: product.productTypeId,
          deliveryTypeId: product.deliveryTypeId,
          loadingPointId: product.loadingPointId,
          processLineId: product.processLineId,
          packing: product.packing,
          lotSize: product.lotSize,
          safetyStock: product.safetyStock,
          minStock: product.minStock,
          scale: product.scale ?? "",
          productImagePath: product.productImagePath ?? "",
          isActive: product.isActive,
        });
        // Existing values: if they match the formula the user didn't override
        setSafetyOverridden(product.safetyStock !== product.lotSize);
        setMinOverridden(product.minStock !== product.packing);
      } else {
        setForm(EMPTY_FORM);
        setSafetyOverridden(false);
        setMinOverridden(false);
      }
      setErrors({});
    }
  }, [open, product, revokeObjectUrl]);

  React.useEffect(() => revokeObjectUrl, [revokeObjectUrl]);

  const set = (key: keyof ProductPayload, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  // Live preview of the formula the server will apply
  const previewSafety = safetyOverridden
    ? form.safetyStock ?? 0
    : form.lotSize;
  const previewMin = minOverridden
    ? form.minStock ?? 0
    : form.packing;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "กรุณากรอกรหัสสินค้า";
    if (!form.name.trim()) errs.name = "กรุณากรอกชื่อสินค้า";
    if (!form.unitId) errs.unitId = "กรุณาเลือกหน่วยนับ";
    if (!form.modelId) errs.modelId = "กรุณาเลือกโมเดล";
    if (!form.customerId) errs.customerId = "กรุณาเลือกลูกค้า";
    if (!form.locationId) errs.locationId = "กรุณาเลือกคลัง";
    if (!form.productTypeId) errs.productTypeId = "กรุณาเลือกประเภทสินค้า";
    if (!form.deliveryTypeId) errs.deliveryTypeId = "กรุณาเลือกประเภทการจัดส่ง";
    if (!form.loadingPointId) errs.loadingPointId = "กรุณาเลือกจุดขนถ่าย";
    if (!form.processLineId) errs.processLineId = "กรุณาเลือกสายการผลิต";
    if (form.packing < 1) errs.packing = "ต้อง ≥ 1";
    if (form.lotSize < 1) errs.lotSize = "ต้อง ≥ 1";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const selectImage = (file: File | undefined) => {
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) {
      setImageError("รองรับเฉพาะไฟล์ JPEG, PNG หรือ WebP");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("รูปต้องมีขนาดไม่เกิน 5 MiB");
      return;
    }
    revokeObjectUrl();
    const nextPreviewUrl = URL.createObjectURL(file);
    objectUrlRef.current = nextPreviewUrl;
    setImageFile(file);
    setPreviewUrl(nextPreviewUrl);
    setImageRemoved(false);
    setImageError(null);
  };

  const removeImage = () => {
    revokeObjectUrl();
    setImageFile(null);
    setPreviewUrl(null);
    setImageRemoved(!!product?.productImagePath);
    setImageError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      let productImagePath = imageRemoved
        ? null
        : (product?.productImagePath ?? null);
      if (imageFile) {
        const uploaded = await onUploadImage(imageFile);
        productImagePath = uploaded.imagePath;
      }
      // Drop the formula values if not overridden so the server recomputes
      const submitForm: ProductPayload = {
        ...form,
        productImagePath,
        safetyStock: safetyOverridden ? form.safetyStock : null,
        minStock: minOverridden ? form.minStock : null,
      };
      const payload: ProductPayload | UpdateProductPayload = product
        ? { ...submitForm, updatedAt: product.updatedAt }
        : submitForm;
      await onSave(payload);
    } catch {
      // Upload/save mutations surface their own toast and keep the form open.
    }
  };

  const isEditing = !!product;
  const pending = savePending || uploadPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `แก้ไขข้อมูลสินค้า ${product.code}`
              : "กรอกข้อมูลเพื่อสร้างสินค้าใหม่ — Safety stock = lotSize, Min stock = packing (สูตรคำนวณอัตโนมัติ)"}
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
          {/* Row 1: Code + Name */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">รหัสสินค้า *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="PRD-001"
                disabled={isEditing}
                className={errors.code ? "border-destructive" : ""}
              />
              {errors.code && <p className="text-destructive text-xs">{errors.code}</p>}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">ชื่อสินค้า *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="เพลาขับหลัง / Rear Drive Shaft"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>
          </div>

          {/* Row 2: Unit + Product Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>หน่วยนับ *</Label>
              <Select value={form.unitId} onValueChange={(v) => set("unitId", v)}>
                <SelectTrigger className={errors.unitId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกหน่วย" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nameTh} ({u.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unitId && <p className="text-destructive text-xs">{errors.unitId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทสินค้า *</Label>
              <Select value={form.productTypeId} onValueChange={(v) => set("productTypeId", v)}>
                <SelectTrigger className={errors.productTypeId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.productTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.nameTh} ({pt.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productTypeId && <p className="text-destructive text-xs">{errors.productTypeId}</p>}
            </div>
          </div>

          {/* Row 3: Product Model + Customer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>โมเดลสินค้า *</Label>
              <Select value={form.modelId} onValueChange={(v) => set("modelId", v)}>
                <SelectTrigger className={errors.modelId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกโมเดล" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.productModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nameTh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.modelId && <p className="text-destructive text-xs">{errors.modelId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>ลูกค้า *</Label>
              <Select value={form.customerId} onValueChange={(v) => set("customerId", v)}>
                <SelectTrigger className={errors.customerId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nameTh}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && <p className="text-destructive text-xs">{errors.customerId}</p>}
            </div>
          </div>

          {/* Row 4: Location + Delivery Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>ที่ตั้งคลัง *</Label>
              <Select value={form.locationId} onValueChange={(v) => set("locationId", v)}>
                <SelectTrigger className={errors.locationId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกคลัง" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nameTh} ({l.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.locationId && <p className="text-destructive text-xs">{errors.locationId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>ประเภทการจัดส่ง *</Label>
              <Select value={form.deliveryTypeId} onValueChange={(v) => set("deliveryTypeId", v)}>
                <SelectTrigger className={errors.deliveryTypeId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกการจัดส่ง" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.deliveryTypes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nameTh} ({d.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deliveryTypeId && <p className="text-destructive text-xs">{errors.deliveryTypeId}</p>}
            </div>
          </div>

          {/* Row 5: Loading Point + Process Line */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>จุดขนถ่าย *</Label>
              <Select value={form.loadingPointId} onValueChange={(v) => set("loadingPointId", v)}>
                <SelectTrigger className={errors.loadingPointId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกจุดขนถ่าย" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.loadingPoints.map((lp) => (
                    <SelectItem key={lp.id} value={lp.id}>
                      {lp.nameTh} ({lp.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.loadingPointId && <p className="text-destructive text-xs">{errors.loadingPointId}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>สายการผลิต *</Label>
              <Select value={form.processLineId} onValueChange={(v) => set("processLineId", v)}>
                <SelectTrigger className={errors.processLineId ? "border-destructive" : ""}>
                  <SelectValue placeholder="เลือกสายการผลิต" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.processLines.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {pl.nameTh} ({pl.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.processLineId && <p className="text-destructive text-xs">{errors.processLineId}</p>}
            </div>
          </div>

          {/* Row 6: Packing + Lot Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="packing">จำนวนบรรจุ (ชิ้น/pack) *</Label>
              <Input
                id="packing"
                type="number"
                min={1}
                value={form.packing}
                onChange={(e) => set("packing", e.target.value ? Number(e.target.value) : 1)}
                className={errors.packing ? "border-destructive" : ""}
              />
              {errors.packing && <p className="text-destructive text-xs">{errors.packing}</p>}
              <p className="text-muted-foreground text-xs">ใช้คำนวณ min stock = packing</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lotSize">Lot size (ชิ้น/lot) *</Label>
              <Input
                id="lotSize"
                type="number"
                min={1}
                value={form.lotSize}
                onChange={(e) => set("lotSize", e.target.value ? Number(e.target.value) : 1)}
                className={errors.lotSize ? "border-destructive" : ""}
              />
              {errors.lotSize && <p className="text-destructive text-xs">{errors.lotSize}</p>}
              <p className="text-muted-foreground text-xs">ใช้คำนวณ safety stock = lot size</p>
            </div>
          </div>

          {/* Row 7: Safety Stock + Min Stock (with override toggle) */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="size-4" />
              <span>สต็อกคำนวณอัตโนมัติ (override ได้)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="safetyStock">Safety stock</Label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={safetyOverridden}
                      onChange={(e) => {
                        setSafetyOverridden(e.target.checked);
                        if (e.target.checked) set("safetyStock", form.lotSize);
                      }}
                    />
                    override
                  </label>
                </div>
                <Input
                  id="safetyStock"
                  type="number"
                  min={0}
                  disabled={!safetyOverridden}
                  value={safetyOverridden ? form.safetyStock ?? 0 : previewSafety}
                  onChange={(e) =>
                    set("safetyStock", e.target.value ? Number(e.target.value) : 0)
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {safetyOverridden
                    ? "ใช้ค่าที่กรอก"
                    : `คำนวณจาก lotSize = ${form.lotSize}`}
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="minStock">Min stock</Label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={minOverridden}
                      onChange={(e) => {
                        setMinOverridden(e.target.checked);
                        if (e.target.checked) set("minStock", form.packing);
                      }}
                    />
                    override
                  </label>
                </div>
                <Input
                  id="minStock"
                  type="number"
                  min={0}
                  disabled={!minOverridden}
                  value={minOverridden ? form.minStock ?? 0 : previewMin}
                  onChange={(e) =>
                    set("minStock", e.target.value ? Number(e.target.value) : 0)
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {minOverridden
                    ? "ใช้ค่าที่กรอก"
                    : `คำนวณจาก packing = ${form.packing}`}
                </p>
              </div>
            </div>
          </div>

          {/* Row 8: Scale */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="scale">Scale / อัตราส่วน</Label>
              <Input
                id="scale"
                value={form.scale ?? ""}
                onChange={(e) => set("scale", e.target.value)}
                placeholder="1:10"
              />
            </div>
          </div>

          {/* Product image */}
          <div className="space-y-2">
            <Label>รูปภาพสินค้า</Label>
            <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
              <input
                id="product-image"
                aria-label="เลือกรูปสินค้า"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={pending}
                onChange={(event) => {
                  selectImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <Label
                htmlFor="product-image"
                className={`bg-background hover:bg-accent flex h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
                  previewUrl ? "border-primary/50" : "border-border"
                }`}
              >
                {previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="ตัวอย่างรูปสินค้า"
                      className="h-24 w-24 rounded-lg border bg-white object-contain"
                    />
                    <span className="text-muted-foreground text-xs">
                      คลิกเพื่อเปลี่ยนรูป
                    </span>
                  </>
                ) : (
                  <>
                    <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
                      <Camera className="text-muted-foreground size-5" />
                    </div>
                    <span className="text-sm font-medium">คลิกเพื่อเลือกรูป</span>
                    <span className="text-muted-foreground text-xs">
                      JPEG, PNG หรือ WebP · สูงสุด 5 MiB
                    </span>
                  </>
                )}
              </Label>
              {imageError && (
                <p className="text-destructive text-xs">{imageError}</p>
              )}
              {previewUrl && (
                <div className="bg-muted/50 flex items-center justify-between rounded-lg p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <ImagePlus className="text-muted-foreground size-4 shrink-0" />
                    <span className="truncate text-sm">
                      {imageFile?.name ?? "รูปปัจจุบัน"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label="ลบรูปสินค้า"
                    onClick={removeImage}
                    disabled={pending}
                    className="text-muted-foreground hover:text-destructive h-7 text-xs"
                  >
                    ลบ
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Active Switch (edit only) */}
          {isEditing && (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Switch
                id="isActive"
                checked={form.isActive ?? false}
                onCheckedChange={(v) => set("isActive", v)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                เปิดใช้งาน
              </Label>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "สร้างสินค้า"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
