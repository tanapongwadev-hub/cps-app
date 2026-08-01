/**
 * Mock department handler — mirrors the real NestJS backend:
 *   GET    /departments            paginated list { items, meta }
 *   GET    /departments/tree       tree (with children)
 *   POST   /departments            create (only code, nameTh, nameEn)
 *   PATCH  /departments/:id        update (only nameTh, nameEn)
 *   DELETE /departments/:id        delete
 *
 * Real backend: POST accepts ONLY { code, nameTh, nameEn } and PATCH
 * accepts ONLY { nameTh, nameEn } — anything else returns 400.
 */
import { mockDb } from "../db";
import { ok, fail, getBody, generateId, simulateLatency, type ListQuery } from "./helpers";
import type { Department } from "@/types/department";

export async function setupDepartmentMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  if (path === "/departments" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toLowerCase();
    const isActiveParam = params.isActive;
    let items = [...mockDb.departments];
    if (search) {
      items = items.filter(
        (d) =>
          d.nameTh.toLowerCase().includes(search) ||
          d.nameEn.toLowerCase().includes(search) ||
          d.code.toLowerCase().includes(search),
      );
    }
    if (typeof isActiveParam === "boolean") {
      items = items.filter((d) => d.isActive === isActiveParam);
    }
    return ok({
      items,
      page: 1,
      pageSize: items.length,
      totalItems: items.length,
      totalPages: 1,
    });
  }

  if (path === "/departments/tree" && method === "GET") {
    await simulateLatency(200);
    const build = (parentId: string | null): Department[] => {
      return mockDb.departments
        .filter((d) => (d.parentId ?? null) === parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((d) => ({ ...d, children: build(d.id) }) as Department);
    };
    return ok(build(null));
  }

  if (path === "/departments" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    if (mockDb.departments.some((d) => d.code === data.code)) {
      return fail("รหัสแผนกนี้มีอยู่ในระบบแล้ว", 409, "DEPT_CODE_EXISTS");
    }
    const newDept: Department = {
      id: generateId("dept"),
      code: data.code as string,
      nameTh: data.nameTh as string,
      nameEn: data.nameEn as string,
      description: (data.description as string | null) ?? null,
      isActive: true,
      sortOrder: (data.sortOrder as number) ?? 99,
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.departments.push(newDept);
    return ok(newDept, "สร้างแผนกเรียบร้อย", 201);
  }

  const detailMatch = path.match(/^\/departments\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);

    if (method === "GET") {
      await simulateLatency(150);
      const dept = mockDb.departments.find((d) => d.id === id);
      if (!dept) return fail("ไม่พบแผนก", 404, "DEPT_NOT_FOUND");
      return ok(dept);
    }

    if (method === "PUT" || method === "PATCH") {
      await simulateLatency();
      const idx = mockDb.departments.findIndex((d) => d.id === id);
      if (idx === -1) return fail("ไม่พบแผนก", 404, "DEPT_NOT_FOUND");
      const data = (await getBody(body)) as Record<string, unknown>;
      const existing = mockDb.departments[idx];
      if (!existing) return fail("Not found", 404);
      // Real backend only accepts nameTh / nameEn; merge those.
      mockDb.departments[idx] = {
        ...existing,
        nameTh: (data.nameTh as string) ?? existing.nameTh,
        nameEn: (data.nameEn as string) ?? existing.nameEn,
        updatedAt: new Date().toISOString(),
      };
      return ok(mockDb.departments[idx], "แก้ไขแผนกเรียบร้อย");
    }

    if (method === "DELETE") {
      await simulateLatency();
      const idx = mockDb.departments.findIndex((d) => d.id === id);
      if (idx === -1) return fail("ไม่พบแผนก", 404, "DEPT_NOT_FOUND");
      const dept = mockDb.departments[idx];
      if (!dept) return fail("Not found", 404);
      const hasChildren = mockDb.departments.some((d) => d.parentId === id);
      if (hasChildren) {
        return fail("ไม่สามารถลบแผนกที่มีแผนกย่อยได้", 409, "DEPT_HAS_CHILDREN");
      }
      if ((dept.userCount ?? 0) > 0) {
        return fail("แผนกนี้ยังมีผู้ใช้งานอยู่ ไม่สามารถลบได้", 409, "DEPT_IN_USE");
      }
      mockDb.departments.splice(idx, 1);
      return ok({ success: true }, "ลบแผนกเรียบร้อย");
    }
  }

  return null;
}
