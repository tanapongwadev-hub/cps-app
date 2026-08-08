"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { RejectReason, RejectReasonPayload, UpdateRejectReasonPayload } from "../api/reject-reasons-api";

const rejectReasonSchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัส"),
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อ (ไทย)"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type RejectReasonFormValues = z.infer<typeof rejectReasonSchema>;

export interface RejectReasonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: RejectReason | null;
  onSave: (payload: RejectReasonPayload | UpdateRejectReasonPayload) => Promise<void>;
  savePending?: boolean;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง";
}

export function RejectReasonFormDialog({
  open,
  onOpenChange,
  reason,
  onSave,
  savePending,
}: RejectReasonFormDialogProps) {
  const isEditing = !!reason;
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<RejectReasonFormValues>({
    resolver: zodResolver(rejectReasonSchema),
    defaultValues: {
      code: reason?.code ?? "",
      nameTh: reason?.nameTh ?? "",
      nameEn: reason?.nameEn ?? "",
      description: reason?.description ?? "",
      isActive: reason?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        code: reason?.code ?? "",
        nameTh: reason?.nameTh ?? "",
        nameEn: reason?.nameEn ?? "",
        description: reason?.description ?? "",
        isActive: reason?.isActive ?? true,
      });
      setServerError(null);
    }
  }, [open, reason, form]);

  const handleSubmit = async (values: RejectReasonFormValues) => {
    try {
      setServerError(null);
      const payload: RejectReasonPayload | UpdateRejectReasonPayload = {
        code: values.code,
        nameTh: values.nameTh,
        nameEn: values.nameEn || null,
        description: values.description || null,
        isActive: values.isActive,
      };

      if (isEditing && reason) {
        (payload as UpdateRejectReasonPayload).updatedAt = reason.updatedAt;
      }

      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "แก้ไขเหตุผลการปฏิเสธ" : "เพิ่มเหตุผลการปฏิเสธ"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? `แก้ไขเหตุผลการปฏิเสธ "${reason?.nameTh}"`
              : "กรอกข้อมูลเพื่อเพิ่มเหตุผลการปฏิเสธใหม่"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">
              รหัส <span className="text-danger">*</span>
            </Label>
            <Input
              id="code"
              {...form.register("code")}
              placeholder="REJ-001"
              className={form.formState.errors.code ? "border-danger" : ""}
            />
            {form.formState.errors.code && (
              <p className="text-danger text-xs">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameTh">
              ชื่อ (ไทย) <span className="text-danger">*</span>
            </Label>
            <Input
              id="nameTh"
              {...form.register("nameTh")}
              placeholder="ถุงขาด"
              className={form.formState.errors.nameTh ? "border-danger" : ""}
            />
            {form.formState.errors.nameTh && (
              <p className="text-danger text-xs">
                {form.formState.errors.nameTh.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nameEn">ชื่อ (EN)</Label>
            <Input
              id="nameEn"
              {...form.register("nameEn")}
              placeholder="Damaged Bag"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={3}
            />
          </div>

          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="cursor-pointer">
                  ใช้งาน
                </Label>
                <p className="text-xs text-muted-foreground">
                  ปิดใช้งานเพื่อซ่อนจากรายการ
                </p>
              </div>
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked)
                }
              />
            </div>
          )}

          {serverError && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
              {serverError}
            </div>
          )}

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={savePending}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={savePending}>
              {savePending ? "กำลังบันทึก..." : isEditing ? "บันทึก" : "เพิ่ม"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
