"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Save } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/forms/form-field";
import { FormSection, FormGrid } from "@/components/forms/form-section";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  type CreateDepartmentFormValues,
  type UpdateDepartmentFormValues,
} from "../schemas/department-schema";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/features/users/hooks/use-departments";
import type { Department } from "@/types/department";

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
}: DepartmentFormDialogProps) {
  const isEdit = !!department;
  const create = useCreateDepartment();
  const update = useUpdateDepartment();

  const formCreate = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      code: "",
      nameTh: "",
      nameEn: "",
    },
  });

  const formUpdate = useForm<UpdateDepartmentFormValues>({
    resolver: zodResolver(updateDepartmentSchema),
    defaultValues: {
      nameTh: department?.nameTh ?? "",
      nameEn: department?.nameEn ?? "",
    },
  });

  // Reset forms when dialog opens / department changes
  React.useEffect(() => {
    if (isEdit && department) {
      formUpdate.reset({
        nameTh: department.nameTh,
        nameEn: department.nameEn,
      });
    }
    if (!isEdit) {
      formCreate.reset({ code: "", nameTh: "", nameEn: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, isEdit, open]);

  const onSubmitCreate = async (values: CreateDepartmentFormValues) => {
    try {
      await create.mutateAsync({
        ...values,
        // Backend expects uppercase codes by convention
        code: values.code.toUpperCase(),
      });
      onOpenChange(false);
    } catch {
      // toast handled by mutation onError
    }
  };

  const onSubmitUpdate = async (values: UpdateDepartmentFormValues) => {
    if (!department) return;
    try {
      await update.mutateAsync({ id: department.id, data: values });
      onOpenChange(false);
    } catch {
      // toast handled by mutation onError
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="xl" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {isEdit ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? `แก้ไขชื่อแผนก — รหัส (${department?.code}) ไม่สามารถเปลี่ยนได้`
              : "สร้างแผนกใหม่ในระบบ"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto pr-1">
          {isEdit ? (
            <form
              onSubmit={formUpdate.handleSubmit(onSubmitUpdate as never)}
              className="space-y-6"
              noValidate
            >
              <FormSection title="ชื่อแผนก">
                <FormGrid cols={2}>
                  <TextField
                    label="ชื่อภาษาไทย"
                    required
                    error={formUpdate.formState.errors.nameTh?.message}
                    {...formUpdate.register("nameTh")}
                  />
                  <TextField
                    label="ชื่อภาษาอังกฤษ"
                    required
                    error={formUpdate.formState.errors.nameEn?.message}
                    {...formUpdate.register("nameEn")}
                  />
                </FormGrid>
                <p className="text-xs text-muted-foreground">
                  รหัสแผนก: <code className="font-mono">{department?.code}</code>
                </p>
              </FormSection>
              <SheetFooter className="px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" loading={update.isPending}>
                  <Save className="h-4 w-4" />
                  บันทึกการเปลี่ยนแปลง
                </Button>
              </SheetFooter>
            </form>
          ) : (
            <form
              onSubmit={formCreate.handleSubmit(onSubmitCreate as never)}
              className="space-y-6"
              noValidate
            >
              <FormSection title="ข้อมูลแผนก">
                <TextField
                  label="รหัสแผนก"
                  required
                  description="ตัวอักษรภาษาอังกฤษตัวพิมพ์ใหญ่ ตัวเลข _ และ - เท่านั้น"
                  error={formCreate.formState.errors.code?.message}
                  {...formCreate.register("code", {
                    setValueAs: (v: string) => (typeof v === "string" ? v.toUpperCase() : v),
                  })}
                />
                <FormGrid cols={2}>
                  <TextField
                    label="ชื่อภาษาไทย"
                    required
                    error={formCreate.formState.errors.nameTh?.message}
                    {...formCreate.register("nameTh")}
                  />
                  <TextField
                    label="ชื่อภาษาอังกฤษ"
                    required
                    error={formCreate.formState.errors.nameEn?.message}
                    {...formCreate.register("nameEn")}
                  />
                </FormGrid>
              </FormSection>
              <SheetFooter className="px-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" loading={create.isPending}>
                  <Save className="h-4 w-4" />
                  สร้างแผนก
                </Button>
              </SheetFooter>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
