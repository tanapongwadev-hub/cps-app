import { mockDb } from "../db";
import { ok, fail, getBody, generateId, simulateLatency } from "./helpers";

export async function setupMenuMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  if (path === "/menus" && method === "GET") {
    await simulateLatency(200);
    return ok(mockDb.menus);
  }

  if (path === "/menus/tree" && method === "GET") {
    await simulateLatency(200);
    const build = (parentId: string | null): typeof mockDb.menus => {
      return mockDb.menus
        .filter((m) => m.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((m) => ({ ...m, children: build(m.id) }) as (typeof mockDb.menus)[number]);
    };
    return ok(build(null));
  }

  if (path === "/menus" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    if (mockDb.menus.some((m) => m.code === data.code)) {
      return fail("รหัสเมนูนี้มีอยู่ในระบบแล้ว", 409, "MENU_CODE_EXISTS");
    }
    if (data.path && mockDb.menus.some((m) => m.path === data.path)) {
      return fail("Path นี้มีอยู่ในระบบแล้ว", 409, "MENU_PATH_EXISTS");
    }
    const newMenu = {
      id: generateId("menu"),
      code: data.code as string,
      nameTh: (data.nameTh as string) ?? (data.name as string),
      nameEn: (data.nameEn as string) ?? (data.name as string),
      icon: (data.icon as string | null) ?? null,
      path: (data.path as string | null) ?? null,
      parentId: (data.parentId as string | null) ?? null,
      sortOrder: (data.sortOrder as number) ?? 99,
      status: (data.status as "active" | "inactive") ?? "active",
      menuType: (data.menuType as "MAIN" | "SUB" | "GROUP" | "EXTERNAL") ?? "MAIN",
      requiredPermissions: (data.requiredPermissions as string[]) ?? [],
      permissions: (data.permissions as string[]) ?? [],
      externalUrl: data.externalUrl as string | undefined,
      openInNewTab: (data.openInNewTab as boolean) ?? false,
      isHidden: (data.isHidden as boolean) ?? false,
      isVisible: (data.isVisible as boolean) ?? true,
      isActive: (data.isActive as boolean) ?? true,
      isGroup: (data.isGroup as boolean) ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.menus.push(newMenu);
    return ok(newMenu, "สร้างเมนูเรียบร้อย", 201);
  }

  const detailMatch = path.match(/^\/menus\/([\w-]+)$/);
  if (detailMatch) {
    const id = detailMatch[1];
    if (!id) return fail("Invalid id", 400);

    if (method === "GET") {
      await simulateLatency(150);
      const menu = mockDb.menus.find((m) => m.id === id);
      if (!menu) return fail("ไม่พบเมนู", 404, "MENU_NOT_FOUND");
      return ok(menu);
    }

    if (method === "PUT" || method === "PATCH") {
      await simulateLatency();
      const idx = mockDb.menus.findIndex((m) => m.id === id);
      if (idx === -1) return fail("ไม่พบเมนู", 404, "MENU_NOT_FOUND");
      const data = (await getBody(body)) as Record<string, unknown>;
      const existing = mockDb.menus[idx];
      if (!existing) return fail("Not found", 404);
      mockDb.menus[idx] = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      } as typeof existing;
      return ok(mockDb.menus[idx], "แก้ไขเมนูเรียบร้อย");
    }

    if (method === "DELETE") {
      await simulateLatency();
      const idx = mockDb.menus.findIndex((m) => m.id === id);
      if (idx === -1) return fail("ไม่พบเมนู", 404, "MENU_NOT_FOUND");
      const hasChildren = mockDb.menus.some((m) => m.parentId === id);
      if (hasChildren) {
        return fail("ไม่สามารถลบเมนูที่มีเมนูย่อยได้", 409, "MENU_HAS_CHILDREN");
      }
      mockDb.menus.splice(idx, 1);
      return ok({ success: true }, "ลบเมนูเรียบร้อย");
    }
  }

  // /menus/reorder
  if (path === "/menus/reorder" && method === "POST") {
    await simulateLatency(200);
    const data = (await getBody(body)) as { items: Array<{ id: string; sortOrder: number; parentId: string | null }> };
    for (const item of data.items) {
      const menu = mockDb.menus.find((m) => m.id === item.id);
      if (menu) {
        menu.sortOrder = item.sortOrder;
        menu.parentId = item.parentId;
      }
    }
    return ok({ success: true }, "จัดลำดับเมนูเรียบร้อย");
  }

  return null;
}
