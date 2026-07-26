"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Building2, Users } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionMenu } from "@/components/tables/action-menu";
import { apiClient } from "@/services/api-client";
import { showToast } from "@/lib/toast";
import type { Department } from "@/types/auth";
import type { PaginatedList } from "@/types/paginated";

export default function DepartmentsPage() {
  const [data, setData] = React.useState<Department[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      // The real backend returns { items, meta } — extract the array.
      // Fall back to `res` as an array in case the backend later returns a flat list.
      const res = await apiClient.get<PaginatedList<Department> | Department[]>("/departments");
      const items = Array.isArray(res) ? res : (res.items ?? []);
      setData(items);
    } catch {
      showToast.error("ไม่สามารถโหลดข้อมูลแผนกได้");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageContainer>
        <PageHeader
          title="แผนก"
          description="จัดการโครงสร้างแผนกในองค์กร"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "การจัดการผู้ใช้งาน" },
            { label: "แผนก" },
          ]}
          primaryAction={
            <Button onClick={() => showToast.info("สร้างแผนก", "ฟีเจอร์นี้จะพร้อมใช้งานเร็วๆ นี้")}>
              <Plus className="h-4 w-4" />
              เพิ่มแผนก
            </Button>
          }
        />

        <Card className="p-5">
          <h3 className="text-sm font-semibold mb-4">โครงสร้างแผนก</h3>
          {loading ? (
            <div className="text-sm text-muted-foreground py-8 text-center">กำลังโหลด...</div>
          ) : (
            <ul className="space-y-1">
              {data.map((dept) => (
                <DepartmentRow key={dept.id} dept={dept} level={0} />
              ))}
            </ul>
          )}
        </Card>
      </PageContainer>
      <PageFooter />
    </>
  );
}

function DepartmentRow({ dept, level }: { dept: Department; level: number }) {
  return (
    <>
      <li
        className="flex items-center justify-between rounded-md border bg-card p-3"
        style={{ marginLeft: level * 24 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{dept.name}</p>
            <p className="text-xs text-muted-foreground">{dept.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {dept.userCount ?? 0}
          </Badge>
          <Badge variant={dept.status === "active" ? "success" : "muted"}>
            {dept.status === "active" ? "ใช้งาน" : "ระงับ"}
          </Badge>
          <ActionMenu
            label={`เมนู ${dept.name}`}
            items={[
              { label: "แก้ไข", icon: <Pencil className="h-3.5 w-3.5" />, onClick: () => {} },
              { label: "ลบ", icon: <Trash2 className="h-3.5 w-3.5" />, variant: "danger", onClick: () => {} },
            ]}
          />
        </div>
      </li>
      {dept.children?.map((c) => (
        <DepartmentRow key={c.id} dept={c} level={level + 1} />
      ))}
    </>
  );
}
