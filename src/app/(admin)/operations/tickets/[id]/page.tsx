"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Calendar, Tag, MessageSquare, Paperclip, History } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { apiClient } from "@/services/api-client";
import type { Ticket, TicketComment } from "@/types/ticket";
import { formatDateTime, formatRelative } from "@/utils/date";
import { getInitials } from "@/utils/format";
import { showToast } from "@/lib/toast";
import { TextAreaField } from "@/components/forms/form-field";

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [data, setData] = React.useState<{ ticket: Ticket; comments: TicketComment[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [comment, setComment] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const res = await apiClient.get<{ ticket: Ticket; comments: TicketComment[] }>(
        `/tickets/${params.id}`,
      );
      setData(res);
    } catch {
      showToast.error("ไม่สามารถโหลดข้อมูลคำขอได้");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submitComment = async () => {
    if (!comment.trim() || !params.id) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/tickets/${params.id}/comments`, { content: comment });
      setComment("");
      showToast.success("เพิ่มความคิดเห็นเรียบร้อย");
      load();
    } catch {
      showToast.error("ไม่สามารถเพิ่มความคิดเห็นได้");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <PageContainer>
        <div className="flex h-96 items-center justify-center">
          <Spinner size="xl" />
        </div>
      </PageContainer>
    );
  }

  const { ticket, comments } = data;

  return (
    <>
      <PageContainer>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3">
          <ArrowLeft className="h-4 w-4" />
          กลับ
        </Button>

        <PageHeader
          title={ticket.subject}
          description={`${ticket.ticketNumber} · สร้างเมื่อ ${formatDateTime(ticket.createdAt)}`}
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "คำขอ / ตั๋ว", href: "/operations/tickets" },
            { label: ticket.ticketNumber },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3">รายละเอียด</h3>
              <p className="text-sm text-foreground/90 whitespace-pre-line">{ticket.description}</p>
              {ticket.tags && ticket.tags.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags.map((tag) => (
                      <Badge key={tag} variant="muted" className="text-[10px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  ความคิดเห็น ({comments.length})
                </h3>
              </div>

              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีความคิดเห็น</p>
              ) : (
                <ul className="space-y-4">
                  {comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>{getInitials(c.authorName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{c.authorName}</p>
                          {c.isInternal && <Badge variant="info" className="text-[10px]">Internal</Badge>}
                          <span className="text-xs text-muted-foreground">{formatRelative(c.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-1 whitespace-pre-line">{c.content}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 pt-4 border-t space-y-2">
                <TextAreaField
                  placeholder="เพิ่มความคิดเห็น..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={submitComment} loading={submitting} disabled={!comment.trim()}>
                    ส่งความคิดเห็น
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3">ข้อมูลคำขอ</h3>
              <dl className="space-y-2 text-sm">
                <DetailRow label="สถานะ" value={<Badge>{ticket.status}</Badge>} />
                <DetailRow label="ความสำคัญ" value={<Badge>{ticket.priority}</Badge>} />
                <DetailRow label="หมวดหมู่" value={ticket.categoryName} />
                <DetailRow label="แผนก" value={ticket.departmentName} />
                <DetailRow label="กำหนดเสร็จ" value={ticket.dueDate ? formatDateTime(ticket.dueDate) : "-"} />
                {ticket.resolvedAt && <DetailRow label="แก้ไขเมื่อ" value={formatDateTime(ticket.resolvedAt)} />}
                {ticket.closedAt && <DetailRow label="ปิดเมื่อ" value={formatDateTime(ticket.closedAt)} />}
              </dl>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                ผู้เกี่ยวข้อง
              </h3>
              <div className="space-y-3">
                <PersonRow label="ผู้แจ้ง" name={ticket.requesterName} />
                {ticket.assigneeName && <PersonRow label="ผู้รับผิดชอบ" name={ticket.assigneeName} />}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <History className="h-4 w-4" />
                กิจกรรม
              </h3>
              <ul className="space-y-2 text-sm">
                <ActivityRow
                  icon={<Calendar className="h-3.5 w-3.5" />}
                  text="สร้างคำขอ"
                  time={formatRelative(ticket.createdAt)}
                />
                <ActivityRow
                  icon={<Paperclip className="h-3.5 w-3.5" />}
                  text="อัพเดทล่าสุด"
                  time={formatRelative(ticket.updatedAt)}
                />
                {ticket.attachmentCount > 0 && (
                  <ActivityRow
                    icon={<Paperclip className="h-3.5 w-3.5" />}
                    text={`แนบไฟล์ ${ticket.attachmentCount} ไฟล์`}
                    time=""
                  />
                )}
              </ul>
            </Card>
          </div>
        </div>
      </PageContainer>
      <PageFooter />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function PersonRow({ label, name }: { label: string; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{name}</p>
      </div>
    </div>
  );
}

function ActivityRow({ icon, text, time }: { icon: React.ReactNode; text: string; time: string }) {
  return (
    <li className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">{text}</span>
      {time && <span>{time}</span>}
    </li>
  );
}
