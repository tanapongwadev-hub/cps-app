/**
 * Permissions Mock Handler
 * /permissions, /permissions/:id
 * Requires SUPER_ADMIN
 */
import { mockDb } from "../db";
import { ok, fail, getBody, paginate, generateId, simulateLatency, type ListQuery } from "./helpers";
import type { Permission } from "@/features/permissions/types";

const MOCK_ACTIONS = [
  { id: "action-create", code: "CREATE", nameTh: "สร้าง", nameEn: "Create" },
  { id: "action-read", code: "READ", nameTh: "อ่าน", nameEn: "Read" },
  { id: "action-update", code: "UPDATE", nameTh: "แก้ไข", nameEn: "Update" },
  { id: "action-delete", code: "DELETE", nameTh: "ลบ", nameEn: "Delete" },
];

export async function setupPermissionMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // GET /permissions/options — menus + actions สำหรับ dropdown
  if (path === "/permissions/options" && method === "GET") {
    await simulateLatency(100);
    return ok({
      menus: mockDb.menus.map((m) => ({
        id: m.id,
        code: m.code,
        nameTh: m.nameTh,
        nameEn: m.nameEn,
      })),
      actions: MOCK_ACTIONS,
    });
  }

  // POST /permissions
  if (path === "/permissions" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    if (mockDb.permissions.some((p) => p.code === data.code)) {
      return fail("code นี้มีอยู่ในระบบแล้ว", 409, "PERMISSION_CODE_EXISTS");
    }
    const menu = mockDb.menus.find((m) => String(m.id) === String(data.menuId));
    const action = MOCK_ACTIONS.find((a) => String(a.id) === String(data.actionId));
    const newPerm = {
      id: generateId("perm"),
      code: data.code as string,
      description: data.description as string | undefined,
      isActive: (data.isActive as boolean | undefined) ?? true,
      menu: menu
        ? { id: menu.id, code: menu.code, nameTh: menu.nameTh, nameEn: menu.nameEn }
        : undefined,
      action: action ? { ...action } : undefined,
      departments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.permissions.push(newPerm as unknown as Permission);
    return ok(newPerm, "สร้างสิทธิ์เรียบร้อย", 201);
  }

  // GET /permissions
  if (path === "/permissions" && method === "GET") {
    await simulateLatency();
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery;
    const search = params.search?.toString().toLowerCase();
    let items = [...mockDb.permissions];
    if (search) {
      items = items.filter((p) => {
        const code = p.code?.toLowerCase() ?? "";
        const name = p.name?.toLowerCase() ?? "";
        const moduleName = p.module?.toLowerCase() ?? "";
        return code.includes(search) || name.includes(search) || moduleName.includes(search);
      });
    }
    return ok(paginate(items, params));
  }

  // PUT /permissions/:id/departments
  const departmentsMatch = path.match(
    /^\/permissions\/([\w-]+)\/departments$/,
  );
  if (departmentsMatch && method === "PUT") {
    await simulateLatency();
    const id = departmentsMatch[1];
    const permission = mockDb.permissions.find((item) => item.id === id);
    if (!permission) {
      return fail("ไม่พบ permission", 404, "PERMISSION_NOT_FOUND");
    }
    const data = (await getBody(body)) as { departmentIds?: unknown };
    const departmentIds = Array.isArray(data.departmentIds)
      ? data.departmentIds.filter((value): value is string => typeof value === "string")
      : [];
    const departments = departmentIds.map((departmentId) =>
      mockDb.departments.find((department) => department.id === departmentId),
    );
    const missingIds = departmentIds.filter(
      (_, index) => departments[index] === undefined,
    );
    if (missingIds.length > 0) {
      return fail(
        `ไม่พบแผนก: ${missingIds.join(", ")}`,
        400,
        "DEPARTMENT_NOT_FOUND",
      );
    }
    permission.departments = departments
      .filter((department): department is NonNullable<typeof department> => Boolean(department))
      .map((department) => ({
        id: department.id,
        code: department.code,
        name: department.nameTh ?? department.nameEn ?? department.code,
        nameTh: department.nameTh,
        nameEn: department.nameEn,
        isActive: department.isActive,
      }));
    permission.updatedAt = new Date().toISOString();
    return ok(permission, "กำหนดแผนกสำหรับสิทธิ์เรียบร้อย");
  }

  // GET /permissions/:id
  const detailMatch = path.match(/^\/permissions\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);

    if (method === "GET") {
      await simulateLatency(150);
      const perm = mockDb.permissions.find((p) => p.id === id);
      if (!perm) return fail("ไม่พบ permission", 404, "PERMISSION_NOT_FOUND");
      return ok(perm);
    }

    if (method === "PATCH" || method === "PUT") {
      await simulateLatency();
      const idx = mockDb.permissions.findIndex((p) => p.id === id);
      if (idx === -1) return fail("ไม่พบ permission", 404, "PERMISSION_NOT_FOUND");
      const data = (await getBody(body)) as Record<string, unknown>;
      const existing = mockDb.permissions[idx];
      if (!existing) return fail("ไม่พบ permission", 404, "PERMISSION_NOT_FOUND");
      if (data.code && data.code !== existing.code) {
        if (mockDb.permissions.some((p) => p.code === data.code)) {
          return fail("code นี้มีอยู่ในระบบแล้ว", 409, "PERMISSION_CODE_EXISTS");
        }
      }
      const { menuId, actionId, ...rest } = data;
      const menu = mockDb.menus.find((m) => String(m.id) === String(menuId));
      const action = MOCK_ACTIONS.find((a) => String(a.id) === String(actionId));
      mockDb.permissions[idx] = {
        ...existing,
        ...rest,
        ...(menu
          ? { menu: { id: menu.id, code: menu.code, nameTh: menu.nameTh, nameEn: menu.nameEn } }
          : {}),
        ...(action ? { action: { ...action } } : {}),
        updatedAt: new Date().toISOString(),
      } as typeof existing;
      return ok(mockDb.permissions[idx], "บันทึกสิทธิ์เรียบร้อย");
    }

    if (method === "DELETE") {
      await simulateLatency();
      const idx = mockDb.permissions.findIndex((p) => p.id === id);
      if (idx === -1) return fail("ไม่พบ permission", 404, "PERMISSION_NOT_FOUND");
      mockDb.permissions.splice(idx, 1);
      return ok({ success: true }, "ลบสิทธิ์เรียบร้อย");
    }
  }

  return null;
}
