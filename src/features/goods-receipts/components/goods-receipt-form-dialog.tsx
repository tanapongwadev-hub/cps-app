"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUp, Plus, Trash2, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { FormSection } from "@/components/forms/form-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import type {
  GoodsReceipt,
  GoodsReceiptDetail,
  GoodsReceiptLookups,
  CreateGoodsReceiptPayload,
  UpdateGoodsReceiptPayload,
} from "../api/goods-receipts-api";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate Lot number: L{YYMMDD}-{seq}
 * Example: L260808-001
 */
function generateLotNo(sequence: number = 1): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const seq = String(sequence).padStart(3, "0");
  return `L${yy}${mm}${dd}-${seq}`;
}

// ============================================================================
// Schema
// ============================================================================

const ITEM_SCHEMA = z.object({
  materialId: z.string().min(1, "กรุณาเลือกวัสดุ"),
  supplierId: z.string().min(1, "กรุณาเลือกผู้จัดจำหน่าย"),
  poNo: z.string().nullable().optional(),
  supplierDocNo: z.string().nullable().optional(),
  supplierDocDate: z.string().nullable().optional(),
  noSupplierDocument: z.boolean().default(false),
  lotNo: z.string().min(1, "กรุณากรอกเลขที่ Lot"),
  qtyReceived: z.string().min(1, "กรุณากรอกจำนวนรับ"),
  productionDate: z.string().nullable().optional(),
  filePath: z.string().nullable().optional(),
  fileName: z.string().nullable().optional(),
});

const goodsReceiptFormSchema = z.object({
  receiptDate: z.string().min(1, "กรุณาเลือกวันที่รับ"),
  remark: z.string().nullable().optional(),
  items: z.array(ITEM_SCHEMA).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
});

type GoodsReceiptFormValues = z.infer<typeof goodsReceiptFormSchema>;

// ============================================================================
// Component
// ============================================================================

export interface GoodsReceiptFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt?: GoodsReceipt | GoodsReceiptDetail | null;
  lookups: GoodsReceiptLookups;
  onSave: (payload: CreateGoodsReceiptPayload | UpdateGoodsReceiptPayload) => Promise<void>;
  onUploadAttachment: (file: File) => Promise<{ filePath: string; fileName: string }>;
  savePending?: boolean;
  uploadPending?: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง";
}

