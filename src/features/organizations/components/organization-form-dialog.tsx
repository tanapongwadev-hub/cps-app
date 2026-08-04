"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { organizationSchema, type OrganizationFormValues } from "../schemas/organization-schema";
import type { Organization } from "../api/organizations-api";

export function OrganizationFormDialog({ open, onOpenChange, organization, onSubmit, pending }: {
  open: boolean; onOpenChange: (o: boolean) => void; organization: Organization | null;
  onSubmit: (v: OrganizationFormValues) => Promise<void> | void; pending?: boolean;
}) {
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { code: "", nameTh: "", nameEn: "", taxId: "", address: "", phone: "", email: "", website: "", logoUrl: "", parentId: "", type: "department", isActive: true },
  });
  useEffect(() => {
    if (open) {
      form.reset(
        organization
          ? { code: organization.code, nameTh: organization.nameTh, nameEn: organization.nameEn ?? "", taxId: organization.taxId ?? "", address: organization.address ?? "", phone: organization.phone ?? "", email: organization.email ?? "", website: organization.website ?? "", logoUrl: organization.logoUrl ?? "", parentId: organization.parentId ?? "", type: organization.type, isActive: organization.isActive }
          : { code: "", nameTh: "", nameEn: "", taxId: "", address: "", phone: "", email: "", website: "", logoUrl: "", parentId: "", type: "department", isActive: true },
      );
    }
  }, [open, organization, form]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{organization ? "แก้ไของค์กร" : "เพิ่มองค์กร"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลองค์กร/สาขา</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(async (v) => { await onSubmit(v); })} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">รหัส *</label>
              <Input {...form.register("code")} placeholder="ORG-01" disabled={!!organization} />
              {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">เลขประจำตัวผู้เสียภาษี</label>
              <Input {...form.register("taxId")} placeholder="0105560001234" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">ชื่อ (ไทย) *</label>
              <Input {...form.register("nameTh")} placeholder="บริษัท ABC จำกัด" />
              {form.formState.errors.nameTh && <p className="text-xs text-red-500">{form.formState.errors.nameTh.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">ชื่อ (EN)</label>
              <Input {...form.register("nameEn")} placeholder="ABC Co., Ltd." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">ประเภท</label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as any)}>
                <SelectTrigger><SelectValue placeholder="ประเภท" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="headquarters">สำนักงานใหญ่</SelectItem>
                  <SelectItem value="branch">สาขา</SelectItem>
                  <SelectItem value="subsidiary">บริษัทในเครือ</SelectItem>
                  <SelectItem value="department">แผนก</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Parent ID</label>
              <Input {...form.register("parentId")} placeholder="ไม่ระบุ = องค์กรหลัก" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">โทรศัพท์</label>
              <Input {...form.register("phone")} placeholder="02-123-4567" />
            </div>
            <div>
              <label className="text-sm font-medium">อีเมล</label>
              <Input {...form.register("email")} type="email" placeholder="info@abc.co.th" />
              {form.formState.errors.email && <p className="text-xs text-red-500">{form.formState.errors.email.message}</p>}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">เว็บไซต์</label>
            <Input {...form.register("website")} placeholder="https://abc.co.th" />
          </div>
          <div>
            <label className="text-sm font-medium">ที่อยู่</label>
            <Textarea {...form.register("address")} rows={3} />
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
