"use client";

import * as React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deliveryTypeSchema, type DeliveryTypeFormValues } from "../schemas/delivery-type-schema";
import type { DeliveryType } from "../api/delivery-types-api";

export function DeliveryTypeFormDialog({
  open, onOpenChange, type, onSubmit, pending,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; type: DeliveryType | null;
  onSubmit: (v: DeliveryTypeFormValues) => Promise<void> | void; pending?: boolean;
}) {
  const form = useForm<DeliveryTypeFormValues>({
    resolver: zodResolver(deliveryTypeSchema),
    defaultValues: { code: "", nameTh: "", nameEn: "", description: "", isActive: true },
  });
  useEffect(() => {
    if (open) {
      form.reset(
        type
          ? { code: type.code, nameTh: type.nameTh, nameEn: type.nameEn ?? "", description: type.description ?? "", isActive: type.isActive }
          : { code: "", nameTh: "", nameEn: "", description: "", isActive: true },
      );
    }
  }, [open, type, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type ? "แก้ไขประเภทการจัดส่ง" : "เพิ่มประเภทการจัดส่ง"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลประเภทการจัดส่ง</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(async (v) => { await onSubmit(v); })} className="space-y-4">
          <div>
            <label className="text-sm font-medium">รหัส *</label>
            <Input {...form.register("code")} placeholder="DT-01" disabled={!!type} />
            {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
            <Input {...form.register("nameTh")} placeholder="จัดส่งด่วน" />
            {form.formState.errors.nameTh && <p className="text-xs text-red-500">{form.formState.errors.nameTh.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (EN)</label>
            <Input {...form.register("nameEn")} placeholder="Express" />
          </div>
          <div>
            <label className="text-sm font-medium">คำอธิบาย</label>
            <Textarea {...form.register("description")} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>ยกเลิก</Button>
            <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
