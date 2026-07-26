import { ok, simulateLatency } from "./helpers";
import type { DashboardData } from "@/types/dashboard";

export async function setupDashboardMocks(
  path: string,
  method: string,
  _body: unknown,
): Promise<Response | null> {
  if (path === "/dashboard/stats" && method === "GET") {
    await simulateLatency(300);

    // Build 30 days of trend data
    const trendData = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return {
        date: d.toISOString().split("T")[0] ?? "",
        value: Math.floor(Math.random() * 100) + 50 + i * 2,
      };
    });

    const data: DashboardData = {
      kpis: [
        {
          key: "users",
          label: "ผู้ใช้งานทั้งหมด",
          value: 2547,
          previousValue: 2398,
          changePercent: 6.2,
          trend: "up",
          format: "number",
          color: "primary",
        },
        {
          key: "tickets",
          label: "คำขอทั้งหมด",
          value: 1289,
          previousValue: 1156,
          changePercent: 11.5,
          trend: "up",
          format: "number",
          color: "info",
        },
        {
          key: "pending",
          label: "รอดำเนินการ",
          value: 47,
          previousValue: 62,
          changePercent: -24.2,
          trend: "down",
          format: "number",
          color: "warning",
        },
        {
          key: "resolved",
          label: "สำเร็จ",
          value: 1198,
          previousValue: 1042,
          changePercent: 14.9,
          trend: "up",
          format: "number",
          color: "success",
        },
      ],
      trendChart: [
        {
          name: "คำขอ",
          data: trendData,
          color: "hsl(var(--chart-1))",
        },
        {
          name: "เสร็จสิ้น",
          data: trendData.map((d, i) => ({
            ...d,
            value: Math.max(0, d.value - 20 - (i % 5) * 3),
          })),
          color: "hsl(var(--chart-2))",
        },
      ],
      statusChart: [
        { name: "รอดำเนินการ", value: 47, color: "hsl(var(--warning))" },
        { name: "กำลังดำเนินการ", value: 38, color: "hsl(var(--info))" },
        { name: "แก้ไขแล้ว", value: 25, color: "hsl(var(--success))" },
        { name: "ปิดงาน", value: 12, color: "hsl(var(--muted-foreground))" },
      ],
      categoryChart: [
        { name: "เทคนิค", value: 42, color: "hsl(var(--chart-1))" },
        { name: "การเงิน", value: 28, color: "hsl(var(--chart-2))" },
        { name: "ทั่วไป", value: 35, color: "hsl(var(--chart-3))" },
        { name: "ฟีเจอร์", value: 18, color: "hsl(var(--chart-4))" },
        { name: "บั๊ก", value: 22, color: "hsl(var(--chart-6))" },
      ],
      recentActivities: [
        {
          id: "1",
          type: "user",
          title: "ผู้ใช้งานใหม่",
          description: "สมชัย ใจกล้า ลงทะเบียนเข้าใช้งาน",
          user: "ระบบ",
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: "success",
        },
        {
          id: "2",
          type: "ticket",
          title: "คำขอใหม่",
          description: "TK-20240012 - เข้าสู่ระบบไม่ได้",
          user: "มานี มานพ",
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          status: "warning",
        },
        {
          id: "3",
          type: "role",
          title: "แก้ไขสิทธิ์",
          description: "Role 'ผู้จัดการ' ถูกแก้ไข",
          user: "สมชาย ใจดี",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "info",
        },
        {
          id: "4",
          type: "system",
          title: "Backup สำเร็จ",
          description: "Daily backup เสร็จสมบูรณ์",
          user: "ระบบอัตโนมัติ",
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          status: "success",
        },
        {
          id: "5",
          type: "login",
          title: "เข้าสู่ระบบ",
          description: "เข้าสู่ระบบจาก IP 192.168.1.45",
          user: "สมหญิง รักดี",
          timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          status: "info",
        },
      ],
      pendingTasks: [
        {
          id: "t1",
          type: "ticket",
          title: "อนุมัติคำขอ TK-20240008",
          description: "ขอเพิ่มสิทธิ์การใช้งาน",
          user: "มานี มานพ",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          status: "warning",
        },
        {
          id: "t2",
          type: "ticket",
          title: "ตรวจสอบรายงานประจำเดือน",
          description: "ต้องอนุมัติก่อนสิ้นเดือน",
          user: "สมหญิง รักดี",
          timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
          status: "info",
        },
        {
          id: "t3",
          type: "user",
          title: "อนุมัติผู้ใช้งานใหม่ 3 ราย",
          description: "รอการอนุมัติจากผู้ดูแล",
          user: "ระบบ",
          timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
          status: "warning",
        },
      ],
      systemStatus: {
        server: "online",
        database: "online",
        cache: "online",
        storage: { used: 256, total: 1024, unit: "GB" },
      },
    };

    return ok(data);
  }
  return null;
}
