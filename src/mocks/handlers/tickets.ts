import { mockDb } from "../db";
import { ok, fail, getBody, paginate, generateId, simulateLatency, type ListQuery } from "./helpers";
import type { Ticket } from "@/types/ticket";

export async function setupTicketMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  if (path === "/tickets" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toLowerCase();
    const status = params.status;
    const priority = params.priority;
    const departmentId = params.departmentId;

    let items: Ticket[] = [...mockDb.tickets];
    if (search) {
      items = items.filter(
        (t) =>
          t.subject.toLowerCase().includes(search) ||
          t.ticketNumber.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search),
      );
    }
    if (status) {
      const statuses = String(status).split(",");
      items = items.filter((t) => statuses.includes(t.status));
    }
    if (priority) {
      const ps = String(priority).split(",");
      items = items.filter((t) => ps.includes(t.priority));
    }
    if (departmentId) items = items.filter((t) => t.departmentId === departmentId);

    return ok(paginate(items, params));
  }

  if (path === "/tickets" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    const newTicket: Ticket = {
      id: generateId("ticket"),
      ticketNumber: `TK-${String(20240000 + mockDb.tickets.length + 1)}`,
      subject: data.subject as string,
      description: (data.description as string) ?? "",
      categoryId: (data.categoryId as string) ?? "cat-003",
      categoryName: mockDb.categories.find((c) => c.id === data.categoryId)?.name ?? "ทั่วไป",
      priority: (data.priority as Ticket["priority"]) ?? "medium",
      status: "PENDING",
      requesterId: "user-001",
      requesterName: "สมชาย ใจดี",
      assigneeId: data.assigneeId as string | undefined,
      assigneeName: data.assigneeId
        ? mockDb.users.find((u) => u.id === data.assigneeId)?.fullName
        : undefined,
      departmentId: (data.departmentId as string) ?? "dept-it",
      departmentName:
        mockDb.departments.find((d) => d.id === data.departmentId)?.name ?? "เทคโนโลยีสารสนเทศ",
      dueDate: data.dueDate as string | undefined,
      commentCount: 0,
      attachmentCount: 0,
      tags: (data.tags as string[]) ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.tickets.unshift(newTicket);
    return ok(newTicket, "สร้างคำขอเรียบร้อย", 201);
  }

  const detailMatch = path.match(/^\/tickets\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);

    if (method === "GET") {
      await simulateLatency(200);
      const ticket = mockDb.tickets.find((t) => t.id === id);
      if (!ticket) return fail("ไม่พบคำขอ", 404, "TICKET_NOT_FOUND");
      return ok({
        ticket,
        comments: mockDb.ticketComments[id] ?? [],
      });
    }

    if (method === "PUT" || method === "PATCH") {
      await simulateLatency();
      const idx = mockDb.tickets.findIndex((t) => t.id === id);
      if (idx === -1) return fail("ไม่พบคำขอ", 404, "TICKET_NOT_FOUND");
      const data = (await getBody(body)) as Record<string, unknown>;
      const existing = mockDb.tickets[idx];
      if (!existing) return fail("Not found", 404);
      mockDb.tickets[idx] = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      } as Ticket;
      return ok(mockDb.tickets[idx], "แก้ไขคำขอเรียบร้อย");
    }

    if (method === "DELETE") {
      await simulateLatency();
      const idx = mockDb.tickets.findIndex((t) => t.id === id);
      if (idx === -1) return fail("ไม่พบคำขอ", 404, "TICKET_NOT_FOUND");
      mockDb.tickets.splice(idx, 1);
      return ok({ success: true }, "ลบคำขอเรียบร้อย");
    }
  }

  // /tickets/:id/status
  const statusMatch = path.match(/^\/tickets\/([\w-]+)\/status$/);
  if (statusMatch && method === "PATCH") {
    const id = statusMatch[1];
    if (!id) return fail("Invalid id", 400);
    const idx = mockDb.tickets.findIndex((t) => t.id === id);
    if (idx === -1) return fail("ไม่พบคำขอ", 404, "TICKET_NOT_FOUND");
    const data = (await getBody(body)) as { status: string };
    const existing = mockDb.tickets[idx];
    if (!existing) return fail("Not found", 404);
    mockDb.tickets[idx] = {
      ...existing,
      status: data.status as Ticket["status"],
      resolvedAt: data.status === "RESOLVED" ? new Date().toISOString() : existing.resolvedAt,
      closedAt: data.status === "CLOSED" ? new Date().toISOString() : existing.closedAt,
      updatedAt: new Date().toISOString(),
    };
    return ok(mockDb.tickets[idx], "อัพเดทสถานะเรียบร้อย");
  }

  // /tickets/:id/comments
  const commentMatch = path.match(/^\/tickets\/([\w-]+)\/comments$/);
  if (commentMatch && method === "POST") {
    const id = commentMatch[1];
    if (!id) return fail("Invalid id", 400);
    await simulateLatency(200);
    const data = (await getBody(body)) as Record<string, unknown>;
    const newComment = {
      id: generateId("cmt"),
      ticketId: id,
      authorId: "user-001",
      authorName: "สมชาย ใจดี",
      content: data.content as string,
      isInternal: (data.isInternal as boolean) ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.ticketComments[id] = [...(mockDb.ticketComments[id] ?? []), newComment];
    return ok(newComment, "เพิ่มความคิดเห็นเรียบร้อย", 201);
  }

  return null;
}
