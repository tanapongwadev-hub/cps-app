"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, Info, Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormSection } from "@/components/forms/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import type {
  CreateMaterialsReceivingPayload,
  MaterialsReceiving,
  MaterialsReceivingLookups,
  UpdateMaterialsReceivingPayload,
} from "../api/materials-receiving-api";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Preview of Internal Lot No. — เลข lot จริง generate โดย backend
 * ใช้สำหรับ placeholder ในฟอร์มเท่านั้น
 */
function previewInternalLotNo(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `CCI-${yyyy}${mm}${dd}-???`;
}

/** CEIL(receiveQuantity / packingQuantity) */
function computePackageCount(
  receiveQuantity: string,
  packingQuantity: number | null | undefined,
): number | null {
  if (!packingQuantity || packingQuantity < 1) return null;
  const qty = Number(receiveQuantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return Math.ceil(qty / packingQuantity);
}

/** คำนวณ breakdown ของ package เพื่อ preview */
function previewPackages(
  receiveQuantity: string,
  packingQuantity: number | null | undefined,
): { packageNo: number; quantity: number }[] | null {
  const count = computePackageCount(receiveQuantity, packingQuantity);
  if (count === null) return null;
  const qty = Number(receiveQuantity);
  const fullQty = packingQuantity as number;
  const packages: { packageNo: number; quantity: number }[] = [];
  let remaining = qty;
  for (let i = 1; i <= count; i += 1) {
    const value = i === count ? remaining : Math.min(fullQty, remaining);
    packages.push({ packageNo: i, quantity: value });
    remaining -= value;
  }
  return packages;
}

// ============================================================================
// Schema
// ============================================================================

const DECIMAL_REGEX = /^\d+(\.\d{1,4})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const IDEMPOTENCY_REGEX = /^[A-Za-z0-9_-]{8,80}$/;

const formSchema = z.object({
  materialId: z.string().min(1, "กรุณาเลือกวัสดุ"),
  supplierId: z.string().min(1, "กรุณาเลือกผู้จัดจำหน่าย"),
  receiveQuantity: z
    .string()
    .min(1, "กรุณากรอกจำนวนรับเข้า")
    .regex(DECIMAL_REGEX, "ต้องเป็นตัวเลขทศนิยมไม่เกิน 4 ตำแหน่ง"),
  supplierProductionDate: z
    .string()
    .min(1, "กรุณาเลือกวันที่ผลิตของ Supplier")
    .regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  receiveDate: z
    .string()
    .min(1, "กรุณาเลือกวันที่รับเข้า")
    .regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  packingQuantityOverride: z
    .string()
    .regex(DECIMAL_REGEX, "ต้องเป็นจำนวนเต็มบวก")
    .optional()
    .or(z.literal("")),
  idempotencyKey: z
    .string()
    .regex(IDEMPOTENCY_REGEX, "ต้องเป็น 8-80 ตัวอักษร (a-z, 0-9, -, _)")
    .optional()
    .or(z.literal("")),
  remark: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function getDefaultValues(
  receiving: MaterialsReceiving | null | undefined,
): FormValues {
  if (receiving) {
    return {
      materialId: receiving.materialId,
      supplierId: receiving.supplierId,
      receiveQuantity: receiving.receiveQuantity,
      supplierProductionDate: receiving.supplierProductionDate ?? "",
      receiveDate: receiving.receiveDate,
      packingQuantityOverride: "",
      idempotencyKey: receiving.idempotencyKey ?? "",
      remark: receiving.remark ?? "",
    };
  }
  const today = new Date().toISOString().slice(0, 10);
  return {
    materialId: "",
    supplierId: "",
    receiveQuantity: "",
    supplierProductionDate: today,
    receiveDate: today,
    packingQuantityOverride: "",
    idempotencyKey: "",
    remark: "",
  };
}

// ============================================================================
// Component
// ============================================================================

export interface MaterialsReceivingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiving?: MaterialsReceiving | null;
  lookups: MaterialsReceivingLookups;
  onSave: (
    payload: CreateMaterialsReceivingPayload | UpdateMaterialsReceivingPayload,
  ) => Promise<void>;
  savePending?: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง";
}

export function MaterialsReceivingFormDialog({
  open,
  onOpenChange,
  receiving,
  lookups,
  onSave,
  savePending,
}: MaterialsReceivingFormDialogProps) {
  const isEditing = !!receiving;
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(receiving),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(receiving));
      setServerError(null);
    }
  }, [open, receiving, form]);

  // Watch fields for live preview
  const watchMaterialId = form.watch("materialId");
  const watchQuantity = form.watch("receiveQuantity");
  const watchPackingOverride = form.watch("packingQuantityOverride");
  const watchProductionDate = form.watch("supplierProductionDate");

  // Find selected material for packing quantity
  const selectedMaterial = React.useMemo(
    () => lookups.materials.find((m) => m.id === watchMaterialId) ?? null,
    [lookups.materials, watchMaterialId],
  );

  const effectivePackingQuantity = React.useMemo(() => {
    const override = Number(watchPackingOverride);
    if (Number.isFinite(override) && override >= 1) {
      return Math.floor(override);
    }
    if (selectedMaterial?.packingQuantity && selectedMaterial.packingQuantity >= 1) {
      return selectedMaterial.packingQuantity;
    }
    return null;
  }, [watchPackingOverride, selectedMaterial]);

  const packages = React.useMemo(
    () => previewPackages(watchQuantity, effectivePackingQuantity),
    [watchQuantity, effectivePackingQuantity],
  );

  const supplierLotPreview = React.useMemo(() => {
    if (!watchProductionDate || !ISO_DATE.test(watchProductionDate)) return null;
    return `SUP-${watchProductionDate.replace(/-/g, "")}`;
  }, [watchProductionDate]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setServerError(null);

      const basePayload: CreateMaterialsReceivingPayload = {
        materialId: values.materialId,
        supplierId: values.supplierId,
        receiveQuantity: values.receiveQuantity,
        supplierProductionDate: values.supplierProductionDate,
        receiveDate: values.receiveDate,
        idempotencyKey: values.idempotencyKey || null,
        remark: values.remark || null,
      };

      if (values.packingQuantityOverride) {
        const override = Number(values.packingQuantityOverride);
        if (Number.isFinite(override) && override >= 1) {
          basePayload.packingQuantityOverride = Math.floor(override);
        }
      }

      let payload: CreateMaterialsReceivingPayload | UpdateMaterialsReceivingPayload =
        basePayload;

      if (isEditing && receiving) {
        const updatePayload: UpdateMaterialsReceivingPayload = {
          receiveQuantity: values.receiveQuantity,
          supplierProductionDate: values.supplierProductionDate,
          receiveDate: values.receiveDate,
          remark: values.remark || null,
          updatedAt: receiving.updatedAt,
        };
        if (values.packingQuantityOverride) {
          const override = Number(values.packingQuantityOverride);
          if (Number.isFinite(override) && override >= 1) {
            updatePayload.packingQuantityOverride = Math.floor(override);
          }
        }
        payload = updatePayload;
      }

      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `แก้ไขการรับเข้า ${receiving?.internalLotNo ?? ""}`
              : "สร้างรายการรับเข้าวัตถุดิบ"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "แก้ไขข้อมูลฉบับร่าง ระบบจะคำนวณจำนวนบรรจุภัณฑ์และ QR Code ใหม่"
              : "กรอกข้อมูลการรับเข้า ระบบจะสร้าง Internal Lot No. และ QR Code ให้อัตโนมัติ"}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {/* Lot preview banner */}
          <div className="rounded-md border border-dashed border-info/40 bg-info/5 p-3 text-sm flex items-center gap-3">
            <Info className="h-4 w-4 text-info shrink-0" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-muted-foreground">Internal Lot (ตัวอย่าง):</span>
              <code className="font-mono font-semibold text-info">
                {previewInternalLotNo()}
              </code>
              <span className="text-muted-foreground">Supplier Lot:</span>
              <code className="font-mono font-semibold">
                {supplierLotPreview ?? "—"}
              </code>
              {packages && (
                <>
                  <span className="text-muted-foreground">บรรจุภัณฑ์:</span>
                  <Badge variant="secondary">{packages.length} ใบ</Badge>
                </>
              )}
            </div>
          </div>

          {/* Material + Supplier */}
          <FormSection title="วัสดุและผู้จัดจำหน่าย">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="materialId">
                  วัสดุ <span className="text-danger">*</span>
                </Label>
                <select
                  id="materialId"
                  {...form.register("materialId")}
                  className={cn(
                    "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none",
                    form.formState.errors.materialId && "border-danger",
                  )}
                  disabled={isEditing}
                >
                  <option value="">เลือกวัสดุ</option>
                  {lookups.materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} — {m.name}
                      {m.packingQuantity
                        ? ` (${m.packingQuantity}/แพ็ก)`
                        : ""}
                    </option>
                  ))}
                </select>
                {form.formState.errors.materialId && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.materialId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supplierId">
                  ผู้จัดจำหน่าย <span className="text-danger">*</span>
                </Label>
                <select
                  id="supplierId"
                  {...form.register("supplierId")}
                  className={cn(
                    "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none",
                    form.formState.errors.supplierId && "border-danger",
                  )}
                  disabled={isEditing}
                >
                  <option value="">เลือกผู้จัดจำหน่าย</option>
                  {lookups.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.nameTh}
                    </option>
                  ))}
                </select>
                {form.formState.errors.supplierId && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.supplierId.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Quantity + Dates */}
          <FormSection title="จำนวนและวันที่">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="receiveQuantity">
                  จำนวนรับเข้า <span className="text-danger">*</span>
                </Label>
                <Input
                  id="receiveQuantity"
                  type="text"
                  inputMode="decimal"
                  placeholder="เช่น 1000"
                  {...form.register("receiveQuantity")}
                  className={cn(
                    form.formState.errors.receiveQuantity && "border-danger",
                  )}
                />
                {form.formState.errors.receiveQuantity && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.receiveQuantity.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="packingQuantityOverride">
                  Packing/แพ็ก (override)
                </Label>
                <Input
                  id="packingQuantityOverride"
                  type="number"
                  min="1"
                  step="1"
                  placeholder={
                    selectedMaterial?.packingQuantity
                      ? `ใช้ของวัสดุ: ${selectedMaterial.packingQuantity}`
                      : "ไม่ระบุ"
                  }
                  {...form.register("packingQuantityOverride")}
                />
                <p className="text-muted-foreground text-xs">
                  ปล่อยว่างเพื่อใช้ค่าจาก Material
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="supplierProductionDate">
                  วันที่ผลิตของ Supplier <span className="text-danger">*</span>
                </Label>
                <Input
                  id="supplierProductionDate"
                  type="date"
                  max={today}
                  {...form.register("supplierProductionDate")}
                  className={cn(
                    form.formState.errors.supplierProductionDate && "border-danger",
                  )}
                />
                {form.formState.errors.supplierProductionDate && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.supplierProductionDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="receiveDate">
                  วันที่รับเข้า <span className="text-danger">*</span>
                </Label>
                <Input
                  id="receiveDate"
                  type="date"
                  max={today}
                  {...form.register("receiveDate")}
                  className={cn(
                    form.formState.errors.receiveDate && "border-danger",
                  )}
                />
                {form.formState.errors.receiveDate && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.receiveDate.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Package Preview */}
          {packages && packages.length > 0 && (
            <FormSection title="ตัวอย่างการแบ่งบรรจุภัณฑ์">
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <Boxes className="h-4 w-4" />
                  รวม {packages.length} ใบ
                  {effectivePackingQuantity && (
                    <span className="text-muted-foreground">
                      · ใบสุดท้ายอาจมีจำนวนน้อยกว่า {effectivePackingQuantity}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 text-sm">
                  {packages.map((pkg) => (
                    <div
                      key={pkg.packageNo}
                      className="rounded border bg-background px-2 py-1.5 flex items-center justify-between"
                    >
                      <span className="text-muted-foreground">#{pkg.packageNo}</span>
                      <span className="font-semibold tabular-nums">
                        {pkg.quantity.toLocaleString("th-TH")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </FormSection>
          )}

          {/* Advanced */}
          <FormSection title="ขั้นสูง">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="idempotencyKey">Idempotency Key</Label>
                <Input
                  id="idempotencyKey"
                  type="text"
                  placeholder="เช่น order-20260809-001"
                  {...form.register("idempotencyKey")}
                  disabled={isEditing}
                />
                <p className="text-muted-foreground text-xs">
                  กันสร้างซ้ำจาก network retry (8-80 ตัวอักษร)
                </p>
                {form.formState.errors.idempotencyKey && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.idempotencyKey.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="remark">หมายเหตุ</Label>
                <Textarea
                  id="remark"
                  {...form.register("remark")}
                  placeholder="รายละเอียดเพิ่มเติม..."
                  rows={2}
                />
              </div>
            </div>
          </FormSection>

          {serverError && (
            <div className="rounded-md border border-danger/50 bg-danger/5 p-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={savePending}
            >
              <X className="h-4 w-4 mr-1" />
              ยกเลิก
            </Button>
            <Button type="submit" disabled={savePending}>
              <Save className="h-4 w-4 mr-1" />
              {savePending
                ? "กำลังบันทึก..."
                : isEditing
                  ? "บันทึกการแก้ไข"
                  : "สร้างรายการรับเข้า"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
