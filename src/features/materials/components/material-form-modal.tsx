"use client";

/**
 * MaterialFormModal — Redesigned
 *
 * Modern form modal for creating/editing Materials (PC parts).
 * - Clean 2-column layout
 * - Organized sections
 * - Better image upload UX
 */

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Edit2, ImagePlus, Package, Save, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { FormGrid, FormSection } from "@/components/forms/form-section";
import { TextField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import {
  resolveMaterialImage,
  getMaterialTypeLabel,
  getMaterialShapeLabel,
  getMaterialShapeColor,
} from "../utils";
import {
  materialShapeRequiresRatio,
  type Material,
  type MaterialImageUpload,
  type MaterialLookupOption,
  type MaterialLookups,
  type MaterialPayload,
  type MaterialShape,
  type MaterialType,
  type UpdateMaterialPayload,
} from "../api/materials-api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MATERIAL_SHAPE_OPTIONS: ReadonlyArray<MaterialShape> = [
  "PCS",
  "PIPE",
  "SHEET",
  "COIL",
];

const materialFormSchema = z
  .object({
    code: z.string().trim().min(1, "กรุณากรอกรหัสวัสดุ"),
    name: z.string().trim().min(1, "กรุณากรอกชื่อวัสดุ"),
    type: z.string(),
    materialType: z.enum(["PCS", "PIPE", "SHEET", "COIL"], {
      message: "กรุณาเลือกประเภทวัสดุ",
    }),
    ratio: z.string(),
    unitId: z.string().min(1, "กรุณาเลือกหน่วย"),
    deliveryTypeId: z.string(),
    modelId: z.string(),
    loadingPointId: z.string(),
    processLineName: z.string(),
    scale: z.string(),
    specification: z.string(),
    description: z.string(),
    supplierIds: z.array(z.string()),
    isActive: z.boolean(),
    packingQuantity: z.string(),
  })
  .superRefine((values, ctx) => {
    if (materialShapeRequiresRatio(values.materialType)) {
      const trimmed = values.ratio.trim();
      if (trimmed === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ratio"],
          message: "กรุณากรอกจำนวนชิ้นต่อเส้น (ratio)",
        });
        return;
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ratio"],
          message: "ratio ต้องเป็นจำนวนเต็ม",
        });
        return;
      }
      if (parsed < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ratio"],
          message: "ratio ต้องมีค่าอย่างน้อย 1",
        });
      }
    }
  });

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export interface MaterialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material?: Material | null;
  lookups: MaterialLookups;
  onUploadImage: (file: File) => Promise<MaterialImageUpload>;
  onSave: (payload: MaterialPayload | UpdateMaterialPayload) => Promise<void>;
  savePending?: boolean;
  uploadPending?: boolean;
}

function optionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const num = parseInt(trimmed, 10);
  return isNaN(num) ? null : num;
}

function formValues(material?: Material | null): MaterialFormValues {
  return {
    code: material?.code ?? "",
    name: material?.name ?? "",
    type: material?.type ?? "",
    materialType: material?.materialType ?? "PCS",
    ratio: material?.ratio != null ? material.ratio.toString() : "",
    unitId: material?.unitId ?? "",
    deliveryTypeId: material?.deliveryTypeId ?? "",
    modelId: material?.modelId ?? "",
    loadingPointId: material?.loadingPointId ?? "",
    processLineName: material?.processLineName ?? "",
    scale: material?.scale ?? "",
    specification: material?.specification ?? "",
    description: material?.description ?? "",
    supplierIds: material?.suppliers.map((supplier) => supplier.id) ?? [],
    isActive: material?.isActive ?? true,
    packingQuantity: material?.packingQuantity?.toString() ?? "",
  };
}

function LookupSelect({
  id,
  label,
  required,
  value,
  options,
  error,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  options: MaterialLookupOption[];
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </Label>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none transition-colors",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-danger focus:border-danger focus:ring-danger/20",
        )}
      >
        <option value="">เลือก{label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.code} — {option.nameTh}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-danger text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

function errorMessage(error: unknown, staleConflict: boolean): string {
  if (
    staleConflict &&
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 409
  ) {
    return "ข้อมูลนี้ถูกแก้ไขจากที่อื่นแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนแก้ไขอีกครั้ง";
  }
  return error instanceof Error ? error.message : "ไม่สามารถบันทึกวัสดุได้ กรุณาลองใหม่อีกครั้ง";
}

