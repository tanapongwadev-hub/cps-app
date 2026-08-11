import { mockDb } from "../db";
import {
  ok,
  fail,
  getBody,
  generateId,
  simulateLatency,
  type ListQuery,
} from "./helpers";

/**
 * Mock handler for /materials-receiving endpoints
 *
 * ครอบคลุม:
 *  - GET    /materials-receiving              (list with filters)
 *  - GET    /materials-receiving/lookups      (suppliers + materials + units)
 *  - GET    /materials-receiving/by-lot/:lot  (lookup by internal lot no)
 *  - GET    /materials-receiving/:id          (detail with packages)
 *  - POST   /materials-receiving              (create draft)
 *  - PATCH  /materials-receiving/:id          (update draft)
 *  - DELETE /materials-receiving/:id          (delete draft)
 *  - POST   /materials-receiving/:id/confirm  (confirm + update stock)
 *  - POST   /materials-receiving/:id/cancel   (cancel + revert stock)
 */

interface MockMaterialsReceiving {
  id: string;
  internalLotNo: string;
  organizationId: string;
  supplierId: string;
  materialId: string;
  unitId: string;
  receiveQuantity: string;
  packingQuantity: number;
  packageCount: number;
  supplierLotNo: string | null;
  supplierProductionDate: string | null;
  receiveDate: string;
  qrCode: string | null;
  qrPayload: unknown;
  status: "draft" | "confirmed" | "cancelled";
  idempotencyKey: string | null;
  remark: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: { id: string; code: string; nameTh: string; nameEn: string | null };
  material?: { id: string; code: string; name: string };
  unit?: { id: string; code: string; nameTh: string; nameEn: string | null };
}

interface MockPackage {
  id: string;
  materialReceivingId: string;
  packageNo: number;
  quantity: string;
}

interface MockStockBalance {
  id: string;
  materialId: string;
  quantity: string;
  lastMovementAt: string | null;
}

interface MockStockTransaction {
  id: string;
  materialId: string;
  transactionType: "RECEIVE" | "ISSUE" | "ADJUST";
  referenceType: "MATERIAL_RECEIVING";
  referenceId: string;
  referenceLotNo: string;
  quantityBefore: string;
  quantityIn: string;
  quantityOut: string;
  quantityAfter: string;
  transactionDate: string;
  remark: string;
  createdBy: string;
}

