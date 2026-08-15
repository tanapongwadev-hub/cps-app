"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Boxes,
  FileText,
  Info,
  Paperclip,
  Save,
  Scissors,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
  MaterialsReceivingMaterialShape,
  MaterialsReceivingSupplier,
  UpdateMaterialsReceivingPayload,
} from "../api/materials-receiving-api";
import { materialsReceivingApi } from "../api/materials-receiving-api";

// ============================================================================
// Constants
// ============================================================================

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MiB
const ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const SHAPES_REQUIRING_RATIO: ReadonlySet<MaterialsReceivingMaterialShape> = new Set([
  "PIPE",
  "SHEET",
  "COIL",
]);

function materialShapeRequiresRatio(
  shape: MaterialsReceivingMaterialShape | null,
): boolean {
  if (!shape) return false;
  return SHAPES_REQUIRING_RATIO.has(shape);
}

// ============================================================================
// Helpers
// ============================================================================

function previewInternalLotNo(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `CCI-${yyyy}${mm}${dd}-???`;
}

function computePackageCount(
  receiveQuantity: string,
  packingQuantity: number | null | undefined,
): number | null {
  if (!packingQuantity || packingQuantity < 1) return null;
  const qty = Number(receiveQuantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return Math.ceil(qty / packingQuantity);
}

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

/** คำนวณ piecesQuantity = receiveQuantity × ratio (สำหรับ PIPE/SHEET/COIL เท่านั้น) */
function computePiecesQuantity(
  receiveQuantity: string,
  shape: MaterialsReceivingMaterialShape | null,
  ratio: number | null | undefined,
): number | null {
  if (!materialShapeRequiresRatio(shape)) return null;
  if (!ratio || ratio < 1) return null;
  const qty = Number(receiveQuantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return qty * ratio;
}

// ============================================================================
// Schema
// ============================================================================

const DECIMAL_REGEX = /^\d+(\.\d{1,4})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PO_NO_REGEX = /^[A-Za-z0-9_/ \-]{1,30}$/;

const formSchema = z
  .object({
    poNo: z
      .string()
      .max(30, "เลขที่ PO ยาวเกิน 30 ตัวอักษร")
      .regex(PO_NO_REGEX, "รูปแบบเลขที่ PO ไม่ถูกต้อง")
      .optional()
      .or(z.literal("")),
    materialId: z.string().min(1, "กรุณาเลือกวัสดุ"),
    supplierId: z.string().optional(),
    receiveQuantity: z
      .string()
      .min(1, "กรุณากรอกจำนวนรับเข้า")
      .regex(DECIMAL_REGEX, "ต้องเป็นตัวเลขทศนิยมไม่เกิน 4 ตำแหน่ง"),
    ratioOverride: z
      .string()
      .regex(DECIMAL_REGEX, "ratio ต้องเป็นจำนวนเต็มบวก")
      .optional()
      .or(z.literal("")),
    packingQuantityOverride: z
      .string()
      .regex(DECIMAL_REGEX, "ต้องเป็นจำนวนเต็มบวก")
      .optional()
      .or(z.literal("")),
    supplierProductionDate: z
      .string()
      .min(1, "กรุณาเลือกวันที่ผลิตของ Supplier")
      .regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
    receiveDate: z
      .string()
      .min(1, "กรุณาเลือกวันที่รับเข้า")
      .regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
    remark: z.string().optional(),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
  });

type FormValues = z.infer<typeof formSchema>;

function getDefaultValues(
  receiving: MaterialsReceiving | null | undefined,
): FormValues {
  if (receiving) {
    return {
      poNo: receiving.poNo ?? "",
      materialId: receiving.materialId,
      supplierId: receiving.supplierId,
      receiveQuantity: receiving.receiveQuantity,
      ratioOverride: "",
      packingQuantityOverride: "",
      supplierProductionDate: receiving.supplierProductionDate ?? "",
      receiveDate: receiving.receiveDate,
      remark: receiving.remark ?? "",
      attachmentUrl: receiving.attachmentUrl ?? "",
      attachmentName: receiving.attachmentName ?? "",
    };
  }
  const today = new Date().toISOString().slice(0, 10);
  return {
    poNo: "",
    materialId: "",
    supplierId: "",
    receiveQuantity: "",
    ratioOverride: "",
    packingQuantityOverride: "",
    supplierProductionDate: today,
    receiveDate: today,
    remark: "",
    attachmentUrl: "",
    attachmentName: "",
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
  onUploadAttachment?: (file: File) => Promise<{ url: string; name: string }>;
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
  onUploadAttachment,
}: MaterialsReceivingFormDialogProps) {
  const isEditing = !!receiving;
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = React.useState<File | null>(null);
  const [attachmentUploading, setAttachmentUploading] = React.useState(false);
  const [attachmentRemoved, setAttachmentRemoved] = React.useState(false);
  const attachmentInputRef = React.useRef<HTMLInputElement>(null);

  const [materialSuppliers, setMaterialSuppliers] = React.useState<
    MaterialsReceivingSupplier[]
  >([]);
  const [suppliersLoading, setSuppliersLoading] = React.useState(false);
  const autoSelectedSupplier = React.useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(receiving),
  });

  React.useEffect(() => {
    if (open) {
      // For edit mode: pre-populate materialSuppliers BEFORE form.reset() so
      // React never renders with materialSuppliers=[] and supplierId="sup-001".
      // This prevents the controlled→uncontrolled warning.
      if (isEditing && receiving?.materialId) {
        const currentSupplier = lookups.suppliers.find(
          (s) => s.id === receiving.supplierId,
        );
        setMaterialSuppliers(currentSupplier ? [currentSupplier] : []);
        setSuppliersLoading(true);
      } else {
        setMaterialSuppliers([]);
        setSuppliersLoading(false);
      }
      // form.reset must come AFTER setMaterialSuppliers so the first render
      // always has a valid supplier list for the <select> options.
      form.reset(getDefaultValues(receiving));
      setServerError(null);
      autoSelectedSupplier.current = false;
      setAttachmentFile(null);
      setAttachmentRemoved(false);

      // Fetch filtered supplier list after state is pre-populated.
      if (isEditing && receiving?.materialId) {
        materialsReceivingApi
          .getSuppliersByMaterial(receiving.materialId)
          .then((list) => {
            setMaterialSuppliers(list ?? []);
          })
          .catch(() => {});
      }
    }
  }, [open, receiving, form, isEditing]);

  const watchMaterialId = form.watch("materialId");
  const watchQuantity = form.watch("receiveQuantity");
  const watchRatioOverride = form.watch("ratioOverride");
  const watchPackingOverride = form.watch("packingQuantityOverride");
  const watchProductionDate = form.watch("supplierProductionDate");
  const watchAttachmentUrl = form.watch("attachmentUrl");
  const watchAttachmentName = form.watch("attachmentName");

  // Fetch suppliers when material changes
  React.useEffect(() => {
    if (isEditing || !watchMaterialId) {
      setMaterialSuppliers([]);
      return;
    }
    let cancelled = false;
    setSuppliersLoading(true);
    materialsReceivingApi
      .getSuppliersByMaterial(watchMaterialId)
      .then((list) => {
        if (cancelled) return;
        const suppliers = list ?? [];
        setMaterialSuppliers(suppliers);
        const only = suppliers[0];
        // Only auto-select when there is exactly one supplier;
        // for multiple/no suppliers leave supplierId untouched to avoid
        // a controlled→uncontrolled transition on the <select>.
        if (suppliers.length === 1 && only && !autoSelectedSupplier.current) {
          form.setValue("supplierId", only.id, { shouldValidate: false });
          autoSelectedSupplier.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setMaterialSuppliers([]);
      })
      .finally(() => {
        if (!cancelled) setSuppliersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [watchMaterialId, isEditing, form]);

  // Sync supplierId when a material has no linked suppliers.
  // Runs AFTER materialSuppliers is set to [] (not before), so the <select>
  // value is already "" when we reset the form field — no controlled→uncontrolled.
  React.useEffect(() => {
    if (!watchMaterialId) return;          // no material selected yet
    if (materialSuppliers.length > 0) return; // has suppliers, leave supplierId as-is
    const current = form.getValues("supplierId");
    if (current && current !== "") {
      form.setValue("supplierId", "", { shouldValidate: false });
    }
  }, [watchMaterialId, materialSuppliers, form]);

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

  /** Effective ratio: form override > material.ratio */
  const effectiveRatio = React.useMemo(() => {
    const override = Number(watchRatioOverride);
    if (Number.isFinite(override) && override >= 1) {
      return Math.floor(override);
    }
    if (selectedMaterial?.ratio && selectedMaterial.ratio >= 1) {
      return selectedMaterial.ratio;
    }
    return null;
  }, [watchRatioOverride, selectedMaterial]);

  const requiresRatio = materialShapeRequiresRatio(
    selectedMaterial?.materialType ?? null,
  );

  const packages = React.useMemo(
    () => previewPackages(watchQuantity, effectivePackingQuantity),
    [watchQuantity, effectivePackingQuantity],
  );

  const piecesQuantity = React.useMemo(
    () =>
      requiresRatio
        ? computePiecesQuantity(
            watchQuantity,
            selectedMaterial?.materialType ?? null,
            effectiveRatio,
          )
        : null,
    [requiresRatio, watchQuantity, selectedMaterial, effectiveRatio],
  );

  const supplierLotPreview = React.useMemo(() => {
    if (!watchProductionDate || !ISO_DATE.test(watchProductionDate)) return null;
    return `SUP-${watchProductionDate.replace(/-/g, "")}`;
  }, [watchProductionDate]);

  const handleAttachmentPick = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setServerError(null);
    if (!ATTACHMENT_TYPES.has(file.type)) {
      setServerError("รองรับเฉพาะไฟล์ JPEG, PNG, WebP หรือ PDF");
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setServerError("ไฟล์แนบต้องมีขนาดไม่เกิน 10 MiB");
      return;
    }
    setAttachmentFile(file);
    if (onUploadAttachment) {
      try {
        setAttachmentUploading(true);
        const uploaded = await onUploadAttachment(file);
        form.setValue("attachmentUrl", uploaded.url, { shouldDirty: true });
        form.setValue("attachmentName", uploaded.name, { shouldDirty: true });
        setAttachmentRemoved(false);
      } catch (err) {
        setServerError(errorMessage(err));
        setAttachmentFile(null);
      } finally {
        setAttachmentUploading(false);
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentRemoved(true);
    form.setValue("attachmentUrl", "", { shouldDirty: true });
    form.setValue("attachmentName", "", { shouldDirty: true });
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      setServerError(null);

      const basePayload: CreateMaterialsReceivingPayload = {
        materialId: values.materialId,
        receiveQuantity: values.receiveQuantity,
        supplierProductionDate: values.supplierProductionDate,
        receiveDate: values.receiveDate,
        poNo: values.poNo || null,
        attachmentUrl: values.attachmentUrl || null,
        attachmentName: values.attachmentName || null,
        remark: values.remark || null,
      };
      if (values.supplierId) {
        basePayload.supplierId = values.supplierId;
      }

      if (values.packingQuantityOverride) {
        const override = Number(values.packingQuantityOverride);
        if (Number.isFinite(override) && override >= 1) {
          basePayload.packingQuantityOverride = Math.floor(override);
        }
      }

      if (values.ratioOverride) {
        const override = Number(values.ratioOverride);
        if (Number.isFinite(override) && override >= 1) {
          basePayload.ratioOverride = Math.floor(override);
        }
      }

      let payload: CreateMaterialsReceivingPayload | UpdateMaterialsReceivingPayload =
        basePayload;

      if (isEditing && receiving) {
        const updatePayload: UpdateMaterialsReceivingPayload = {
          receiveQuantity: values.receiveQuantity,
          supplierProductionDate: values.supplierProductionDate,
          receiveDate: values.receiveDate,
          poNo: values.poNo || null,
          attachmentUrl: values.attachmentUrl || null,
          attachmentName: values.attachmentName || null,
          remark: values.remark || null,
          updatedAt: receiving.updatedAt,
        };
        if (values.packingQuantityOverride) {
          const override = Number(values.packingQuantityOverride);
          if (Number.isFinite(override) && override >= 1) {
            updatePayload.packingQuantityOverride = Math.floor(override);
          }
        }
        if (values.ratioOverride) {
          const override = Number(values.ratioOverride);
          if (Number.isFinite(override) && override >= 1) {
            updatePayload.ratioOverride = Math.floor(override);
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
  const showAttachment =
    !!watchAttachmentUrl || !!attachmentFile || attachmentRemoved;
  const attachmentDisplayName =
    watchAttachmentName || attachmentFile?.name || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="materials-receiving-form-dialog"
        className="grid w-[calc(100vw-1rem)] max-w-4xl max-h-[calc(100dvh-1rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 sm:p-6"
      >
        <DialogHeader className="px-4 pt-4 pr-12 sm:px-0 sm:pt-0">
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
          className="min-h-0 space-y-6 overflow-y-auto px-4 pb-4 sm:px-0 sm:pb-0"
        >
          {/* Lot preview banner */}
          <div className="flex min-w-0 items-center gap-3 rounded-md border border-dashed border-info/40 bg-info/5 p-3 text-sm">
            <Info className="h-4 w-4 text-info shrink-0" />
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-muted-foreground">Internal Lot (ตัวอย่าง):</span>
              <code className="break-all font-mono font-semibold text-info">
                {previewInternalLotNo()}
              </code>
              <span className="text-muted-foreground">Supplier Lot:</span>
              <code className="break-all font-mono font-semibold">
                {supplierLotPreview ?? "—"}
              </code>
              {packages && (
                <>
                  <span className="text-muted-foreground">บรรจุภัณฑ์:</span>
                  <Badge variant="secondary">{packages.length} ใบ</Badge>
                </>
              )}
              {piecesQuantity !== null && (
                <>
                  <span className="text-muted-foreground">ชิ้นที่ใช้ได้:</span>
                  <Badge variant="default" className="gap-1">
                    <Scissors className="h-3 w-3" />
                    {piecesQuantity.toLocaleString("th-TH")} ชิ้น
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* PO Header */}
          <FormSection title="เอกสารอ้างอิง">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="poNo" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  เลขที่ PO
                </Label>
                <Input
                  id="poNo"
                  type="text"
                  placeholder="เช่น PO-2026-001"
                  {...form.register("poNo")}
                  className={cn(
                    "font-mono",
                    form.formState.errors.poNo && "border-danger",
                  )}
                />
                <p className="text-muted-foreground text-xs">
                  ใช้เป็น header ของเอกสารรับเข้า (ไม่บังคับ)
                </p>
                {form.formState.errors.poNo && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.poNo.message}
                  </p>
                )}
              </div>

              {/* Attachment */}
              <div className="space-y-1.5">
                <Label htmlFor="attachmentUrl" className="flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  แนบไฟล์ (รูป/เอกสาร PO)
                </Label>
                <input
                  ref={attachmentInputRef}
                  id="attachmentUrl"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleAttachmentPick}
                  className="hidden"
                />
                {showAttachment ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-sm">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 truncate font-mono text-xs">
                      {attachmentDisplayName ?? "ไฟล์แนบ"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeAttachment}
                      disabled={attachmentUploading}
                      className="h-7 px-2 text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={attachmentUploading}
                    className="w-full gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {attachmentUploading ? "กำลังอัปโหลด..." : "เลือกไฟล์แนบ"}
                  </Button>
                )}
                <p className="text-muted-foreground text-xs">
                  รองรับ JPEG/PNG/WebP/PDF ขนาดไม่เกิน 10 MiB (ไม่บังคับ)
                </p>
              </div>
            </div>
          </FormSection>

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
                      {m.materialType ? ` [${m.materialType}]` : ""}
                      {m.packingQuantity ? ` (${m.packingQuantity}/แพ็ก)` : ""}
                      {m.ratio ? ` ×${m.ratio}` : ""}
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
                  ผู้จัดจำหน่าย
                  {materialSuppliers.length !== 1 && (
                    <span className="text-danger"> *</span>
                  )}
                </Label>
                <select
                  id="supplierId"
                  {...form.register("supplierId")}
                  className={cn(
                    "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none",
                    form.formState.errors.supplierId && "border-danger",
                  )}
                  disabled={isEditing || suppliersLoading}
                >
                  {(() => {
                    if (suppliersLoading) {
                      return (
                        <option key="supplier-loading" value="">
                          กำลังโหลด...
                        </option>
                      );
                    }
                    if (materialSuppliers.length === 0) {
                      return (
                        <option key="supplier-empty" value="">
                          — เลือกวัสดุก่อน —
                        </option>
                      );
                    }
                    if (materialSuppliers.length === 1) {
                      const only = materialSuppliers[0];
                      if (!only) return null;
                      return (
                        <option key={`supplier-only-${only.id}`} value={only.id}>
                          {only.code} — {only.nameTh}
                        </option>
                      );
                    }
                    return (
                      <>
                        <option key="supplier-placeholder" value="">
                          เลือกผู้จัดจำหน่าย
                        </option>
                        {materialSuppliers.map((s, idx) => (
                          <option
                            key={`supplier-${s.id ?? `idx-${idx}`}-${s.code ?? idx}`}
                            value={s.id}
                          >
                            {s.code} — {s.nameTh}
                          </option>
                        ))}
                      </>
                    );
                  })()}
                </select>
                {form.formState.errors.supplierId && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.supplierId.message}
                  </p>
                )}
                {materialSuppliers.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    วัสดุนี้มีผู้จัดจำหน่าย {materialSuppliers.length} ราย กรุณาเลือก
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          {/* Quantity + Ratio + Dates */}
          <FormSection title="จำนวนและวันที่">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="receiveQuantity">
                  จำนวนรับเข้า (ต้นทาง) <span className="text-danger">*</span>
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
                <Label htmlFor="packingQuantityOverride">Packing/แพ็ก (override)</Label>
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

              {requiresRatio ? (
                <div className="space-y-1.5">
                  <Label htmlFor="ratioOverride" className="flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5" />
                    Ratio (ชิ้น/เส้น) <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="ratioOverride"
                    type="number"
                    min="1"
                    step="1"
                    placeholder={
                      selectedMaterial?.ratio
                        ? `ใช้ของวัสดุ: ${selectedMaterial.ratio}`
                        : "ระบุจำนวนชิ้นต่อเส้น"
                    }
                    {...form.register("ratioOverride")}
                    className={cn(
                      "font-mono",
                      form.formState.errors.ratioOverride && "border-danger",
                    )}
                  />
                  <p className="text-muted-foreground text-xs">
                    1 เส้น/แผ่น/ม้วน แบ่งได้กี่ชิ้น
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="ratioDisplay" className="flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5" />
                    Ratio (ชิ้น/เส้น)
                  </Label>
                  <Input
                    id="ratioDisplay"
                    value="—"
                    disabled
                    placeholder="ไม่ใช้ ratio (materialType = PCS)"
                  />
                  <p className="text-muted-foreground text-xs">
                    ประเภทนี้ไม่ใช้ ratio
                  </p>
                </div>
              )}

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

          {/* Package Preview + Pieces summary */}
          {packages && packages.length > 0 && (
            <FormSection title="ตัวอย่างการแบ่งบรรจุภัณฑ์">
              <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Boxes className="h-4 w-4" />
                  รวม {packages.length} ใบ
                  {effectivePackingQuantity && (
                    <span className="text-muted-foreground">
                      · ใบสุดท้ายอาจมีจำนวนน้อยกว่า {effectivePackingQuantity}
                    </span>
                  )}
                </div>
                {requiresRatio && piecesQuantity !== null && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
                    <div className="flex items-center gap-2 text-amber-900 font-medium">
                      <Scissors className="h-4 w-4" />
                      จำนวนชิ้นที่ใช้ได้ (piecesQuantity)
                    </div>
                    <div className="mt-1 text-amber-800">
                      รับเข้า{" "}
                      <strong>{watchQuantity || "0"}</strong>{" "}
                      (หน่วยต้นทาง) × ratio <strong>{effectiveRatio ?? "—"}</strong>{" "}
                      = <strong>{piecesQuantity.toLocaleString("th-TH")}</strong> ชิ้น
                    </div>
                    <p className="text-amber-700 text-xs mt-1">
                      ยอดนี้คือจำนวนชิ้นที่ต้องรับเข้าจริง (เก็บทั้ง receiveQuantity
                      และ piecesQuantity ไว้ทั้งคู่)
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
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

          {/* Remark */}
          <FormSection title="หมายเหตุ">
            <div className="space-y-1.5">
              <Label htmlFor="remark">หมายเหตุ</Label>
              <Textarea
                id="remark"
                {...form.register("remark")}
                placeholder="รายละเอียดเพิ่มเติม..."
                rows={2}
              />
            </div>
          </FormSection>

          {serverError && (
            <div className="rounded-md border border-danger/50 bg-danger/5 p-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <DialogFooter
            data-testid="materials-receiving-form-actions"
            className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0"
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={savePending}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-1" />
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={savePending}
              className="w-full sm:w-auto"
            >
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
