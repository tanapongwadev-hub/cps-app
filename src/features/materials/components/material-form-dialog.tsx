"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Package, Save, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { FormGrid, FormSection } from "@/components/forms/form-section";
import { TextField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import type {
  Material,
  MaterialImageUpload,
  MaterialLookupOption,
  MaterialLookups,
  MaterialPayload,
  UpdateMaterialPayload,
} from "../api/materials-api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const materialFormSchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัสวัสดุ"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อวัสดุ"),
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
});

type MaterialFormValues = z.infer<typeof materialFormSchema>;

export interface MaterialFormDialogProps {
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

function formValues(material?: Material | null): MaterialFormValues {
  return {
    code: material?.code ?? "",
    name: material?.name ?? "",
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
          "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
          error && "border-danger focus-visible:ring-danger/20",
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

export function MaterialFormDialog({
  open,
  onOpenChange,
  material,
  lookups,
  onUploadImage,
  onSave,
  savePending = false,
  uploadPending = false,
}: MaterialFormDialogProps) {
  const isEdit = !!material;
  const form = useForm<MaterialFormValues>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: formValues(material),
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(material?.imagePath ?? null);
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
    setPreviewUrl(material?.imagePath ?? null);
    setImageRemoved(false);
    setImageDirty(false);
    setImageError(null);
    setApiError(null);
    setDiscardOpen(false);
    submittingRef.current = false;
    setSubmitting(false);
  }, [form, material, open, revokeObjectUrl]);

  const selectedSupplierIds = useWatch({ control: form.control, name: "supplierIds" }) ?? [];
  const unitId = useWatch({ control: form.control, name: "unitId" }) ?? "";
  const deliveryTypeId = useWatch({ control: form.control, name: "deliveryTypeId" }) ?? "";
  const modelId = useWatch({ control: form.control, name: "modelId" }) ?? "";
  const loadingPointId = useWatch({ control: form.control, name: "loadingPointId" }) ?? "";
  const pending = submitting || savePending || uploadPending;
  const dirty = form.formState.isDirty || imageDirty;

  const requestOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (dirty && !pending) {
      setDiscardOpen(true);
      return;
    }
    if (!pending) onOpenChange(false);
  };

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
      };
      await onSave(isEdit ? { ...payload, updatedAt: material.updatedAt } : payload);

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
      <Sheet open={open} onOpenChange={requestOpenChange}>
        <SheetContent size="xl" className="w-full sm:max-w-2xl" hideClose={pending}>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="size-4" />
              {isEdit ? "แก้ไขวัสดุ" : "เพิ่มวัสดุใหม่"}
            </SheetTitle>
            <SheetDescription>
              {isEdit
                ? `แก้ไข Material Master — ${material.code}`
                : "เพิ่มข้อมูลกลางสำหรับฝ่ายคลังสินค้าและฝ่ายผลิต"}
            </SheetDescription>
          </SheetHeader>

          <form
            className="mt-6 flex min-h-0 flex-1 flex-col"
            onSubmit={handleFormSubmit}
            noValidate
          >
            <div className="flex-1 space-y-7 overflow-y-auto pr-1">
              {apiError && (
                <div
                  role="alert"
                  className="border-danger/30 bg-danger/5 text-danger rounded-md border px-3 py-2 text-sm"
                >
                  {apiError}
                </div>
              )}

              <FormSection
                title="ข้อมูลระบุตัววัสดุ"
                description="รหัส ชื่อ และหน่วยคือข้อมูลหลักสำหรับค้นหาและตรวจรับ"
              >
                <div className="border-primary bg-muted/35 rounded-md border-l-2 p-3">
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
                  <LookupSelect
                    id="material-unit"
                    label="หน่วย"
                    required
                    options={lookups.units}
                    value={unitId}
                    error={form.formState.errors.unitId?.message}
                    onChange={(value) =>
                      form.setValue("unitId", value, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                </div>
              </FormSection>

              <FormSection title="การจำแนกและกระบวนการ">
                <FormGrid cols={2}>
                  <LookupSelect
                    id="material-delivery-type"
                    label="ประเภทการจัดส่ง"
                    options={lookups.deliveryTypes}
                    value={deliveryTypeId}
                    onChange={(value) =>
                      form.setValue("deliveryTypeId", value, { shouldDirty: true })
                    }
                  />
                  <LookupSelect
                    id="material-model"
                    label="รุ่น"
                    options={lookups.models}
                    value={modelId}
                    onChange={(value) => form.setValue("modelId", value, { shouldDirty: true })}
                  />
                  <LookupSelect
                    id="material-loading-point"
                    label="จุดรับสินค้า"
                    options={lookups.loadingPoints}
                    value={loadingPointId}
                    onChange={(value) =>
                      form.setValue("loadingPointId", value, { shouldDirty: true })
                    }
                  />
                  <TextField label="ไลน์กระบวนการ" {...form.register("processLineName")} />
                  <TextField
                    label="สเกล"
                    inputMode="decimal"
                    className="font-mono"
                    {...form.register("scale")}
                  />
                  <label className="flex min-h-9 items-center gap-2 self-end rounded-md border px-3 text-sm">
                    <input type="checkbox" {...form.register("isActive")} />
                    เปิดใช้งาน
                  </label>
                </FormGrid>
              </FormSection>

              <FormSection title="ผู้ขาย" description="เลือกได้เฉพาะ Supplier Master ที่เปิดใช้งาน">
                <div className="space-y-2">
                  <Label htmlFor="material-supplier">เพิ่มผู้ขาย</Label>
                  <select
                    id="material-supplier"
                    value=""
                    onChange={(event) => addSupplier(event.target.value)}
                    className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
                  >
                    <option value="">เลือกผู้ขาย</option>
                    {availableSuppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.code} — {supplier.nameTh}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSupplierIds.length > 0 ? (
                  <ul aria-label="ผู้ขายที่เลือก" className="flex flex-wrap gap-2">
                    {selectedSupplierIds.map((supplierId) => {
                      const supplier = supplierNames.get(supplierId);
                      if (!supplier) return null;
                      return (
                        <li
                          key={supplierId}
                          className="bg-muted/40 inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-sm"
                        >
                          <span>
                            <code className="text-muted-foreground font-mono text-xs">
                              {supplier.code}
                            </code>{" "}
                            {supplier.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeSupplier(supplierId)}
                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-2"
                            aria-label={`นำ ${supplier.name} ออก`}
                          >
                            <X className="size-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-xs">ยังไม่ได้เลือกผู้ขาย</p>
                )}
              </FormSection>

              <FormSection title="ข้อกำหนดและรูปภาพ">
                <FormGrid cols={2}>
                  <div className="space-y-1.5">
                    <Label htmlFor="material-specification">ข้อกำหนด</Label>
                    <Textarea
                      id="material-specification"
                      rows={4}
                      {...form.register("specification")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="material-description">คำอธิบาย</Label>
                    <Textarea
                      id="material-description"
                      rows={4}
                      {...form.register("description")}
                    />
                  </div>
                </FormGrid>

                <div className="space-y-3 rounded-md border border-dashed p-3">
                  <div className="flex flex-wrap items-center gap-2">
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
                      className="border-input bg-background hover:bg-accent inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium shadow-xs"
                    >
                      <ImagePlus className="size-4" />
                      เลือกรูปวัสดุ
                    </Label>
                    <span className="text-muted-foreground text-xs">
                      JPEG, PNG หรือ WebP · สูงสุด 5 MiB
                    </span>
                  </div>
                  {imageError && <p className="text-danger text-xs">{imageError}</p>}
                  {previewUrl && (
                    <div className="bg-muted/40 flex items-center gap-3 rounded-md p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="ตัวอย่างรูปวัสดุ"
                        className="bg-background size-16 rounded-md border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {imageFile?.name ?? "รูปปัจจุบัน"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          สามารถเลือกไฟล์ใหม่เพื่อแทนที่ได้
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                        <X className="size-4" />
                        ลบรูปวัสดุ
                      </Button>
                    </div>
                  )}
                </div>
              </FormSection>
            </div>

            <SheetFooter className="mt-6 border-t px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => requestOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" loading={pending}>
                <Save className="size-4" />
                {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างวัสดุ"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

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
          setPreviewUrl(material?.imagePath ?? null);
          setImageDirty(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
