"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { statusItemSchema, type StatusItemFormValues } from "../schemas/status-item-schema";
import type { StatusItem } from "../api/status-items-api";

export function StatusItemFormDialog({ open, onOpenChange, item, onSubmit, pending }: {
  open: boolean; onOpenChange: (o: boolean) => void; item: StatusItem | null;
  onSubmit: (v: StatusItemFormValues) => Promise<void> | void; pending?: boolean;
}) {
  const form = useForm<StatusItemFormValues>({
    resolver: zodResolver(statusItemSchema),
    defaultValues: { code: "", nameTh: "", nameEn: "", color: "info", module: "", isDefault: false, sortOrder: 0, description: "", isActive: true },
  });
  useEffect(() => {
    if (open) {
      form.reset(
        item
          ? { code: item.code, nameTh: item.nameTh, nameEn: item.nameEn ?? "", color: item.color as any, module: item.module, isDefault: item.isDefault, sortOrder: item.sortOrder, description: item.description ?? "", isActive: item.isActive }
          : { code: "", nameTh: "", nameEn: "", color: "info", module: "", isDefault: false, sortOrder: 0, description: "", isActive: true },
      );
    }
  }, [open, item, form]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "แก้ไขสถานะ" : "เพิ่มสถานะ"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลสถานะ</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(async (v) => { await onSubmit(v); })} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">รหัส *</label>
              <Input {...form.register("code")} placeholder="ST-01" disabled={!!item} />
              {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">โมดูล *</label>
              <Input {...form.register("module")} placeholder="tickets" />
              {form.formState.errors.module && <p className="text-xs text-red-500">{form.formState.errors.module.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
            <Input {...form.register("nameTh")} placeholder="เปิด" />
            {form.formState.errors.nameTh && <p className="text-xs text-red-500">{form.formState.errors.nameTh.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (EN)</label>
            <Input {...form.register("nameEn")} placeholder="Open" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">สี</label>
              <Select value={form.watch("color")} onValueChange={(v) => form.setValue("color", v as any)}>
                <SelectTrigger><SelectValue placeholder="สี" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="danger">Danger</SelectItem>
                  <SelectItem value="muted">Muted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">ลำดับ</label>
              <Input type="number" {...form.register("sortOrder")} />
            </div>
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
