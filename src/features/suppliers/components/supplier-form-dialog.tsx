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
import { supplierSchema, type SupplierFormValues } from "../schemas/supplier-schema";
import type { Supplier } from "../api/suppliers-api";

export interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSubmit: (values: SupplierFormValues) => Promise<void> | void;
  pending?: boolean;
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  onSubmit,
  pending,
}: SupplierFormDialogProps) {
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: "",
      nameTh: "",
      nameEn: "",
      taxId: "",
      contactName: "",
      telephone: "",
      email: "",
      address: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        supplier
          ? {
              code: supplier.code,
              nameTh: supplier.nameTh,
              nameEn: supplier.nameEn ?? "",
              taxId: supplier.taxId ?? "",
              contactName: supplier.contactName ?? "",
              telephone: supplier.telephone ?? "",
              email: supplier.email ?? "",
              address: supplier.address ?? "",
              isActive: supplier.isActive,
            }
          : {
              code: "",
              nameTh: "",
              nameEn: "",
              taxId: "",
              contactName: "",
              telephone: "",
              email: "",
              address: "",
              isActive: true,
            },
      );
    }
  }, [open, supplier, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "แก้ไขผู้จัดจำหน่าย" : "เพิ่มผู้จัดจำหน่าย"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลผู้จัดจำหน่ายให้ครบถ้วน</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">รหัส *</label>
              <Input
                {...form.register("code")}
                placeholder="SUP-001"
                disabled={!!supplier}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">เลขประจำตัวผู้เสียภาษี</label>
              <Input {...form.register("taxId")} placeholder="0105560001234" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
              <Input {...form.register("nameTh")} placeholder="บริษัท ABC" />
              {form.formState.errors.nameTh && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.nameTh.message}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">ชื่อ (EN)</label>
              <Input {...form.register("nameEn")} placeholder="ABC Co." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">ชื่อผู้ติดต่อ</label>
              <Input {...form.register("contactName")} placeholder="สมชาย" />
            </div>
            <div>
              <label className="text-sm font-medium">โทรศัพท์</label>
              <Input {...form.register("telephone")} placeholder="02-123-4567" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">อีเมล</label>
            <Input
              {...form.register("email")}
              type="email"
              placeholder="contact@abc.co.th"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">ที่อยู่</label>
            <Textarea {...form.register("address")} rows={3} />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
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
