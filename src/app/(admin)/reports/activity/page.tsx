"use client";

import { Activity as ActivityIcon } from "lucide-react";
import { PageContainer, PageHeader, PageFooter } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ActivityReportPage() {
  return (
    <>
      <PageContainer>
        <PageHeader
          title="รายงานกิจกรรม"
          description="สรุปกิจกรรมการใช้งานของผู้ใช้งาน"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "รายงาน" },
            { label: "รายงานกิจกรรม" },
          ]}
          primaryAction={
            <Button asChild>
              <Link href="/system/activity-logs">
                <ActivityIcon className="h-4 w-4" />
                ดูบันทึกกิจกรรม
              </Link>
            </Button>
          }
        />
        <Card className="p-8 text-center text-muted-foreground">
          <p>รายงานกิจกรรมแบบละเอียดจะแสดงที่นี่</p>
          <p className="text-sm mt-2">คุณสามารถดูบันทึกกิจกรรมแบบ real-time ได้ที่เมนู &ldquo;บันทึกกิจกรรม&rdquo;</p>
        </Card>
      </PageContainer>
      <PageFooter />
    </>
  );
}

void Badge;
