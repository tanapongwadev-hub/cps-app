/**
 * Materials page (starter)
 *
 * Backend has the menu seeded but no module endpoint yet. This page shows
 * the module skeleton with mock counts so the sidebar link lands somewhere
 * useful. When /materials endpoint is added, swap the mock for `useQuery`.
 */
"use client";

import * as React from "react";
import { Package, Boxes, AlertTriangle, TrendingUp, Wrench } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Construction } from "lucide-react";

interface MaterialRow {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

const sample: MaterialRow[] = [
  { id: "M-001", code: "BRK-001", name: "ผ้าเบรคหน้า", category: "เบรค", stock: 24, minStock: 10, unit: "ชิ้น", status: "in_stock" },
  { id: "M-002", code: "OIL-002", name: "น้ำมันเครื่อง 10W-40", category: "น้ำมัน", stock: 8, minStock: 10, unit: "ลิตร", status: "low_stock" },
  { id: "M-003", code: "FLT-003", name: "ไส้กรองอากาศ", category: "กรอง", stock: 0, minStock: 5, unit: "ชิ้น", status: "out_of_stock" },
  { id: "M-004", code: "SPK-004", name: "หัวเทียน", category: "เครื่องยนต์", stock: 32, minStock: 15, unit: "ชิ้น", status: "in_stock" },
  { id: "M-005", code: "BAT-005", name: "แบตเตอรี่ 12V", category: "ไฟฟ้า", stock: 5, minStock: 8, unit: "ลูก", status: "low_stock" },
];

const STATUS_VARIANT: Record<MaterialRow["status"], "success" | "warning" | "danger"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
};

const STATUS_LABEL: Record<MaterialRow["status"], string> = {
  in_stock: "ปกติ",
  low_stock: "ใกล้หมด",
  out_of_stock: "หมด",
};

export default function MaterialsPage() {
  // Simulate fetch delay
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const total = sample.length;
  const inStock = sample.filter((m) => m.status === "in_stock").length;
  const lowStock = sample.filter((m) => m.status === "low_stock").length;
  const outOfStock = sample.filter((m) => m.status === "out_of_stock").length;

  return (
    <PageContainer>
      <PageHeader
        title="จัดการอะไหล่"
        description="คลังอะไหล่และวัสดุสิ้นเปลือง"
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/dashboard" },
          { label: "คลังสินค้า" },
          { label: "อะไหล่" },
        ]}
        primaryAction={
          <Button>
            <Wrench className="h-4 w-4" />
            เพิ่มอะไหล่
          </Button>
        }
      />

      {/* Coming-soon callout — swap out when /materials endpoint is ready */}
      <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 p-4 text-sm">
          <Construction className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-300">
              โมดูลตัวอย่าง — ยังไม่ได้เชื่อมต่อ API
            </p>
            <p className="mt-1 text-muted-foreground">
              หน้านี้แสดงข้อมูลตัวอย่าง 5 รายการ เมื่อ backend เพิ่ม{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">GET /materials</code>{" "}
              แล้ว ให้แทนที่ด้วย React Query hook
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <StatCard icon={Package} label="ทั้งหมด" value={total} />
        <StatCard icon={Boxes} label="ปกติ" value={inStock} variant="success" />
        <StatCard icon={AlertTriangle} label="ใกล้หมด" value={lowStock} variant="warning" />
        <StatCard icon={TrendingUp} label="หมดสต็อก" value={outOfStock} variant="danger" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการอะไหล่</CardTitle>
          <CardDescription>แสดง {total} รายการ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Code</th>
                    <th className="px-3 py-2 text-left font-medium">ชื่อ</th>
                    <th className="px-3 py-2 text-left font-medium">หมวด</th>
                    <th className="px-3 py-2 text-right font-medium">คงเหลือ</th>
                    <th className="px-3 py-2 text-right font-medium">ขั้นต่ำ</th>
                    <th className="px-3 py-2 text-center font-medium">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{m.code}</td>
                      <td className="px-3 py-2 font-medium">{m.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{m.category}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {m.stock} {m.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                        {m.minStock} {m.unit}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant={STATUS_VARIANT[m.status]}>{STATUS_LABEL[m.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const colorClass =
    variant === "success"
      ? "text-emerald-600"
      : variant === "warning"
        ? "text-amber-600"
        : variant === "danger"
          ? "text-red-600"
          : "";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className={`text-xl font-semibold ${colorClass}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