export function GoodsReceiptFormDialog({
  open,
  onOpenChange,
  receipt,
  lookups,
  onSave,
  onUploadAttachment,
  savePending,
  uploadPending,
}: GoodsReceiptFormDialogProps) {
  const isEditing = !!receipt;
  const [serverError, setServerError] = React.useState<string | null>(null);

  // Auto-select supplier if only one supplier exists
  const defaultSupplierId = React.useMemo(() => {
    if (lookups.suppliers.length === 1) {
      return lookups.suppliers[0].id;
    }
    return "";
  }, [lookups.suppliers]);

  const form = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptFormSchema),
    defaultValues: getDefaultValues(receipt, defaultSupplierId),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Reset form when receipt changes
  React.useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(receipt, defaultSupplierId));
      setServerError(null);
    }
  }, [open, receipt, form, defaultSupplierId]);

  // Generate lot for new item
  const handleAddItem = () => {
    const newIndex = fields.length;
    // Copy doc info from previous item if exists (1:1 pattern)
    const lastPoNo = fields.length > 0 ? form.getValues(`items.${fields.length - 1}.poNo`) : null;
    const lastSupplierDocNo = fields.length > 0 ? form.getValues(`items.${fields.length - 1}.supplierDocNo`) : null;
    const lastSupplierDocDate = fields.length > 0 ? form.getValues(`items.${fields.length - 1}.supplierDocDate`) : null;
    const lastNoSupplierDoc = fields.length > 0 ? form.getValues(`items.${fields.length - 1}.noSupplierDocument`) : false;
    append({
      materialId: "",
      supplierId: defaultSupplierId,
      poNo: lastPoNo ?? null,
      supplierDocNo: lastSupplierDocNo ?? null,
      supplierDocDate: lastSupplierDocDate ?? null,
      noSupplierDocument: lastNoSupplierDoc ?? false,
      lotNo: generateLotNo(newIndex + 1),
      qtyReceived: "",
      productionDate: null,
      filePath: null,
      fileName: null,
    });
  };

  const handleSubmit = async (values: GoodsReceiptFormValues) => {
    try {
      setServerError(null);

      // Get primary supplier from first item
      const primarySupplierId = values.items[0]?.supplierId || "";

      const payload: CreateGoodsReceiptPayload | UpdateGoodsReceiptPayload = {
        supplierId: primarySupplierId,
        receiptDate: values.receiptDate,
        remark: values.remark || null,
        items: values.items.map((item) => ({
          materialId: item.materialId,
          poNo: item.poNo || null,
          supplierDocNo: item.noSupplierDocument ? null : item.supplierDocNo || null,
          supplierDocDate: item.noSupplierDocument ? null : item.supplierDocDate || null,
          noSupplierDocument: item.noSupplierDocument,
          qtyReceived: item.qtyReceived,
          lotNo: item.lotNo || null,
          productionDate: item.productionDate || null,
          filePath: item.filePath || null,
          fileName: item.fileName || null,
        })),
      };

      if (isEditing && receipt) {
        (payload as UpdateGoodsReceiptPayload).updatedAt = receipt.updatedAt;
      }

      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" size="xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขรายการรับวัสดุ" : "สร้างรายการรับวัสดุ"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `แก้ไขรายการรับวัสดุเลขที่ ${receipt?.receiptNo ?? "ฉบับร่าง"}`
              : "กรอกข้อมูลเพื่อสร้างรายการรับวัสดุใหม่"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Document Header + Attachments - First! */}
          <FormSection title="ข้อมูลเอกสาร">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="receiptDate">
                  วันที่รับ <span className="text-danger">*</span>
                </Label>
                <Input
                  id="receiptDate"
                  type="date"
                  {...form.register("receiptDate")}
                  className={cn(form.formState.errors.receiptDate && "border-danger")}
                />
                {form.formState.errors.receiptDate && (
                  <p className="text-danger text-xs">
                    {form.formState.errors.receiptDate.message}
                  </p>
                )}
              </div>
            </div>

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

          {/* Items Section */}
          <FormSection title="รายการวัสดุ">
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">รายการที่ {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-danger hover:text-danger h-7 px-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {/* Material Selection */}
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>
                        วัสดุ <span className="text-danger">*</span>
                      </Label>
                      <select
                        {...form.register(`items.${index}.materialId`)}
                        onChange={(e) => {
                          const materialId = e.target.value;
                          form.setValue(`items.${index}.materialId`, materialId);
                          // Auto-generate lot number when material is selected
                          if (materialId) {
                            form.setValue(`items.${index}.lotNo`, generateLotNo(index + 1));
                          }
                        }}
                        className={cn(
                          "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none",
                          form.formState.errors.items?.[index]?.materialId && "border-danger"
                        )}
                      >
                        <option value="">เลือกวัสดุ</option>
                        {lookups.materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.code} — {m.name}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.items?.[index]?.materialId && (
                        <p className="text-danger text-xs">
                          {form.formState.errors.items?.[index]?.materialId?.message}
                        </p>
                      )}
                    </div>

                    {/* Supplier Selection */}
                    <div className="space-y-1.5 md:col-span-2">
                      <Label>
                        ผู้จัดจำหน่าย <span className="text-danger">*</span>
                      </Label>
                      <select
                        {...form.register(`items.${index}.supplierId`)}
                        className={cn(
                          "border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none",
                          form.formState.errors.items?.[index]?.supplierId && "border-danger"
                        )}
                      >
                        <option value="">เลือกผู้จัดจำหน่าย</option>
                        {lookups.suppliers.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} — {s.nameTh}
                          </option>
                        ))}
                      </select>
                      {form.formState.errors.items?.[index]?.supplierId && (
                        <p className="text-danger text-xs">
                          {form.formState.errors.items?.[index]?.supplierId?.message}
                        </p>
                      )}
                    </div>

                    {/* PO Number */}
                    <div className="space-y-1.5">
                      <Label htmlFor={`items.${index}.poNo`}>เลขที่ PO</Label>
                      <Input
                        {...form.register(`items.${index}.poNo`)}
                        placeholder="PO-2026-0001"
                      />
                    </div>

                    {/* Supplier Doc No */}
                    <div className="space-y-1.5">
                      <Label htmlFor={`items.${index}.supplierDocNo`}>เลขที่ใบส่งของ</Label>
                      <Input
                        {...form.register(`items.${index}.supplierDocNo`)}
                        placeholder="DN-12345"
                        disabled={form.watch(`items.${index}.noSupplierDocument`)}
                      />
                    </div>

                    {/* Supplier Doc Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor={`items.${index}.supplierDocDate`}>วันที่ใบส่งของ</Label>
                      <Input
                        {...form.register(`items.${index}.supplierDocDate`)}
                        type="date"
                        disabled={form.watch(`items.${index}.noSupplierDocument`)}
                      />
                    </div>

                    {/* No Supplier Document */}
                    <div className="space-y-1.5 flex items-start">
                      <div className="flex items-center h-9">
                        <Checkbox
                          id={`items.${index}.noSupplierDocument`}
                          {...form.register(`items.${index}.noSupplierDocument`)}
                        />
                      </div>
                      <Label
                        htmlFor={`items.${index}.noSupplierDocument`}
                        className="font-normal cursor-pointer ml-2 leading-9"
                      >
                        ไม่มีใบส่งของ
                      </Label>
                    </div>

                    {/* Lot Number */}
                    <div className="space-y-1.5">
                      <Label>
                        เลขที่ Lot <span className="text-danger">*</span>
                      </Label>
                      <div className="flex gap-1">
                        <Input
                          {...form.register(`items.${index}.lotNo`)}
                          placeholder="L260808-001"
                          className={cn(
                            form.formState.errors.items?.[index]?.lotNo && "border-danger"
                          )}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            form.setValue(
                              `items.${index}.lotNo`,
                              generateLotNo(index + 1)
                            );
                          }}
                          title="สร้างเลข Lot ใหม่"
                          className="shrink-0"
                        >
                          🔄
                        </Button>
                      </div>
                      {form.formState.errors.items?.[index]?.lotNo && (
                        <p className="text-danger text-xs">
                          {form.formState.errors.items?.[index]?.lotNo?.message}
                        </p>
                      )}
                    </div>

                    {/* Quantity Received */}
                    <div className="space-y-1.5">
                      <Label>
                        จำนวนรับ (หน่วย) <span className="text-danger">*</span>
                      </Label>
                      <Input
                        {...form.register(`items.${index}.qtyReceived`)}
                        type="number"
                        step="0.0001"
                        min="0"
                        placeholder="0.0000"
                        className={cn(
                          form.formState.errors.items?.[index]?.qtyReceived && "border-danger"
                        )}
                      />
                      {form.formState.errors.items?.[index]?.qtyReceived && (
                        <p className="text-danger text-xs">
                          {form.formState.errors.items?.[index]?.qtyReceived?.message}
                        </p>
                      )}
                    </div>

                    {/* Production Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor={`items.${index}.productionDate`}>วันที่ผลิต</Label>
                      <Input
                        {...form.register(`items.${index}.productionDate`)}
                        type="date"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div className="space-y-1.5">
                    <Label>ไฟล์แนบ</Label>
                    {form.watch(`items.${index}.filePath`) ? (
                      <div className="flex items-center gap-2 rounded-lg border p-2">
                        <span className="text-sm truncate flex-1">
                          {form.watch(`items.${index}.fileName`)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue(`items.${index}.filePath`, null);
                            form.setValue(`items.${index}.fileName`, null);
                          }}
                          className="text-danger hover:text-danger h-7 px-2"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed rounded-lg p-3 text-center">
                        <input
                          type="file"
                          id={`item-upload-${index}`}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const result = await onUploadAttachment(file);
                                form.setValue(`items.${index}.filePath`, result.filePath);
                                form.setValue(`items.${index}.fileName`, result.fileName);
                              } catch {
                                // error handled by parent
                              }
                            }
                            e.target.value = "";
                          }}
                          disabled={uploadPending}
                        />
                        <label
                          htmlFor={`item-upload-${index}`}
                          className="cursor-pointer flex flex-col items-center gap-1"
                        >
                          <FileUp className="h-5 w-5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            คลิกเพื่ออัปโหลด
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={handleAddItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรายการวัสดุ
              </Button>
            </div>

            {form.formState.errors.items && (
              <p className="text-danger text-sm">
                {form.formState.errors.items.message ||
                  form.formState.errors.items.root?.message}
              </p>
            )}
          </FormSection>

          {/* Error */}
          {serverError && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={savePending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={savePending}>
              {savePending ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "สร้างรายการ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Default Values
// ============================================================================

function getDefaultValues(
  receipt?: GoodsReceipt | GoodsReceiptDetail | null,
  defaultSupplierId: string = ""
): GoodsReceiptFormValues {
  if (!receipt) {
    return {
      receiptDate: new Date().toISOString().split("T")[0],
      remark: null,
      items: [
        {
          materialId: "",
          supplierId: defaultSupplierId,
          poNo: null,
          supplierDocNo: null,
          supplierDocDate: null,
          noSupplierDocument: false,
          lotNo: generateLotNo(1),
          qtyReceived: "",
          productionDate: null,
          filePath: null,
          fileName: null,
        },
      ],
    };
  }

  return {
    receiptDate: receipt.receiptDate,
    remark: receipt.remark,
    items:
      receipt.items?.map((item) => ({
        materialId: item.materialId,
        supplierId: receipt.supplierId,
        poNo: item.poNo ?? null,
        supplierDocNo: item.supplierDocNo ?? null,
        supplierDocDate: item.supplierDocDate ?? null,
        noSupplierDocument: item.noSupplierDocument ?? false,
        lotNo: item.lotNo ?? "",
        qtyReceived: item.qtyReceived,
        productionDate: item.productionDate,
        filePath: item.filePath ?? null,
        fileName: item.fileName ?? null,
      })) ??
      [
        {
          materialId: "",
          supplierId: receipt.supplierId || defaultSupplierId,
          poNo: null,
          supplierDocNo: null,
          supplierDocDate: null,
          noSupplierDocument: false,
          lotNo: generateLotNo(1),
          qtyReceived: "",
          productionDate: null,
          filePath: null,
          fileName: null,
        },
      ],
  };
}
