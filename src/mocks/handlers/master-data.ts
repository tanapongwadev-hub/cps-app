import { mockDb } from "../db";
import { ok, fail, getBody, generateId, simulateLatency } from "./helpers";

export async function setupMasterDataMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  if (path === "/master-data/categories" && method === "GET") {
    await simulateLatency(200);
    return ok(mockDb.categories);
  }

  if (path === "/master-data/statuses" && method === "GET") {
    await simulateLatency(200);
    return ok(mockDb.statuses);
  }

  if (path === "/master-data/organizations" && method === "GET") {
    await simulateLatency(200);
    return ok(mockDb.organizations);
  }

  // Categories CRUD
  if (path === "/master-data/categories" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    if (mockDb.categories.some((c) => c.code === data.code)) {
      return fail("รหัสนี้มีอยู่ในระบบแล้ว", 409, "CATEGORY_CODE_EXISTS");
    }
    const newCat = {
      id: generateId("cat"),
      code: data.code as string,
      name: data.name as string,
      description: data.description as string | undefined,
      parentId: (data.parentId as string | null) ?? null,
      sortOrder: (data.sortOrder as number) ?? 99,
      status: (data.status as "active" | "inactive") ?? "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.categories.push(newCat);
    return ok(newCat, "สร้างหมวดหมู่เรียบร้อย", 201);
  }

  const catMatch = path.match(/^\/master-data\/categories\/([\w-]+)$/);
  if (catMatch) {
    const id = catMatch[1];
    if (!id) return fail("Invalid id", 400);
    if (method === "PUT" || method === "PATCH") {
      await simulateLatency();
      const idx = mockDb.categories.findIndex((c) => c.id === id);
      if (idx === -1) return fail("ไม่พบข้อมูล", 404, "NOT_FOUND");
      const data = (await getBody(body)) as Record<string, unknown>;
      const existing = mockDb.categories[idx];
      if (!existing) return fail("Not found", 404);
      mockDb.categories[idx] = { ...existing, ...data, updatedAt: new Date().toISOString() };
      return ok(mockDb.categories[idx], "แก้ไขเรียบร้อย");
    }
    if (method === "DELETE") {
      await simulateLatency();
      const idx = mockDb.categories.findIndex((c) => c.id === id);
      if (idx === -1) return fail("ไม่พบข้อมูล", 404, "NOT_FOUND");
      mockDb.categories.splice(idx, 1);
      return ok({ success: true }, "ลบเรียบร้อย");
    }
  }

  return null;
}
