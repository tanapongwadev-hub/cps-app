"use client";

import * as React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { materialModelSchema, type MaterialModelFormValues } from "../schemas/material-model-schema";
import type { MaterialModel } from "../api/material-models-api";

export interface MaterialModelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: MaterialModel | null;
  onSubmit: (values: MaterialModelFormValues) => Promise<void> | void;
  pending?: boolean;
}

export function MaterialModelFormDialog({
  open,
  onOpenChange,
  model,
  onSubmit,
  pending,
}: MaterialModelFormDialogProps) {
  const form = useForm<MaterialModelFormValues>({
    resolver: zodResolver(materialModelSchema),
    defaultValues: { code: "", nameTh: "", nameEn: "", description: "", isActive: true },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        model
          ? {
              code: model.code,
              nameTh: model.nameTh,
              nameEn: model.nameEn ?? "",
              description: model.description ?? "",
              isActive: model.isActive,
            }
          : { code: "", nameTh: "", nameEn: "", description: "", isActive: true },
      );
    }
  }, [open, model, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{model ? "แก้ไขรุ่นวัสดุ" : "เพิ่มรุ่นวัสดุ"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลรุ่นวัสดุ</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (v) => {
            await onSubmit(v);
          })}
          className="space-y-4"
        >
          <div>
            <label className="text-sm font-medium">รหัส *</label>
            <Input {...form.register("code")} placeholder="MD-01" disabled={!!model} />
            {form.formState.errors.code && (
              <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
            <Input {...form.register("nameTh")} placeholder="รุ่น A" />
            {form.formState.errors.nameTh && (
              <p className="text-xs text-red-500">{form.formState.errors.nameTh.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (EN)</label>
            <Input {...form.register("nameEn")} placeholder="Model A" />
          </div>
          <div>
            <label className="text-sm font-medium">คำอธิบาย</label>
            <Textarea {...form.register("description")} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
