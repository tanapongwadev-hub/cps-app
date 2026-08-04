"use client";

import * as React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { loadingPointSchema, type LoadingPointFormValues } from "../schemas/loading-point-schema";
import type { LoadingPoint } from "../api/loading-points-api";

export function LoadingPointFormDialog({ open, onOpenChange, point, onSubmit, pending }: {
  open: boolean; onOpenChange: (o: boolean) => void; point: LoadingPoint | null;
  onSubmit: (v: LoadingPointFormValues) => Promise<void> | void; pending?: boolean;
}) {
  const form = useForm<LoadingPointFormValues>({
    resolver: zodResolver(loadingPointSchema),
    defaultValues: { code: "", nameTh: "", nameEn: "", description: "", isActive: true },
  });
  useEffect(() => {
    if (open) {
      form.reset(
        point
          ? { code: point.code, nameTh: point.nameTh, nameEn: point.nameEn ?? "", description: point.description ?? "", isActive: point.isActive }
          : { code: "", nameTh: "", nameEn: "", description: "", isActive: true },
      );
    }
  }, [open, point, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{point ? "แก้ไขจุดขนถ่าย" : "เพิ่มจุดขนถ่าย"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลจุดขนถ่าย</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(async (v) => { await onSubmit(v); })} className="space-y-4">
          <div>
            <label className="text-sm font-medium">รหัส *</label>
            <Input {...form.register("code")} placeholder="LP-01" disabled={!!point} />
            {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
            <Input {...form.register("nameTh")} placeholder="จุดขนถ่าย A" />
            {form.formState.errors.nameTh && <p className="text-xs text-red-500">{form.formState.errors.nameTh.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (EN)</label>
            <Input {...form.register("nameEn")} placeholder="Loading Point A" />
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
