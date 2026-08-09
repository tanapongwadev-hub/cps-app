"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  ChevronDown,
  CircleAlert,
  FileText,
  Gauge,
  Image,
  Package,
  Save,
  Settings,
  Store,
  User,
  X,
} from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
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
import { resolveMaterialImage } from "../utils";
import type {
  Material,
  MaterialImageUpload,
  MaterialLookupOption,
  MaterialLookups,
  MaterialPayload,
  MaterialType,
  UpdateMaterialPayload,
} from "../api/materials-api";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const materialFormSchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัสวัสดุ"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อวัสดุ"),
  type: z.string(),
  unitId: z.string().min(1, "กรุณาเลือกหน่วย"),
  deliveryTypeId: z.string(),
  modelId: z.string(),
  loadingPointId: z.string(),
  processLineName: z.string(),
  scale: z.string(),
  specification: z.string(),
  description: z.string(),
  packingQuantity: z.string(),
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
    type: material?.type ?? "",
    unitId: material?.unitId ?? "",
    deliveryTypeId: material?.deliveryTypeId ?? "",
    modelId: material?.modelId ?? "",
    loadingPointId: material?.loadingPointId ?? "",
    processLineName: material?.processLineName ?? "",
    scale: material?.scale ?? "",
    specification: material?.specification ?? "",
    description: material?.description ?? "",
    packingQuantity: material?.packingQuantity?.toString() ?? "",
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
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      <div className="relative">
        <select
          id={id}
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!!error}
          className={cn(
            "h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm",
            "transition-colors duration-150",
            "hover:border-gray-400",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none",
            error && "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          )}
        >
          <option value="">เลือก{label}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.code} — {option.nameTh}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500 p-1.5 rounded-md">
            <Icon className="size-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

function FullWidthField({ children }: { children: React.ReactNode }) {
  return <div className="col-span-2">{children}</div>;
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
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(
    resolveMaterialImage(material?.imagePath ?? null),
  );
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
  const unitId = useWatch({ control: form.control, name: "unitId" }) ?? "";
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

      const packingQty = values.packingQuantity.trim();
      const payload: MaterialPayload = {
        code: values.code,
        name: values.name,
        type: optionalText(values.type) as MaterialType | null ?? null,
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
        packingQuantity: packingQty ? parseInt(packingQty, 10) : null,
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
        <SheetContent size="xl" className="w-full sm:max-w-4xl" hideClose={true}>
          <SheetHeader className="pb-5 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-2.5 rounded-lg">
                <Package className="size-5 text-white" />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-lg font-bold text-gray-900">
                  {isEdit ? "แก้ไขวัสดุ" : "เพิ่มอะไหล่ PC"}
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-500 mt-0.5">
                  {isEdit ? `รหัส: ${material.code}` : "กรอกข้อมูลวัสดุสำหรับ Material Master"}
                </SheetDescription>
              </div>
              <button
                onClick={() => requestOpenChange(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="ปิด"
              >
                <X className="size-5" />
              </button>
            </div>
          </SheetHeader>

          <form
            className="mt-5 flex min-h-0 flex-1 flex-col"
            onSubmit={handleFormSubmit}
            noValidate
          >
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {apiError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2"
                >
                  <CircleAlert className="size-4 shrink-0" />
                  {apiError}
                </div>
              )}

              {/* Section 1: ข้อมูลพื้นฐาน */}
              <SectionCard icon={FileText} title="ข้อมูลพื้นฐาน">
                <FieldGrid>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="material-type" className="text-sm font-medium text-gray-700">
                      ประเภท
                    </Label>
                    <div className="relative">
                      <select
                        id="material-type"
                        aria-label="ประเภท"
                        value={form.watch("type")}
                        onChange={(event) =>
                          form.setValue("type", event.target.value, { shouldDirty: true })
                        }
                        className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                      >
                        <option value="">เลือกประเภท</option>
                        <option value="PC">PC (อะไหล่)</option>
                        <option value="OF">OF (วัสดุโรงงาน)</option>
                        <option value="OF_MAT">OF_MAT (วัตถุดิบ)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <LookupSelect
                    id="material-unit"
                    label="หน่วยนับ"
                    required
                    options={lookups.units}
                    value={unitId}
                    error={form.formState.errors.unitId?.message}
                    onChange={(value) =>
                      form.setValue("unitId", value, { shouldDirty: true, shouldValidate: true })
                    }
                  />
                  <TextField
                    label="จำนวนบรรจุ"
                    placeholder="เช่น 100"
                    inputMode="numeric"
                    {...form.register("packingQuantity")}
                  />
                </FieldGrid>
              </SectionCard>

              {/* Section 2: การจำแนกและกระบวนการ */}
              <SectionCard icon={Settings} title="การจำแนกและกระบวนการ">
                <FieldGrid>
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
                  <TextField
                    label="ไลน์กระบวนการ"
                    placeholder="เช่น Line A"
                    {...form.register("processLineName")}
                  />
                  <TextField
                    label="สเกล/ขนาด"
                    placeholder="เช่น 10×20×5 ซม."
                    inputMode="decimal"
                    className="font-mono"
                    {...form.register("scale")}
                  />
                </FieldGrid>
              </SectionCard>

              {/* Section 3: ผู้ขาย */}
              <SectionCard icon={User} title="ผู้ขาย">
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      id="material-supplier"
                      value=""
                      onChange={(event) => addSupplier(event.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm transition-colors hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                    >
                      <option value="">+ เพิ่มผู้ขาย</option>
                      {availableSuppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.code} — {supplier.nameTh}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  {selectedSupplierIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedSupplierIds.map((supplierId) => {
                        const supplier = supplierNames.get(supplierId);
                        if (!supplier) return null;
                        return (
                          <div
                            key={supplierId}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
                          >
                            <code className="text-gray-500 font-mono text-xs">{supplier.code}</code>
                            <span className="font-medium text-gray-700">{supplier.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSupplier(supplierId)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              aria-label={`นำ ${supplier.name} ออก`}
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">ยังไม่ได้เลือกผู้ขาย</p>
                  )}
                </div>
              </SectionCard>

              {/* Section 4: ข้อกำหนดและรูปภาพ */}
              <SectionCard icon={Gauge} title="ข้อกำหนดและรูปภาพ">
                <div className="flex gap-5">
                  {/* Left side - specs */}
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">ข้อกำหนด</Label>
                      <Textarea
                        id="material-specification"
                        rows={2}
                        placeholder="ระบุข้อกำหนดหรือสเปค..."
                        className="resize-none rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...form.register("specification")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">คำอธิบาย</Label>
                      <Textarea
                        id="material-description"
                        rows={2}
                        placeholder="รายละเอียดเพิ่มเติม..."
                        className="resize-none rounded-lg border border-gray-300 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                        {...form.register("description")}
                      />
                    </div>
                  </div>

                  {/* Right side - image upload */}
                  <div className="w-48 shrink-0">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-gray-700">รูปภาพ</Label>
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
                      {previewUrl ? (
                        <div className="relative rounded-lg overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={previewUrl}
                            alt="ตัวอย่างรูปวัสดุ"
                            className="aspect-square w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute right-1 top-1 size-6 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                            aria-label="ลบรูป"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="material-image"
                          className="border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-50 flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg transition-colors"
                        >
                          <Box className="size-8 text-blue-400" />
                          <span className="text-xs text-blue-500 font-medium">เลือกรูป</span>
                        </label>
                      )}
                      {imageError && <p className="text-xs text-red-500">{imageError}</p>}
                    </div>
                  </div>
                </div>
              </SectionCard>

              {/* Status Toggle */}
              <div className="flex items-center gap-4 px-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">เปิดใช้งาน</span>
                  <button
                    type="button"
                    onClick={() => form.setValue("isActive", !form.watch("isActive"))}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      form.watch("isActive") ? "bg-blue-500" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
                        form.watch("isActive") ? "translate-x-5" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            <SheetFooter className="mt-5 border-t border-gray-200 pt-4 -mx-2 px-2">
              <div className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => requestOpenChange(false)}
                  className="min-w-24 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={pending}
                  className="min-w-36 gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {pending ? (
                    <>
                      <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      {isEdit ? "บันทึกการเปลี่ยนแปลง" : "สร้างอะไหล่"}
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="ทิ้งการเปลี่ยนแปลง?"
        description="ข้อมูลที่กรอกไปจะไม่ถูกบันทึก"
        cancelText="ยกเลิก"
        confirmText="ทิ้งการเปลี่ยนแปลง"
        variant="warning"
        onConfirm={() => {
          setDiscardOpen(false);
          onOpenChange(false);
        }}
      />
    </>
  );
}
