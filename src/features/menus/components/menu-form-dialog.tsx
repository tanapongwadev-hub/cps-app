"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconPicker } from "@/components/forms/icon-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MenuItem, MenuFormData } from "@/features/menus/types";

export const EMPTY_MENU_FORM: MenuFormData = {
  code: "",
  nameTh: "",
  nameEn: "",
  parentId: null,
  menuType: "MAIN",
  path: "",
  icon: "",
  sortOrder: 100,
  isVisible: true,
  isActive: true,
  openInNewTab: false,
  externalUrl: "",
  description: "",
};

/** Normalize a MenuItem into the flat form-state shape used by the dialog. */
export function menuToForm(m: MenuItem): MenuFormData {
  // Normalize menuType: backend uses "SUB", frontend uses "MENU"
  const rawType = m.menuType as unknown as string;
  const menuType: MenuFormData["menuType"] =
    rawType === "SUB" ? "MENU" : (rawType as MenuFormData["menuType"]);

  // parentId: backend may use parent.id (list) or parentId (detail) — fallback
  const parentId = m.parentId ?? m.parent?.id ?? null;

  return {
    code: m.code,
    nameTh: m.nameTh,
    nameEn: m.nameEn,
    parentId,
    menuType,
    path: m.path ?? "",
    icon: m.icon ?? "",
    sortOrder: m.sortOrder,
    isVisible: m.isVisible,
    isActive: m.isActive,
    openInNewTab: m.openInNewTab ?? false,
    externalUrl: m.externalUrl ?? "",
    description: m.description ?? "",
  };
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function MenuFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  mode,
  initial,
  onSubmit,
  isPending,
  allMenus,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  submitLabel: string;
  /** "create" → POST /menus; "update" → PATCH /menus/:id. The two endpoints
   *  accept different field sets (see filter below). */
  mode: "create" | "update";
  initial?: MenuFormData | null;
  onSubmit: (data: Partial<MenuItem>) => void;
  isPending: boolean;
  allMenus: MenuItem[];
}) {
  const [form, setForm] = React.useState<MenuFormData>(initial ?? EMPTY_MENU_FORM);

  React.useEffect(() => {
    if (open) setForm(initial ?? EMPTY_MENU_FORM);
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.nameTh || !form.nameEn) return;

    // Map frontend menuType → backend menuType (MENU → SUB).
    // The backend's enum is MAIN | SUB; the frontend exposes MAIN | MENU | BUTTON
    // so admins can pick a non-routing "action" type in the UI.
    const backendMenuType =
      form.menuType === "MENU" ? "SUB" : form.menuType;

    // Strip fields the backend rejects for the current mode.
    const payload: Partial<MenuItem> = {
      code: form.code,
      nameTh: form.nameTh,
      nameEn: form.nameEn,
      parentId: form.parentId,
      menuType: backendMenuType as unknown as MenuItem["menuType"],
      path: form.path || null,
      icon: form.icon || null,
      sortOrder: form.sortOrder,
    };
    if (mode === "update") {
      payload.isVisible = form.isVisible;
      payload.isActive = form.isActive;
    }
    onSubmit(payload);
  };

  const codeId = React.useId();
  const sortOrderId = React.useId();
  const nameThId = React.useId();
  const nameEnId = React.useId();
  const menuTypeId = React.useId();
  const parentIdField = React.useId();
  const pathId = React.useId();
  const iconId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลเมนู — <code className="font-mono">nameEn</code> ต้องไม่ว่าง
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code *" htmlFor={codeId}>
              <Input
                id={codeId}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MENU_CODE"
                required
              />
            </Field>
            <Field label="Sort order" htmlFor={sortOrderId}>
              <Input
                id={sortOrderId}
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <Field label="ชื่อ (ไทย) *" htmlFor={nameThId}>
            <Input
              id={nameThId}
              value={form.nameTh}
              onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
              placeholder="จัดการอะไหล่"
              required
            />
          </Field>
          <Field label="ชื่อ (English) *" htmlFor={nameEnId}>
            <Input
              id={nameEnId}
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder="Materials Management"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Menu type" htmlFor={menuTypeId}>
              <Select
                value={form.menuType}
                onValueChange={(v) => setForm({ ...form, menuType: v as MenuFormData["menuType"] })}
              >
                <SelectTrigger id={menuTypeId} className="w-full">
                  <SelectValue className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">MAIN — เมนูหลัก (top-level)</SelectItem>
                  <SelectItem value="MENU">MENU — เมนูย่อย (child)</SelectItem>
                  <SelectItem value="BUTTON">BUTTON — ปุ่ม action</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Parent" htmlFor={parentIdField}>
              <Select
                value={form.parentId ?? "_root"}
                onValueChange={(v) =>
                  setForm({ ...form, parentId: v === "_root" ? null : v })
                }
              >
                <SelectTrigger id={parentIdField} className="w-full">
                  <SelectValue className="truncate" placeholder="เลือกเมนูหลัก..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_root">(ไม่มี — top level)</SelectItem>
                  {allMenus
                    .filter((m) => m.menuType !== "MENU")
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nameTh} ({m.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Path" htmlFor={pathId}>
              <Input
                id={pathId}
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
                placeholder="/example"
              />
            </Field>
            <Field label="Icon" htmlFor={iconId}>
              <IconPicker
                id={iconId}
                value={form.icon}
                onChange={(v) => setForm({ ...form, icon: v })}
                placeholder="เลือก icon..."
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isVisible}
                onCheckedChange={(v) => setForm({ ...form, isVisible: v })}
              />
              แสดงใน Sidebar
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              เปิดใช้งาน
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.openInNewTab}
                onCheckedChange={(v) => setForm({ ...form, openInNewTab: v })}
              />
              เปิดแท็บใหม่
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" />
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
