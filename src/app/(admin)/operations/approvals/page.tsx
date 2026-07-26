"use client";

import { CheckCircle, XCircle, Clock } from "lucide-react";
import { PageContainer, PageHeader, PageFooter } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/utils/format";
import { formatRelative } from "@/utils/date";
import { showToast } from "@/lib/toast";

const mockApprovals = [
  {
    id: "1",
    title: "ขอเพิ่มสิทธิ์ 'ผู้ดูแลระบบ' ให้กับ มานี มานพ",
    requester: "มานี มานพ",
    requesterAvatar: undefined,
    module: "ผู้ใช้งาน",
    priority: "high" as const,
    submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    title: "แก้ไขเมนู 'คำขอ' - เพิ่มฟิลด์ SLA",
    requester: "สมหญิง รักดี",
    module: "เมนู",
    priority: "medium" as const,
    submittedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    title: "ลบผู้ใช้งาน inactive 25 ราย",
    requester: "สมชาย ใจดี",
    module: "ผู้ใช้งาน",
    priority: "low" as const,
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const priorityVariant = { high: "danger" as const, medium: "warning" as const, low: "muted" as const };
const priorityLabel = { high: "สูง", medium: "ปกติ", low: "ต่ำ" };

export default function ApprovalsPage() {
  return (
    <>
      <PageContainer>
        <PageHeader
          title="การอนุมัติ"
          description="รายการที่รอการอนุมัติจากคุณ"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "การดำเนินงาน" },
            { label: "การอนุมัติ" },
          ]}
        />

        <div className="space-y-3">
          {mockApprovals.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <Avatar size="sm">
                    <AvatarFallback>{getInitials(a.requester)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{a.requester}</span>
                      <span>·</span>
                      <Badge variant="outline" className="text-[10px]">{a.module}</Badge>
                      <Badge variant={priorityVariant[a.priority]} className="text-[10px]">
                        {priorityLabel[a.priority]}
                      </Badge>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelative(a.submittedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showToast.success("ปฏิเสธคำขอแล้ว")}
                  >
                    <XCircle className="h-4 w-4" />
                    ปฏิเสธ
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => showToast.success("อนุมัติเรียบร้อย")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    อนุมัติ
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </PageContainer>
      <PageFooter />
    </>
  );
}
