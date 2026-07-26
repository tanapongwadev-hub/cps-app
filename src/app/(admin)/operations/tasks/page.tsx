"use client";

import { Construction } from "lucide-react";
import { PageContainer, PageHeader, PageFooter } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TasksPage() {
  return (
    <>
      <PageContainer>
        <PageHeader
          title="งาน"
          description="จัดการงานและมอบหมาย"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "การดำเนินงาน" },
            { label: "งาน" },
          ]}
        />
        <Card className="p-12 text-center space-y-3">
          <Construction className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="text-lg font-semibold">หน้านี้อยู่ระหว่างพัฒนา</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Template นี้มีโครงสร้างพร้อมรองรับหน้านี้แล้ว คุณสามารถใช้ตัวอย่างจากหน้า &ldquo;คำขอ / ตั๋ว&rdquo; เป็นแนวทางในการสร้างต่อได้
          </p>
          <Button asChild variant="outline">
            <Link href="/operations/tickets">ดูตัวอย่างหน้าคำขอ</Link>
          </Button>
        </Card>
      </PageContainer>
      <PageFooter />
    </>
  );
}