interface MockLotCounter {
  id: string;
  lotDate: string;
  lastNumber: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enrich(row: MockMaterialsReceiving) {
  return {
    ...row,
    supplier: mockDb.suppliers.find((s) => s.id === row.supplierId)
      ? {
          id: row.supplierId,
          code: mockDb.suppliers.find((s) => s.id === row.supplierId)!.code,
          nameTh: mockDb.suppliers.find((s) => s.id === row.supplierId)!
            .nameTh,
          nameEn: mockDb.suppliers.find((s) => s.id === row.supplierId)!
            .nameEn,
        }
      : undefined,
    material: mockDb.materials.find((m) => m.id === row.materialId)
      ? {
          id: row.materialId,
          code: mockDb.materials.find((m) => m.id === row.materialId)!.code,
          name: mockDb.materials.find((m) => m.id === row.materialId)!.name,
        }
      : undefined,
    unit: mockDb.units.find((u) => u.id === row.unitId)
      ? {
          id: row.unitId,
          code: mockDb.units.find((u) => u.id === row.unitId)!.code,
          nameTh: mockDb.units.find((u) => u.id === row.unitId)!.nameTh,
          nameEn: mockDb.units.find((u) => u.id === row.unitId)!.nameEn,
        }
      : undefined,
  };
}

function computePackageCount(
  receiveQuantity: string,
  packingQuantity: number,
): number {
  if (packingQuantity < 1) return 0;
  const qty = Number(receiveQuantity);
  if (!Number.isFinite(qty) || qty <= 0) return 0;
  return Math.ceil(qty / packingQuantity);
}

function buildPackages(
  receiveQuantity: string,
  packingQuantity: number,
  packageCount: number,
  materialReceivingId: string,
): MockPackage[] {
  const qty = Number(receiveQuantity);
  const packages: MockPackage[] = [];
  let remaining = qty;
  for (let i = 1; i <= packageCount; i += 1) {
    const value =
      i === packageCount ? remaining : Math.min(packingQuantity, remaining);
    packages.push({
      id: generateId("pkg"),
      materialReceivingId,
      packageNo: i,
      quantity: value.toFixed(4),
    });
    remaining -= value;
  }
  return packages;
}

function nextInternalLotNo(receiveDate: string): string {
  const counter = mockDb.materialsReceivingLotCounters as MockLotCounter[];
  let c = counter.find((x) => x.lotDate === receiveDate);
  if (!c) {
    c = {
      id: generateId("lrc"),
      lotDate: receiveDate,
      lastNumber: 0,
    };
    counter.push(c);
  }
  c.lastNumber += 1;
  const datePart = receiveDate.replace(/-/g, "");
  return `CCI-${datePart}-${String(c.lastNumber).padStart(3, "0")}`;
}

function buildQrPayload(
  row: MockMaterialsReceiving,
): Record<string, unknown> {
  const material = mockDb.materials.find((m) => m.id === row.materialId);
  return {
    version: "1.0",
    internalLotNo: row.internalLotNo,
    materialCode: material?.code ?? "",
    receiveQuantity: row.receiveQuantity,
    supplierLotNo: row.supplierLotNo,
  };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function setupMaterialsReceivingMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  const receivings = mockDb.materialsReceivings as MockMaterialsReceiving[];
  const packages = mockDb.materialsReceivingPackages as MockPackage[];
  const stockBalances = mockDb.stockBalances as MockStockBalance[];
  const stockTransactions = mockDb.stockTransactions as MockStockTransaction[];

  // ----- Lookups -----
  if (path === "/materials-receiving/lookups" && method === "GET") {
    await simulateLatency(200);
    return ok({
      suppliers: mockDb.suppliers
        .filter((s) => s.isActive)
        .map((s) => ({ id: s.id, code: s.code, nameTh: s.nameTh, nameEn: s.nameEn })),
      materials: mockDb.materials
        .filter((m) => m.isActive)
        .map((m) => ({
          id: m.id,
          code: m.code,
          name: m.name,
          packingQuantity: m.packingQuantity,
          unitId: m.unitId,
        })),
      units: mockDb.units
        .filter((u) => u.isActive)
        .map((u) => ({
          id: u.id,
          code: u.code,
          nameTh: u.nameTh,
          nameEn: u.nameEn,
        })),
    });
  }

  // ----- Find by internal lot no -----
  const byLotMatch = path.match(/^\/materials-receiving\/by-lot\/(.+)$/);
  if (byLotMatch) {
    const lotNo = decodeURIComponent(byLotMatch[1] ?? "");
    await simulateLatency(200);
    const row = receivings.find((r) => r.internalLotNo === lotNo);
    if (!row) {
      return fail("ไม่พบ Materials Receiving", 404, "NOT_FOUND");
    }
    const pkgs = packages
      .filter((p) => p.materialReceivingId === row.id)
      .sort((a, b) => a.packageNo - b.packageNo);
    return ok({ ...enrich(row), packages: pkgs });
  }

  // ----- List -----
  if (path === "/materials-receiving" && method === "GET") {
    await simulateLatency(200);
    const params = ((body as { params?: ListQuery })?.params ?? {}) as ListQuery & {
      status?: string;
      supplierId?: string;
      materialId?: string;
      internalLotNo?: string;
      receiveDateFrom?: string;
      receiveDateTo?: string;
      hasPackages?: boolean;
    };
    const search = params.search?.toLowerCase();
    const status = params.status;
    const supplierId = params.supplierId;
    const materialId = params.materialId;
    const internalLotNo = params.internalLotNo;
    const receiveDateFrom = params.receiveDateFrom;
    const receiveDateTo = params.receiveDateTo;
    const hasPackages = params.hasPackages;

    let items: MockMaterialsReceiving[] = [...receivings];
    if (search) {
      items = items.filter((r) => {
        const material = mockDb.materials.find((m) => m.id === r.materialId);
        return (
          r.internalLotNo.toLowerCase().includes(search) ||
          (r.supplierLotNo ?? "").toLowerCase().includes(search) ||
          (material?.code.toLowerCase().includes(search) ?? false)
        );
      });
    }
    if (status) items = items.filter((r) => r.status === status);
    if (supplierId) items = items.filter((r) => r.supplierId === supplierId);
    if (materialId) items = items.filter((r) => r.materialId === materialId);
    if (internalLotNo)
      items = items.filter((r) => r.internalLotNo === internalLotNo);
    if (receiveDateFrom)
      items = items.filter((r) => r.receiveDate >= receiveDateFrom);
    if (receiveDateTo)
      items = items.filter((r) => r.receiveDate <= receiveDateTo);
    if (hasPackages !== undefined) {
      items = items.filter((r) => {
        const has = packages.some((p) => p.materialReceivingId === r.id);
        return hasPackages ? has : !has;
      });
    }

    // Sort
    const sortBy = params.sortBy as string | undefined;
    const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";
    if (sortBy) {
      items = [...items].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortBy];
        const bv = (b as unknown as Record<string, unknown>)[sortBy];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") {
          return (av as number - (bv as number)) * (sortOrder === "asc" ? 1 : -1);
        }
        return (
          String(av).localeCompare(String(bv)) * (sortOrder === "asc" ? 1 : -1)
        );
      });
    }

    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, params.pageSize ?? 20));
    const start = (page - 1) * pageSize;
    const totalItems = items.length;

    return ok({
      items: items.slice(start, start + pageSize).map(enrich),
      meta: {
        page,
        limit: pageSize,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
      },
    });
  }

  // ----- Detail -----
  const detailMatch = path.match(/^\/materials-receiving\/([\w-]+)$/);
  if (detailMatch && method === "GET") {
    const id = detailMatch[1] ?? "";
    await simulateLatency(200);
    const row = receivings.find((r) => r.id === id);
    if (!row) {
      return fail("ไม่พบ Materials Receiving", 404, "NOT_FOUND");
    }
    const pkgs = packages
      .filter((p) => p.materialReceivingId === id)
      .sort((a, b) => a.packageNo - b.packageNo);
    return ok({ ...enrich(row), packages: pkgs });
  }

  // ----- Create -----
  if (path === "/materials-receiving" && method === "POST") {
    await simulateLatency();
    const data = (await getBody(body)) as Record<string, unknown>;
    const materialId = data.materialId as string;
    const supplierId = data.supplierId as string;
    const receiveQuantity = data.receiveQuantity as string;
    const supplierProductionDate = data.supplierProductionDate as string;
    const receiveDate = data.receiveDate as string;
    const idempotencyKey = (data.idempotencyKey as string | null) ?? null;

    if (!materialId || !supplierId || !receiveQuantity) {
      return fail("materialId, supplierId, receiveQuantity are required", 400);
    }
    const material = mockDb.materials.find((m) => m.id === materialId);
    if (!material || !material.isActive) {
      return fail("Material ไม่พบหรือ inactive", 400, "MATERIAL_INACTIVE");
    }
    if (!mockDb.suppliers.find((s) => s.id === supplierId && s.isActive)) {
      return fail("Supplier ไม่พบหรือ inactive", 400, "SUPPLIER_INACTIVE");
    }

    // Idempotency check
    if (idempotencyKey) {
      const existing = receivings.find((r) => r.idempotencyKey === idempotencyKey);
      if (existing) {
        return ok(enrich(existing), "พบรายการเดิม (idempotency hit)", 200);
      }
    }

    const packingQuantity =
      (data.packingQuantityOverride as number | undefined) ??
      (material.packingQuantity as number | null) ??
      0;
    if (packingQuantity < 1) {
      return fail(
        "Material ไม่มี packing_quantity และไม่ได้ระบุ override",
        400,
        "PACKING_QUANTITY_REQUIRED",
      );
    }

    const packageCount = computePackageCount(
      receiveQuantity,
      packingQuantity,
    );
    const id = generateId("mr");
    const internalLotNo = nextInternalLotNo(receiveDate);
    const supplierLotNo = supplierProductionDate
      ? `SUP-${supplierProductionDate.replace(/-/g, "")}`
      : null;

    const newRow: MockMaterialsReceiving = {
      id,
      internalLotNo,
      organizationId: "1",
      supplierId,
      materialId,
      unitId: material.unitId,
      receiveQuantity,
      packingQuantity,
      packageCount,
      supplierLotNo,
      supplierProductionDate,
      receiveDate,
      qrCode: null,
      qrPayload: null,
      status: "draft",
      idempotencyKey,
      remark: (data.remark as string | null) ?? null,
      confirmedBy: null,
      confirmedAt: null,
      cancelledBy: null,
      cancelledAt: null,
      cancelReason: null,
      createdBy: "user-001",
      updatedBy: "user-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    newRow.qrPayload = buildQrPayload(newRow);
    receivings.push(newRow);
    const pkgs = buildPackages(
      receiveQuantity,
      packingQuantity,
      packageCount,
      id,
    );
    packages.push(...pkgs);
    return ok(enrich(newRow), "สร้าง Materials Receiving สำเร็จ", 201);
  }

  // ----- Update / Delete / Confirm / Cancel -----
  const actionMatch = path.match(/^\/materials-receiving\/([\w-]+)(?:\/(confirm|cancel))?$/);
  if (actionMatch) {
    const id = actionMatch[1] ?? "";
    const action = actionMatch[2];
    const row = receivings.find((r) => r.id === id);
    if (!row) {
      return fail("ไม่พบ Materials Receiving", 404, "NOT_FOUND");
    }

    if (action === "confirm" && method === "POST") {
      if (row.status !== "draft") {
        return fail(
          "ยืนยันได้เฉพาะรายการสถานะ draft",
          409,
          "INVALID_STATUS",
        );
      }
      // Update stock balance
      let balance = stockBalances.find((b) => b.materialId === row.materialId);
      const qtyBefore = balance ? balance.quantity : "0";
      const qtyAfter = (
        Number(qtyBefore) + Number(row.receiveQuantity)
      ).toFixed(4);
      if (!balance) {
        balance = {
          id: generateId("sb"),
          materialId: row.materialId,
          quantity: qtyAfter,
          lastMovementAt: new Date().toISOString(),
        };
        stockBalances.push(balance);
      } else {
        balance.quantity = qtyAfter;
        balance.lastMovementAt = new Date().toISOString();
      }
      // Record stock transaction
      stockTransactions.push({
        id: generateId("stx"),
        materialId: row.materialId,
        transactionType: "RECEIVE",
        referenceType: "MATERIAL_RECEIVING",
        referenceId: row.id,
        referenceLotNo: row.internalLotNo,
        quantityBefore: Number(qtyBefore).toFixed(4),
        quantityIn: Number(row.receiveQuantity).toFixed(4),
        quantityOut: "0.0000",
        quantityAfter: qtyAfter,
        transactionDate: new Date().toISOString(),
        remark: `Confirmed from receiving ${row.internalLotNo}`,
        createdBy: "user-001",
      });
      row.status = "confirmed";
      row.confirmedBy = "user-001";
      row.confirmedAt = new Date().toISOString();
      row.updatedBy = "user-001";
      row.updatedAt = new Date().toISOString();
      return ok(enrich(row), "ยืนยัน Materials Receiving สำเร็จ");
    }

    if (action === "cancel" && method === "POST") {
      if (row.status === "cancelled") {
        return fail("รายการถูกยกเลิกไปแล้ว", 409, "ALREADY_CANCELLED");
      }
      const data = (await getBody(body)) as Record<string, unknown>;
      const cancelReason = (data.cancelReason as string | undefined)?.trim();
      if (!cancelReason) {
        return fail("ต้องระบุเหตุผลในการยกเลิก", 400, "CANCEL_REASON_REQUIRED");
      }
      // If was confirmed, revert stock
      if (row.status === "confirmed") {
        const balance = stockBalances.find(
          (b) => b.materialId === row.materialId,
        );
        if (balance) {
          const qtyBefore = balance.quantity;
          const qtyAfter = (
            Number(qtyBefore) - Number(row.receiveQuantity)
          ).toFixed(4);
          balance.quantity = qtyAfter;
          balance.lastMovementAt = new Date().toISOString();
          stockTransactions.push({
            id: generateId("stx"),
            materialId: row.materialId,
            transactionType: "ADJUST",
            referenceType: "MATERIAL_RECEIVING",
            referenceId: row.id,
            referenceLotNo: row.internalLotNo,
            quantityBefore: Number(qtyBefore).toFixed(4),
            quantityIn: "0.0000",
            quantityOut: Number(row.receiveQuantity).toFixed(4),
            quantityAfter: qtyAfter,
            transactionDate: new Date().toISOString(),
            remark: `Cancelled receiving ${row.internalLotNo}: ${cancelReason}`,
            createdBy: "user-001",
          });
        }
      }
      row.status = "cancelled";
      row.cancelledBy = "user-001";
      row.cancelledAt = new Date().toISOString();
      row.cancelReason = cancelReason;
      row.updatedBy = "user-001";
      row.updatedAt = new Date().toISOString();
      return ok(enrich(row), "ยกเลิก Materials Receiving สำเร็จ");
    }

    // PATCH (update draft)
    if (method === "PATCH") {
      if (row.status !== "draft") {
        return fail("แก้ไขได้เฉพาะรายการสถานะ draft", 409, "INVALID_STATUS");
      }
      const data = (await getBody(body)) as Record<string, unknown>;
      if (data.supplierId) row.supplierId = data.supplierId as string;
      if (data.receiveQuantity)
        row.receiveQuantity = data.receiveQuantity as string;
      if (data.supplierProductionDate) {
        row.supplierProductionDate = data.supplierProductionDate as string;
        row.supplierLotNo = `SUP-${(data.supplierProductionDate as string).replace(
          /-/g,
          "",
        )}`;
      }
      if (data.receiveDate) row.receiveDate = data.receiveDate as string;
      if (data.packingQuantityOverride) {
        const newPacking = Math.floor(
          Number(data.packingQuantityOverride),
        );
        if (newPacking >= 1) {
          row.packingQuantity = newPacking;
          row.packageCount = computePackageCount(
            row.receiveQuantity,
            newPacking,
          );
        }
      } else if (data.receiveQuantity) {
        row.packageCount = computePackageCount(
          row.receiveQuantity,
          row.packingQuantity,
        );
      }
      if (data.remark !== undefined) {
        row.remark = (data.remark as string | null) ?? null;
      }
      row.qrPayload = buildQrPayload(row);
      // Rebuild packages
      const existing = packages.filter(
        (p) => p.materialReceivingId === id,
      );
      existing.forEach((p) => {
        const idx = packages.indexOf(p);
        if (idx >= 0) packages.splice(idx, 1);
      });
      packages.push(
        ...buildPackages(
          row.receiveQuantity,
          row.packingQuantity,
          row.packageCount,
          id,
        ),
      );
      row.updatedBy = "user-001";
      row.updatedAt = new Date().toISOString();
      return ok(enrich(row), "แก้ไข Materials Receiving สำเร็จ");
    }

    // DELETE
    if (method === "DELETE") {
      if (row.status !== "draft") {
        return fail("ลบได้เฉพาะรายการสถานะ draft", 409, "INVALID_STATUS");
      }
      const idx = receivings.indexOf(row);
      if (idx >= 0) receivings.splice(idx, 1);
      // remove packages
      for (let i = packages.length - 1; i >= 0; i -= 1) {
        const p = packages[i];
        if (p && p.materialReceivingId === id) packages.splice(i, 1);
      }
      return ok({ success: true }, "ลบ Materials Receiving สำเร็จ");
    }
  }

  return null;
}
