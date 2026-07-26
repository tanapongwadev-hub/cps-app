"use client";

import { BarChart3, Download, Calendar, TrendingUp } from "lucide-react";
import { PageContainer, PageHeader, PageFooter } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, DateRangePicker } from "@/components/forms/form-field";
import { showToast } from "@/lib/toast";

export default function SummaryReportPage() {
  return (
    <>
      <PageContainer>
        <PageHeader
          title="รายงานสรุป"
          description="ภาพรวมตัวชี้วัดและสถิติที่สำคัญ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "รายงาน" },
            { label: "รายงานสรุป" },
          ]}
          primaryAction={
            <Button onClick={() => showToast.info("ส่งออกรายงาน", "ระบบจะส่งออกไฟล์ PDF / Excel")}>
              <Download className="h-4 w-4" />
              ส่งออกรายงาน
            </Button>
          }
        />

        <Card className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DateRangePicker />
            <SelectField
              defaultValue="month"
              options={[
                { value: "day", label: "รายวัน" },
                { value: "week", label: "รายสัปดาห์" },
                { value: "month", label: "รายเดือน" },
                { value: "year", label: "รายปี" },
              ]}
            />
            <SelectField
              defaultValue="all"
              options={[
                { value: "all", label: "ทุกแผนก" },
                { value: "it", label: "เทคโนโลยีสารสนเทศ" },
                { value: "hr", label: "ทรัพยากรบุคคล" },
                { value: "finance", label: "การเงิน" },
              ]}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="คำขอทั้งหมด" value="1,289" change="+11.5%" trend="up" />
          <StatCard label="เสร็จสิ้น" value="1,198" change="+14.9%" trend="up" />
          <StatCard label="รอดำเนินการ" value="47" change="-24.2%" trend="down" />
          <StatCard label="เวลาเฉลี่ย" value="2.3 ชม." change="-12.4%" trend="up" />
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">สรุปผลการดำเนินงาน</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            กราฟและตารางสรุปจะแสดงที่นี่ สามารถเพิ่ม recharts component เพื่อแสดงข้อมูลเชิงลึก
          </p>
        </Card>
      </PageContainer>
      <PageFooter />
    </>
  );
}

function StatCard({ label, value, change, trend }: { label: string; value: string; change: string; trend: "up" | "down" }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <div className="mt-2 flex items-center gap-1 text-xs">
        <TrendingUp className={`h-3 w-3 ${trend === "up" ? "text-success" : "text-danger rotate-180"}`} />
        <span className={trend === "up" ? "text-success font-medium" : "text-danger font-medium"}>{change}</span>
        <span className="text-muted-foreground">vs เดือนก่อน</span>
      </div>
    </Card>
  );
}

void Calendar;
