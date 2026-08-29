import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PermissionDepartmentRef } from "@/features/permissions/types";

function departmentLabel(department: PermissionDepartmentRef) {
  return department.nameTh ?? department.nameEn ?? department.name ?? department.code;
}

export function PermissionDepartmentSummary({
  departments,
}: {
  departments: PermissionDepartmentRef[];
}) {
  if (departments.length === 0) {
    return (
      <Badge variant="success" className="gap-1 whitespace-nowrap">
        <Building2 className="h-3 w-3" />
        ทุกแผนก
      </Badge>
    );
  }

  const visible = departments.slice(0, 2);
  const remaining = departments.length - visible.length;

  return (
    <div className="flex max-w-72 flex-wrap gap-1">
      {visible.map((department) => (
        <Badge key={department.id} variant="outline" className="max-w-36 truncate font-normal">
          {departmentLabel(department)}
        </Badge>
      ))}
      {remaining > 0 && <Badge variant="secondary">+{remaining}</Badge>}
    </div>
  );
}