export function MaterialFormModal({
  open,
  onOpenChange,
  material,
  lookups,
  onUploadImage,
  onSave,
  savePending = false,
  uploadPending = false,
}: MaterialFormModalProps) {
  const isEdit = !!material;
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: formValues(material),
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = React.useState(false);
  const [imageDirty, setImageDirty] = React.useState(false);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [apiError, setApiError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [discardOpen, setDiscardOpen] = React.useState(false);
  const objectUrlRef = React.useRef<string | null>(null);
  const submittingRef = React.useRef(false);

  const revokeObjectUrl = React.useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  React.useEffect(() => () => revokeObjectUrl(), [revokeObjectUrl]);

  React.useEffect(() => {
    if (!open) return;
    revokeObjectUrl();
    form.reset(formValues(material));
    setImageFile(null);
    setPreviewUrl(resolveMaterialImage(material?.imagePath ?? null));
    setImageRemoved(false);
    setImageDirty(false);
    setImageError(null);
    setApiError(null);
    setDiscardOpen(false);
    submittingRef.current = false;
    setSubmitting(false);
  }, [form, material, open, revokeObjectUrl]);

  const selectedSupplierIds = useWatch({ control: form.control, name: "supplierIds" }) ?? [];
  const pending = submitting || savePending || uploadPending;
  const dirty = form.formState.isDirty || imageDirty;

  // Stable callback for dialog open state
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        onOpenChange(true);
        return;
      }
      if (dirty && !pending) {
        setDiscardOpen(true);
        return;
      }
      if (!pending) {
        onOpenChange(false);
      }
    },
    [onOpenChange, dirty, pending],
  );

  const selectImage = (file: File | undefined) => {
    if (!file) return;
    setApiError(null);
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
    setImageDirty(true);
    setImageError(null);
  };

  const removeImage = () => {
    revokeObjectUrl();
    setImageFile(null);
    setPreviewUrl(null);
    setImageRemoved(!!material?.imagePath);
    setImageDirty(true);
    setImageError(null);
  };

  const addSupplier = (supplierId: string) => {
    if (!supplierId || selectedSupplierIds.includes(supplierId)) return;
    form.setValue("supplierIds", [...selectedSupplierIds, supplierId], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const removeSupplier = (supplierId: string) => {
    form.setValue(
      "supplierIds",
      selectedSupplierIds.filter((id) => id !== supplierId),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const submit = async (values: MaterialFormValues) => {
    setSubmitting(true);
    setApiError(null);

    try {
      let imagePath = imageRemoved ? null : (material?.imagePath ?? null);
      if (imageFile) {
        const uploaded = await onUploadImage(imageFile);
        imagePath = uploaded.imagePath;
      }

      const payload: MaterialPayload = {
        code: values.code,
        name: values.name,
        type: optionalText(values.type) as MaterialType | null ?? null,
        materialType: values.materialType,
        ratio: materialShapeRequiresRatio(values.materialType)
          ? optionalNumber(values.ratio)
          : null,
        unitId: values.unitId,
        deliveryTypeId: optionalText(values.deliveryTypeId),
        modelId: optionalText(values.modelId),
        loadingPointId: optionalText(values.loadingPointId),
        processLineName: optionalText(values.processLineName),
        scale: optionalText(values.scale),
        supplierIds: Array.from(new Set(values.supplierIds)),
        imagePath,
        specification: optionalText(values.specification),
        description: optionalText(values.description),
        isActive: values.isActive,
        packingQuantity: optionalNumber(values.packingQuantity),
      };
      await onSave(isEdit ? { ...payload, updatedAt: material!.updatedAt } : payload);

      revokeObjectUrl();
      setImageDirty(false);
      form.reset(values);
      onOpenChange(false);
    } catch (error) {
      setApiError(errorMessage(error, isEdit));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (submittingRef.current || savePending || uploadPending) return;
    submittingRef.current = true;
    try {
      await form.handleSubmit(submit)(event);
    } finally {
      submittingRef.current = false;
    }
  };

  const supplierNames = new Map(
    [...lookups.suppliers, ...(material?.suppliers ?? [])].map((supplier) => [
      supplier.id,
      { code: supplier.code, name: supplier.nameTh },
    ]),
  );
  const availableSuppliers = lookups.suppliers.filter(
    (supplier) => supplier.isActive && !selectedSupplierIds.includes(supplier.id),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent size="xl" className="w-full sm:max-w-4xl" hideClose={true}>
          <DialogHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                {isEdit ? <Edit2 className="size-4" /> : <Package className="size-4" />}
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {isEdit ? "แก้ไขอะไหล่ PC" : "เพิ่มอะไหล่ PC ใหม่"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {isEdit
                    ? `แก้ไข Material Master — ${material!.code}`
                    : "กรอกข้อมูลอะไหล่สำหรับฝ่าย PC"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={handleFormSubmit}
            noValidate
          >
            <div className="flex-1 space-y-6 overflow-y-auto pr-1">
              {/* API Error */}
              {apiError && (
                <div
                  role="alert"
                  className="border-danger/30 bg-danger/5 text-danger rounded-lg border px-4 py-3 text-sm"
                >
                  {apiError}
                </div>
              )}

              {/* Section 1: Basic Info */}
              <FormSection
                title="ข้อมูลพื้นฐาน"
                description="รหัส ชื่อ และหน่วยคือข้อมูลหลักสำหรับค้นหาและตรวจรับ"
              >
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <FormGrid cols={2}>
                    <TextField
                      label="รหัสวัสดุ"
                      aria-label="รหัสวัสดุ"
                      required
                      autoComplete="off"
                      className="font-mono"
                      error={form.formState.errors.code?.message}
                      {...form.register("code")}
                    />
                    <TextField
                      label="ชื่อวัสดุ"
                      aria-label="ชื่อวัสดุ"
                      required
                      error={form.formState.errors.name?.message}
                      {...form.register("name")}
                    />
                  </FormGrid>
                  <FormGrid cols={3}>
                    <div className="space-y-1.5">
                      <Label htmlFor="material-type">ประเภท</Label>
                      <select
                        id="material-type"
                        aria-label="ประเภท"
                        value={form.watch("type")}
                        onChange={(event) =>
                          form.setValue("type", event.target.value, { shouldDirty: true })
                        }
                        className={cn(
                          "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none transition-colors",
                          "focus:border-primary focus:ring-2 focus:ring-primary/20",
                        )}
                      >
                        <option value="">เลือกประเภท</option>
                        <option value="PC">{getMaterialTypeLabel("PC")}</option>
                        <option value="OF">{getMaterialTypeLabel("OF")}</option>
                        <option value="OF_MAT">{getMaterialTypeLabel("OF_MAT")}</option>
                      </select>
                    </div>
                    <LookupSelect
                      id="material-unit"
                      label="หน่วย"
                      required
                      options={lookups.units}
                      value={form.watch("unitId")}
                      error={form.formState.errors.unitId?.message}
                      onChange={(value) =>
                        form.setValue("unitId", value, { shouldDirty: true, shouldValidate: true })
                      }
                    />
                    <TextField
                      label="จำนวนต่อหน่วยบรรจุ"
                      aria-label="จำนวนต่อหน่วยบรรจุ"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder="เช่น 25"
                      className="font-mono"
                      description="จำนวนชิ้นต่อหน่วยบรรจุ"
                      {...form.register("packingQuantity")}
                    />
                  </FormGrid>
                </div>
              </FormSection>

              {/* Section 1.5: Material Shape (PCS/PIPE/SHEET/COIL) + Ratio */}
              <FormSection
                title="ลักษณะวัสดุ"
                description="เลือกลักษณะการรับเข้า (PCS/PIPE/SHEET/COIL) — ถ้าเป็นเหล็กเส้น/แผ่น/ม้วน ต้องระบุจำนวนชิ้นต่อเส้น"
              >
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <FormGrid cols={2}>
                    <div className="space-y-1.5">
                      <Label htmlFor="material-shape">
                        ประเภทวัสดุ (Material Shape)
                        <span className="text-danger ml-0.5">*</span>
                      </Label>
                      <select
                        id="material-shape"
                        aria-label="ประเภทวัสดุ"
                        value={form.watch("materialType")}
                        onChange={(event) =>
                          form.setValue(
                            "materialType",
                            event.target.value as MaterialShape,
                            { shouldDirty: true, shouldValidate: true },
                          )
                        }
                        className={cn(
                          "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none transition-colors",
                          "focus:border-primary focus:ring-2 focus:ring-primary/20",
                          form.formState.errors.materialType &&
                            "border-danger focus:border-danger focus:ring-danger/20",
                        )}
                        aria-invalid={!!form.formState.errors.materialType}
                      >
                        {MATERIAL_SHAPE_OPTIONS.map((shape) => (
                          <option key={shape} value={shape}>
                            {getMaterialShapeLabel(shape)}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.materialType && (
                        <p className="text-danger text-xs">
                          {form.formState.errors.materialType.message as string}
                        </p>
                      )}
                      <p className="text-muted-foreground text-xs">
                        <span
                          className={cn(
                            "inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium",
                            getMaterialShapeColor(form.watch("materialType")),
                          )}
                        >
                          {getMaterialShapeLabel(form.watch("materialType")) ??
                            "ไม่ระบุ"}
                        </span>
                      </p>
                    </div>
                    {materialShapeRequiresRatio(form.watch("materialType")) ? (
                      <TextField
                        label="จำนวนชิ้นต่อเส้น (Ratio)"
                        aria-label="จำนวนชิ้นต่อเส้น"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        required
                        placeholder="เช่น 4"
                        className="font-mono"
                        description="1 เส้น/แผ่น/ม้วน แบ่งได้กี่ชิ้น (ต้องกรอกเมื่อเลือก PIPE/SHEET/COIL)"
                        error={form.formState.errors.ratio?.message}
                        {...form.register("ratio")}
                      />
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="material-ratio-display">จำนวนชิ้นต่อเส้น (Ratio)</Label>
                        <div
                          id="material-ratio-display"
                          className="text-muted-foreground flex h-9 items-center rounded-md border border-dashed bg-muted/30 px-3 text-sm"
                        >
                          ไม่ต้องระบุ — ประเภท PCS ไม่ใช้ ratio
                        </div>
                        <p className="text-muted-foreground text-xs">
                          เปลี่ยนประเภทเป็น PIPE/SHEET/COIL เพื่อกรอก ratio
                        </p>
                      </div>
                    )}
                  </FormGrid>
                </div>
              </FormSection>

              {/* Section 2: Classification & Process */}
              <FormSection title="การจำแนกและกระบวนการ">
                <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                  <FormGrid cols={3}>
                    <LookupSelect
                      id="material-delivery-type"
                      label="ประเภทการจัดส่ง"
                      options={lookups.deliveryTypes}
                      value={form.watch("deliveryTypeId")}
                      onChange={(value) =>
                        form.setValue("deliveryTypeId", value, { shouldDirty: true })
                      }
                    />
                    <LookupSelect
                      id="material-model"
                      label="รุ่น"
                      options={lookups.models}
                      value={form.watch("modelId")}
                      onChange={(value) =>
                        form.setValue("modelId", value, { shouldDirty: true })
                      }
                    />
                    <LookupSelect
                      id="material-loading-point"
                      label="จุดรับสินค้า"
                      options={lookups.loadingPoints}
                      value={form.watch("loadingPointId")}
                      onChange={(value) =>
                        form.setValue("loadingPointId", value, { shouldDirty: true })
                      }
                    />
                  </FormGrid>
                  <FormGrid cols={3}>
                    <TextField
                      label="ไลน์กระบวนการ"
                      {...form.register("processLineName")}
                    />
                    <TextField
                      label="สเกล"
                      inputMode="decimal"
                      className="font-mono"
                      {...form.register("scale")}
                    />
                    <div className="space-y-1.5">
                      <Label htmlFor="material-active">สถานะ</Label>
                      <div className="flex h-9 items-center gap-3">
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            {...form.register("isActive")}
                            className="peer sr-only"
                          />
                          <div className="peer-checked:bg-primary bg-muted h-5 w-9 rounded-full transition-colors peer-checked:after:translate-x-full peer-checked:after:border-white after:bg-white after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:transition-all" />
                        </label>
                        <span className="text-sm">
                          {form.watch("isActive") ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </span>
                      </div>
                    </div>
                  </FormGrid>
                </div>
              </FormSection>

              {/* Section 3: Suppliers */}
              <FormSection
                title="ผู้ขาย"
                description="เลือกได้เฉพาะ Supplier Master ที่เปิดใช้งาน"
              >
                <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="material-supplier">เพิ่มผู้ขาย</Label>
                    <select
                      id="material-supplier"
                      value=""
                      onChange={(event) => addSupplier(event.target.value)}
                      className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
                    >
                      <option value="">+ เลือกผู้ขาย</option>
                      {availableSuppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.code} — {supplier.nameTh}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedSupplierIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSupplierIds.map((supplierId) => {
                        const supplier = supplierNames.get(supplierId);
                        if (!supplier) return null;
                        return (
                          <div
                            key={supplierId}
                            className="bg-background inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                          >
                            <span>
                              <code className="text-muted-foreground font-mono text-xs">
                                {supplier.code}
                              </code>{" "}
                              <span className="font-medium">{supplier.name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSupplier(supplierId)}
                              className="text-muted-foreground hover:text-foreground flex size-5 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`นำ ${supplier.name} ออก`}
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      ยังไม่ได้เลือกผู้ขาย — สามารถเพิ่มได้จากด้านบน
                    </p>
                  )}
                </div>
              </FormSection>

              {/* Section 4: Specs & Image */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Specifications */}
                <FormSection title="ข้อกำหนดและรายละเอียด">
                  <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="material-specification">ข้อกำหนด</Label>
                      <Textarea
                        id="material-specification"
                        rows={3}
                        placeholder="ระบุสเปคของวัสดุ..."
                        {...form.register("specification")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="material-description">คำอธิบาย</Label>
                      <Textarea
                        id="material-description"
                        rows={3}
                        placeholder="คำอธิบายเพิ่มเติม..."
                        {...form.register("description")}
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Image Upload */}
                <FormSection title="รูปภาพวัสดุ">
                  <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
                    <input
                      id="material-image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        selectImage(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    <Label
                      htmlFor="material-image"
                      className={cn(
                        "bg-background hover:bg-accent flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
                        previewUrl ? "border-primary/50" : "border-border",
                      )}
                    >
                      {previewUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="ตัวอย่างรูปวัสดุ"
                            className="h-20 w-20 rounded-lg border object-cover"
                          />
                          <span className="text-xs text-muted-foreground">
                            คลิกเพื่อเปลี่ยนรูป
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="bg-muted flex size-12 items-center justify-center rounded-lg">
                            <Camera className="size-5 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium">
                            คลิกเพื่อเลือกรูป
                          </span>
                          <span className="text-muted-foreground text-xs">
                            JPEG, PNG หรือ WebP · สูงสุด 5 MiB
                          </span>
                        </>
                      )}
                    </Label>
                    {imageError && (
                      <p className="text-danger text-xs">{imageError}</p>
                    )}
                    {previewUrl && (
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                        <div className="flex items-center gap-2">
                          <ImagePlus className="text-muted-foreground size-4" />
                          <span className="text-sm">
                            {imageFile?.name ?? "รูปปัจจุบัน"}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="h-7 text-xs text-muted-foreground hover:text-danger"
                        >
                          ลบ
                        </Button>
                      </div>
                    )}
                  </div>
                </FormSection>
              </div>
            </div>

            <DialogFooter className="mt-6 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => handleOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" loading={pending} disabled={pending}>
                <Save className="mr-2 size-4" />
                {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างอะไหล่"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="ทิ้งการเปลี่ยนแปลงที่ยังไม่บันทึก?"
        description="ข้อมูลที่แก้ไขในแบบฟอร์มนี้จะไม่ถูกบันทึก"
        confirmText="ทิ้งการเปลี่ยนแปลง"
        cancelText="กลับไปแก้ไข"
        variant="danger"
        onConfirm={() => {
          revokeObjectUrl();
          setDiscardOpen(false);
          form.reset(formValues(material));
          setImageFile(null);
          setPreviewUrl(resolveMaterialImage(material?.imagePath ?? null));
          setImageDirty(false);
          // Use setTimeout to avoid state update during render
          setTimeout(() => onOpenChange(false), 0);
        }}
      />
    </>
  );
}
