"use client";

import * as React from "react";
import { Building2, Search, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Permission, PermissionDepartmentRef } from "@/types/permission";
import {
  usePermissionDepartments,
  useUpdatePermissionDepartments,
} from "../hooks/use-permissions";

export interface DepartmentPermissionDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  permission: Permission | null;
}

function departmentLabel(department: PermissionDepartmentRef) {
  return department.nameTh ?? department.nameEn ?? department.name ?? department.code;
}

export function DepartmentPermissionDialog({
  open,
  onOpenChange,
  permission,
}: DepartmentPermissionDialogProps) {
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const departmentsQuery = usePermissionDepartments(open);
  const updateDepartments = useUpdatePermissionDepartments();
  const departments = React.useMemo(
    () => departmentsQuery.data?.items ?? [],
    [departmentsQuery.data?.items],
  );

  React.useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelectedIds(new Set((permission?.departments ?? []).map((department) => department.id)));
  }, [open, permission]);

  const filteredDepartments = React.useMemo(() => {
    const term = search.trim().toLocaleLowerCase("th");
    if (!term) return departments;
    return departments.filter((department) =>
      [department.code, department.nameTh, department.nameEn, department.name]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .some((value) => value.toLocaleLowerCase("th").includes(term)),
    );
  }, [departments, search]);

  const toggleDepartment = (departmentId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(departmentId);
      else next.delete(departmentId);
      return next;
    });
  };

  const selectVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      for (const department of filteredDepartments) next.add(department.id);
      return next;
    });
  };

  const save = async () => {
    if (!permission) return;
    try {
      await updateDepartments.mutateAsync({
        id: permission.id,
        departmentIds: departments
          .filter((department) => selectedIds.has(department.id))
          .map((department) => department.id),
      });
      onOpenChange(false);
    } catch {
      // Mutation owns the user-facing toast; keep the dialog state intact.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            กำหนดแผนก
          </DialogTitle>
          <DialogDescription>
            เลือกแผนกที่ใช้สิทธิ์ <span className="font-mono text-foreground">{permission?.code}</span>{" "}
            ได้
          </DialogDescription>
        </DialogHeader>

        <div
          className={
            selectedIds.size === 0
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3"
              : "rounded-lg border bg-muted/35 p-3"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck
                className={
                  selectedIds.size === 0
                    ? "h-4 w-4 text-emerald-600"
                    : "h-4 w-4 text-muted-foreground"
                }
              />
              <div>
                <p className="text-sm font-medium">
                  {selectedIds.size === 0
                    ? "ใช้งานได้ทุกแผนก"
                    : `จำกัด ${selectedIds.size} แผนก`}
                </p>
                <p className="text-xs text-muted-foreground">
                  ไม่เลือกแผนก หมายถึงอนุญาตให้ทุกแผนกใช้งาน
                </p>
              </div>
            </div>
            <Badge variant={selectedIds.size === 0 ? "success" : "secondary"}>
              เลือกแล้ว {selectedIds.size}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาแผนก..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={selectVisible}>
              เลือกทั้งหมด
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              ล้างทั้งหมด
            </Button>
          </div>
        </div>

        <ScrollArea className="h-64 rounded-md border">
          {departmentsQuery.isLoading ? (
            <p className="p-5 text-center text-sm text-muted-foreground">กำลังโหลดแผนก...</p>
          ) : departmentsQuery.isError ? (
            <p className="p-5 text-center text-sm text-danger">โหลดรายการแผนกไม่สำเร็จ</p>
          ) : filteredDepartments.length === 0 ? (
            <p className="p-5 text-center text-sm text-muted-foreground">ไม่พบแผนกที่ค้นหา</p>
          ) : (
            <div className="divide-y">
              {filteredDepartments.map((department) => {
                const label = departmentLabel(department);
                const checkboxId = `permission-department-${department.id}`;
                return (
                  <label
                    key={department.id}
                    htmlFor={checkboxId}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <Checkbox
                      id={checkboxId}
                      aria-label={`${label} (${department.code})`}
                      checked={selectedIds.has(department.id)}
                      onCheckedChange={(checked) =>
                        toggleDepartment(department.id, checked === true)
                      }
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {department.code}
                        {department.nameEn && department.nameEn !== label
                          ? ` · ${department.nameEn}`
                          : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            type="button"
            onClick={save}
            loading={updateDepartments.isPending}
            disabled={!permission || departmentsQuery.isLoading}
          >
            บันทึกการกำหนดแผนก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
