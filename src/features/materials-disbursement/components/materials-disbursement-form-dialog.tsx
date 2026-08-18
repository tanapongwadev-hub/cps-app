"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ClipboardList, Package, Plus, Save, Scissors, Trash2, Upload, X } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import type {
  CreateMaterialsDisbursementPayload,
  MaterialsDisbursement,
  MaterialsDisbursementDetail,
  MaterialsDisbursementLookups,
  UpdateMaterialsDisbursementPayload,
} from "../api/materials-disbursement-api";

const DECIMAL_REGEX = /^\d+(\.\d{1,4})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const formSchema = z.object({
  disbursementType: z.enum(["stock_cut", "production"]),
  disbursementDate: z
    .string()
    .min(1, "กรุณาเลือกวันที่จ่ายออก")
    .regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
  reason: z.string().optional(),
  attachmentUrl: z.string().optional(),
  attachmentName: z.string().optional(),
  items: z
    .array(
      z.object({
        materialId: z.string().min(1, "กรุณาเลือกวัสดุ"),
        requestedQuantity: z
          .string()
          .min(1, "กรุณากรอกจำนวน")
          .regex(DECIMAL_REGEX, "ต้องเป็นตัวเลขทศนิยมไม่เกิน 4 ตำแหน่ง"),
      }),
    )
    .min(1, "ต้องมีอย่างน้อย 1 รายการ"),
  remark: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function getDefaultValues(disbursement?: MaterialsDisbursement | MaterialsDisbursementDetail | null): FormValues {
  if (disbursement) {
    const detailItems = 'items' in disbursement ? disbursement.items : undefined;
    return {
      disbursementType: disbursement.disbursementType,
      disbursementDate: disbursement.disbursementDate,
      reason: disbursement.reason ?? "",
      attachmentUrl: disbursement.attachmentUrl ?? "",
      attachmentName: disbursement.attachmentName ?? "",
      items:
        detailItems?.map((item) => ({
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
        })) ?? [],
      remark: disbursement.remark ?? "",
    };
  }
  const today = new Date().toISOString().slice(0, 10);
  return {
    disbursementType: "stock_cut",
    disbursementDate: today,
    reason: "",
    attachmentUrl: "",
    attachmentName: "",
    items: [{ materialId: "", requestedQuantity: "" }],
    remark: "",
  };
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

export interface MaterialsDisbursementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disbursement?: MaterialsDisbursement | MaterialsDisbursementDetail | null;
  lookups: MaterialsDisbursementLookups;
  onSave: (
    payload: CreateMaterialsDisbursementPayload | UpdateMaterialsDisbursementPayload,
  ) => Promise<void>;
  savePending?: boolean;
  onUploadAttachment?: (file: File) => Promise<{ url: string; name: string }>;
}

export function MaterialsDisbursementFormDialog({
  open,
  onOpenChange,
  disbursement,
  lookups,
  onSave,
  savePending,
  onUploadAttachment,
}: MaterialsDisbursementFormDialogProps) {
  const isEditing = !!disbursement;
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(disbursement),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchType = form.watch("disbursementType");

  // Reset form when dialog opens
  React.useEffect(() => {
    if (!open) return;
    form.reset(getDefaultValues(disbursement));
    setServerError(null);
  }, [open, disbursement, form]);

  const handleSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const payload = {
        disbursementType: values.disbursementType,
        disbursementDate: values.disbursementDate,
        reason: values.reason || null,
        attachmentUrl: values.attachmentUrl || null,
        attachmentName: values.attachmentName || null,
        items: values.items.map((item) => ({
          materialId: item.materialId,
          requestedQuantity: item.requestedQuantity,
        })),
        remark: values.remark || null,
      };
      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadAttachment) return;
    try {
      const result = await onUploadAttachment(file);
      form.setValue("attachmentUrl", result.url, { shouldValidate: false });
      form.setValue("attachmentName", result.name, { shouldValidate: false });
    } catch {
      setServerError("อัปโหลดไฟล์ไม่สำเร็จ");
    }
  };

  const getMaterialStock = (materialId: string): string => {
    const mat = lookups.materials.find((m) => m.id === materialId);
    if (!mat) return "—";
    return formatNumber(mat.availableStock);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "แก้ไขใบจ่ายออก" : "สร้างใบจ่ายออกวัสดุ"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `แก้ไขรายการ ${disbursement.disbursementNo}`
              : "กรอกรายละเอียดการจ่ายออกวัสดุ"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Header: Type + Date */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="disbursementType">ประเภทการจ่ายออก *</Label>
              <Select
                value={form.watch("disbursementType")}
                onValueChange={(v) => form.setValue("disbursementType", v as "stock_cut" | "production", { shouldValidate: true })}
                disabled={isEditing}
              >
                <SelectTrigger id="disbursementType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_cut">
                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4" />
                      ตัดสต็อก
                    </div>
                  </SelectItem>
                  <SelectItem value="production">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      เบิกเพื่อผลิต
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.disbursementType && (
                <p className="text-xs text-destructive">{form.formState.errors.disbursementType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="disbursementDate">วันที่จ่ายออก *</Label>
              <Input
                id="disbursementDate"
                type="date"
                {...form.register("disbursementDate")}
              />
              {form.formState.errors.disbursementDate && (
                <p className="text-xs text-destructive">{form.formState.errors.disbursementDate.message}</p>
              )}
            </div>
          </div>

          {/* Stock Cut: Reason + Attachment */}
          {watchType === "stock_cut" && (
            <div className="space-y-4 rounded-lg border border-dashed border-warning/30 bg-warning/5 p-4">
              <div className="flex items-center gap-2 font-medium text-sm">
                <AlertCircle className="h-4 w-4 text-warning" />
                ต้องระบุเหตุผลการตัดสต็อก + แนบเอกสาร
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">เหตุผลการตัดสต็อก *</Label>
                <Textarea
                  id="reason"
                  placeholder="ระบุเหตุผล เช่น ชิ้นงานเสีย, สั่งซื้อเกิน..."
                  rows={2}
                  {...form.register("reason")}
                />
                {form.formState.errors.reason && (
                  <p className="text-xs text-destructive">{form.formState.errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>แนบเอกสาร</Label>
                <div className="flex items-center gap-3">
                  {form.watch("attachmentName") && (
                    <Badge variant="outline" className="max-w-[200px] truncate">
                      {form.watch("attachmentName")}
                    </Badge>
                  )}
                  <label
                    htmlFor="attachment-upload"
                    className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-sm hover:bg-muted transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    เลือกไฟล์
                  </label>
                  <input
                    id="attachment-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">รายการวัสดุ *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ materialId: "", requestedQuantity: "" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มรายการ
              </Button>
            </div>

            {form.formState.errors.items?.root && (
              <p className="text-xs text-destructive">{form.formState.errors.items.root.message}</p>
            )}

            {fields.map((field, index) => {
              const matId = form.watch(`items.${index}.materialId`);
              const mat = lookups.materials.find((m) => m.id === matId);
              return (
                <div
                  key={field.id}
                  className="rounded-lg border bg-card p-3 space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-2 shrink-0">
                      #{index + 1}
                    </Badge>
                    <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor={`items.${index}.materialId`} className="text-xs">
                          วัสดุ
                        </Label>
                        <Select
                          value={matId}
                          onValueChange={(v) =>
                            form.setValue(`items.${index}.materialId`, v, { shouldValidate: true })
                          }
                        >
                          <SelectTrigger id={`items.${index}.materialId`}>
                            <SelectValue placeholder="เลือกวัสดุ" />
                          </SelectTrigger>
                          <SelectContent>
                            {lookups.materials.map((m) => {
                              const stock = m.availableStock;
                              const stockNum = Number(stock) || 0;
                              const isLow = stockNum === 0;
                              return (
                                <SelectItem key={m.id} value={m.id} disabled={isLow}>
                                  <div className="flex items-center justify-between w-full gap-4">
                                    <span>
                                      {m.code} — {m.name}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-xs ml-auto",
                                        isLow ? "text-destructive font-medium" : "text-muted-foreground",
                                      )}
                                    >
                                      สต็อก: {formatNumber(stock)}
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        {form.formState.errors.items?.[index]?.materialId && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.items[index].materialId?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor={`items.${index}.requestedQuantity`} className="text-xs">
                          จำนวนที่ต้องการจ่าย
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`items.${index}.requestedQuantity`}
                            type="text"
                            inputMode="decimal"
                            placeholder="0"
                            {...form.register(`items.${index}.requestedQuantity`)}
                          />
                          {mat && (
                            <span className="text-sm text-muted-foreground shrink-0">
                              {lookups.units.find((u) => u.id === mat.unitId)?.code ?? ""}
                            </span>
                          )}
                        </div>
                        {form.formState.errors.items?.[index]?.requestedQuantity && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.items[index].requestedQuantity?.message}
                          </p>
                        )}
                        {/* Stock warning */}
                        {matId && Number(getMaterialStock(matId).replace(/,/g, "")) === 0 && (
                          <p className="text-xs text-destructive">
                            ⚠️ สต็อกวัสดุนี้หมด
                          </p>
                        )}
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-6 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remark */}
          <div className="space-y-2">
            <Label htmlFor="remark">หมายเหตุ</Label>
            <Textarea
              id="remark"
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              rows={2}
              {...form.register("remark")}
            />
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={savePending}>
              <Save className="h-4 w-4 mr-1" />
              {savePending ? "กำลังบันทึก..." : isEditing ? "บันทึกการแก้ไข" : "สร้างใบจ่ายออก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
