"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { categorySchema, type CategoryFormValues } from "../schemas/category-schema";
import type { Category } from "../api/categories-api";

export function CategoryFormDialog({ open, onOpenChange, category, onSubmit, pending }: {
  open: boolean; onOpenChange: (o: boolean) => void; category: Category | null;
  onSubmit: (v: CategoryFormValues) => Promise<void> | void; pending?: boolean;
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { code: "", nameTh: "", nameEn: "", parentId: "", sortOrder: 0, iconColor: "", description: "", isActive: true },
  });
  useEffect(() => {
    if (open) {
      form.reset(
        category
          ? { code: category.code, nameTh: category.nameTh, nameEn: category.nameEn ?? "", parentId: category.parentId ?? "", sortOrder: category.sortOrder, iconColor: category.iconColor ?? "", description: category.description ?? "", isActive: category.isActive }
          : { code: "", nameTh: "", nameEn: "", parentId: "", sortOrder: 0, iconColor: "", description: "", isActive: true },
      );
    }
  }, [open, category, form]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลหมวดหมู่</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(async (v) => { await onSubmit(v); })} className="space-y-4">
          <div>
            <label className="text-sm font-medium">รหัส *</label>
            <Input {...form.register("code")} placeholder="CAT-01" disabled={!!category} />
            {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
            <Input {...form.register("nameTh")} placeholder="หมวดหมู่ A" />
            {form.formState.errors.nameTh && <p className="text-xs text-red-500">{form.formState.errors.nameTh.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">ชื่อ (EN)</label>
              <Input {...form.register("nameEn")} placeholder="Category A" />
            </div>
            <div>
              <label className="text-sm font-medium">ลำดับ</label>
              <Input type="number" {...form.register("sortOrder")} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Parent ID</label>
            <Input {...form.register("parentId")} placeholder="ไม่ระบุ = หมวดหมู่หลัก" />
          </div>
          <div>
            <label className="text-sm font-medium">สีไอคอน</label>
            <Input {...form.register("iconColor")} placeholder="blue / red / green" />
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
