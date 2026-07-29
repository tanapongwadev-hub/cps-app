"use client";

import * as React from "react";
import { Building2, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { SelectField } from "@/components/forms/form-field";
import type { Department } from "@/types/department";
import type { Role } from "@/types/role";
import type { UpdateUserFormValues } from "../schemas/user-schema";

interface EditUserAssignmentsProps {
  form: UseFormReturn<UpdateUserFormValues>;
  departments: Department[];
  roles: Role[];
  disabled?: boolean;
}

function departmentLabel(department: Department) {
  return department.nameTh ?? department.name ?? department.nameEn ?? department.code;
}

function roleLabel(role: Role) {
  return role.nameTh ?? role.nameEn ?? role.name ?? role.code;
}

function roleScope(role: Role | undefined): "SYSTEM" | "DEPARTMENT" {
  return role?.scopeType === "SYSTEM" || role?.isSystem ? "SYSTEM" : "DEPARTMENT";
}

export function EditUserAssignments({
  form,
  departments,
  roles,
  disabled = false,
}: EditUserAssignmentsProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "assignments",
    keyName: "fieldKey",
  });
  const assignments = form.watch("assignments");
  const [pendingDeleteIndex, setPendingDeleteIndex] = React.useState<number | null>(null);

  const pendingAssignment = pendingDeleteIndex === null ? null : assignments[pendingDeleteIndex];
  const pendingDepartment = departments.find(
    (department) => department.id === pendingAssignment?.departmentId,
  );
  const pendingRole = roles.find((role) => role.id === pendingAssignment?.roleId);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {fields.map((field, index) => {
          const assignment = assignments[index];
          const isSystem = assignment?.roleScopeType === "SYSTEM";
          const errors = form.formState.errors.assignments?.[index];
          const selectedDepartment = departments.find(
            (department) => department.id === assignment?.departmentId,
          );
          const selectedRole = roles.find((role) => role.id === assignment?.roleId);
          const deleteLabel = [
            isSystem
              ? "ทุกแผนก (System)"
              : selectedDepartment
                ? departmentLabel(selectedDepartment)
                : "Assignment",
            selectedRole ? roleLabel(selectedRole) : "",
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <div
              key={field.fieldKey}
              data-testid="assignment-row"
              className="bg-card rounded-lg border p-3 shadow-xs"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Assignment {index + 1}</p>
                    <p className="text-muted-foreground truncate text-xs">{deleteLabel}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled || fields.length === 1}
                  onClick={() => setPendingDeleteIndex(index)}
                  aria-label={`ลบ Assignment ${index + 1}`}
                  className="text-danger hover:bg-danger/10 hover:text-danger shrink-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {isSystem ? (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">แผนก</p>
                    <div className="bg-muted/40 flex h-9 items-center gap-2 rounded-md border px-3">
                      <ShieldCheck className="text-primary size-4" />
                      <span className="text-sm">ทุกแผนก (System)</span>
                      <Badge variant="info" className="ml-auto text-[10px]">
                        SYSTEM
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <SelectField
                    label="แผนก"
                    required
                    disabled={disabled}
                    value={assignment?.departmentId ?? ""}
                    onValueChange={(departmentId) =>
                      form.setValue(`assignments.${index}.departmentId`, departmentId, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    options={departments.map((department) => ({
                      value: department.id,
                      label: departmentLabel(department),
                      disabled: department.isActive === false || department.status === "inactive",
                    }))}
                    placeholder="เลือกแผนก..."
                    error={errors?.departmentId?.message}
                  />
                )}

                <SelectField
                  label="บทบาท"
                  required
                  disabled={disabled}
                  value={assignment?.roleId ?? ""}
                  onValueChange={(roleId) => {
                    const selected = roles.find((role) => role.id === roleId);
                    const scope = roleScope(selected);
                    form.setValue(`assignments.${index}.roleId`, roleId, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    form.setValue(`assignments.${index}.roleScopeType`, scope, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    if (scope === "SYSTEM") {
                      form.setValue(`assignments.${index}.departmentId`, null, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    } else if (assignment?.departmentId === null) {
                      form.setValue(`assignments.${index}.departmentId`, "", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                  options={roles.map((role) => ({
                    value: role.id,
                    label: roleLabel(role),
                    disabled: role.isActive === false || role.status === "inactive",
                  }))}
                  placeholder="เลือกบทบาท..."
                  error={errors?.roleId?.message}
                />
              </div>
            </div>
          );
        })}
      </div>

      {fields.length === 1 && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <Building2 className="size-3.5" />
          ผู้ใช้ต้องมีอย่างน้อย 1 Assignment
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full border-dashed"
        disabled={disabled}
        onClick={() =>
          append({
            departmentId: "",
            roleId: "",
            roleScopeType: "DEPARTMENT",
          })
        }
      >
        <Plus className="size-4" />
        เพิ่ม Assignment
      </Button>

      <ConfirmDialog
        open={pendingDeleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteIndex(null);
        }}
        title="ยืนยันการลบ Assignment?"
        description={
          <span>
            รายการ{" "}
            <strong>
              {pendingAssignment?.roleScopeType === "SYSTEM"
                ? "ทุกแผนก (System)"
                : pendingDepartment
                  ? departmentLabel(pendingDepartment)
                  : "แผนกที่เลือก"}{" "}
              · {pendingRole ? roleLabel(pendingRole) : "บทบาทที่เลือก"}
            </strong>{" "}
            จะถูกลบเมื่อบันทึกการเปลี่ยนแปลง
          </span>
        }
        confirmText="ลบ"
        cancelText="ยกเลิก"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteIndex !== null && fields.length > 1) {
            remove(pendingDeleteIndex);
          }
          setPendingDeleteIndex(null);
        }}
      />
    </div>
  );
}
