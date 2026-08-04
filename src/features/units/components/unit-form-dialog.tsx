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
import { unitSchema, type UnitFormValues } from "../schemas/unit-schema";
import type { Unit } from "../api/units-api";

export interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: Unit | null;
  onSubmit: (values: UnitFormValues) => Promise<void> | void;
  pending?: boolean;
}

export function UnitFormDialog({
  open,
  onOpenChange,
  unit,
  onSubmit,
  pending,
}: UnitFormDialogProps) {
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      code: "",
      nameTh: "",
      nameEn: "",
      symbol: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        unit
          ? {
              code: unit.code,
              nameTh: unit.nameTh,
              nameEn: unit.nameEn ?? "",
              symbol: unit.symbol ?? "",
              description: unit.description ?? "",
              isActive: unit.isActive,
            }
          : {
              code: "",
              nameTh: "",
              nameEn: "",
              symbol: "",
              description: "",
              isActive: true,
            },
      );
    }
  }, [open, unit, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{unit ? "แก้ไขหน่วยนับ" : "เพิ่มหน่วยนับ"}</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลหน่วยนับให้ครบถ้วน
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">รหัส *</label>
            <Input
              {...form.register("code")}
              placeholder="PCS"
              disabled={!!unit}
            />
            {form.formState.errors.code && (
              <p className="text-xs text-red-500">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
            <Input {...form.register("nameTh")} placeholder="ชิ้น" />
            {form.formState.errors.nameTh && (
              <p className="text-xs text-red-500">
                {form.formState.errors.nameTh.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">ชื่อ (EN)</label>
            <Input {...form.register("nameEn")} placeholder="Piece" />
            {form.formState.errors.nameEn && (
              <p className="text-xs text-red-500">
                {form.formState.errors.nameEn.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">สัญลักษณ์</label>
            <Input {...form.register("symbol")} placeholder="ชิ้น" />
          </div>
          <div>
            <label className="text-sm font-medium">คำอธิบาย</label>
            <Textarea {...form.register("description")} rows={3} />
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
