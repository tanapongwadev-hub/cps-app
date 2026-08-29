/**
 * Mock handler for /products and /boms endpoints
 *
 * Products:
 *  - GET    /products              (list)
 *  - GET    /products/lookups       (categories + units)
 *  - GET    /products/:id          (detail)
 *  - POST   /products               (create)
 *  - PATCH  /products/:id          (update)
 *  - DELETE /products/:id           (deactivate)
 *  - PATCH  /products/:id/restore  (restore)
 *
 * BOMs:
 *  - GET    /boms/product/:productId  (list by product)
 *  - GET    /boms/:id                  (detail)
 *  - POST   /boms                      (create)
 *  - PATCH  /boms/:id                  (update)
 *  - POST   /boms/:id/items            (add item)
 *  - DELETE /boms/:id/items/:itemId    (remove item)
 *  - PATCH  /boms/:id/activate        (activate)
 *  - PATCH  /boms/:id/deactivate      (deactivate)
 *  - DELETE /boms/:id                  (delete draft)
 */

import {
  ok,
  fail,
  getBody,
  generateId,
  simulateLatency,
} from "./helpers";

const NOW = new Date().toISOString();

// Local mock categories (products module uses nameTh/nameEn)
interface MockCategory {
  id: string;
  code: string;
  name: string;
  nameTh: string;
  nameEn: string | null;
  isActive: boolean;
}

interface MockUnit {
  id: string;
  code: string;
  nameTh: string;
  isActive: boolean;
}

const mockCategories: MockCategory[] = [
  { id: "cat-001", code: "ENGINE", name: "เครื่องยนต์", nameTh: "เครื่องยนต์", nameEn: "Engine", isActive: true },
  { id: "cat-002", code: "BRAKE", name: "ระบบเบรก", nameTh: "ระบบเบรก", nameEn: "Brake System", isActive: true },
  { id: "cat-003", code: "SUSPENSION", name: "ระบบกันสะเทือน", nameTh: "ระบบกันสะเทือน", nameEn: "Suspension", isActive: true },
  { id: "cat-004", code: "ELECTRICAL", name: "ระบบไฟฟ้า", nameTh: "ระบบไฟฟ้า", nameEn: "Electrical", isActive: true },
  { id: "cat-005", code: "BODY", name: "ตัวถัง", nameTh: "ตัวถัง", nameEn: "Body", isActive: true },
];

const mockUnits: MockUnit[] = [
  { id: "unit-001", code: "PCS", nameTh: "ชิ้น", isActive: true },
  { id: "unit-002", code: "SET", nameTh: "ชุด", isActive: true },
  { id: "unit-003", code: "KG", nameTh: "กิโลกรัม", isActive: true },
  { id: "unit-004", code: "LTR", nameTh: "ลิตร", isActive: true },
];

// Local mock materials (for BOM items)
interface MockMaterial {
  id: string;
  code: string;
  name: string;
  unitId: string;
  unitNameTh: string;
}

const mockMaterials: MockMaterial[] = [
  { id: "mat-001", code: "MAT-001", name: "เหล็กกล้าคาร์บอน", unitId: "unit-003", unitNameTh: "กิโลกรัม" },
  { id: "mat-002", code: "MAT-002", name: "อลูมิเนียมอัลลอยด์", unitId: "unit-003", unitNameTh: "กิโลกรัม" },
  { id: "mat-003", code: "MAT-003", name: "ยางรถยนต์", unitId: "unit-001", unitNameTh: "ชิ้น" },
  { id: "mat-004", code: "MAT-004", name: "น้ำมันเครื่อง", unitId: "unit-004", unitNameTh: "ลิตร" },
  { id: "mat-005", code: "MAT-005", name: "ผ้าเบรก", unitId: "unit-001", unitNameTh: "ชิ้น" },
];

interface MockProduct {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  description: string | null;
  specification: string | null;
  categoryId: string;
  productType: "FG" | "SFG" | null;
  brand: string | null;
  model: string | null;
  oemPartNumber: string | null;
  unitId: string;
  processLineName: string | null;
  productionProcess: string | null;
  cycleTimeMinutes: number | null;
  weight: number | null;
  hsCode: string | null;
  minStock: number | null;
  maxStock: number | null;
  unitPrice: number | null;
  currency: string;
  imagePath: string | null;
  isActive: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  category: { id: string; code: string; nameTh: string; nameEn: string | null };
  unit: { id: string; code: string; nameTh: string };
}

interface MockBomItem {
  id: string;
  bomId: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  sortOrder: number;
  quantity: number;
  unitId: string;
  unitNameTh: string;
  isScrap: boolean;
  wastagePercent: number | null;
  remark: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

type BomStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

interface MockBom {
  id: string;
  productId: string;
  version: string;
  status: BomStatus;
  specification: string | null;
  remark: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  product: { id: string; code: string; nameTh: string };
  items: MockBomItem[];
}

// In-memory store
const products: MockProduct[] = [
  {
    id: "prod-001",
    code: "PRD-001",
    nameTh: "เครื่องยนต์ 4 สูบ",
    nameEn: "4-Cylinder Engine",
    description: "เครื่องยนต์ดีเซล 4 สูบ สำหรับรถบรรทุกขนาดเล็ก",
    specification: "2000cc, 100HP",
    categoryId: "cat-001",
    productType: "FG",
    brand: "ThaiPower",
    model: "TP-2000",
    oemPartNumber: "OEM-TP-2000-001",
    unitId: "unit-001",
    processLineName: "Line A",
    productionProcess: "ประกอบเครื่อง",
    cycleTimeMinutes: 120,
    weight: 250,
    hsCode: "8408.20.00",
    minStock: 5,
    maxStock: 20,
    unitPrice: 150000,
    currency: "THB",
    imagePath: null,
    isActive: true,
    createdBy: null,
    updatedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    category: { id: "cat-001", code: "ENGINE", nameTh: "เครื่องยนต์", nameEn: "Engine" },
    unit: { id: "unit-001", code: "PCS", nameTh: "ชิ้น" },
  },
  {
    id: "prod-002",
    code: "PRD-002",
    nameTh: "ผ้าเบรกหน้า",
    nameEn: "Front Brake Pad",
    description: "ผ้าเบรกหน้าสำหรับรถยนต์นั่งส่วนบุคคล",
    specification: "ceramic, non-asbestos",
    categoryId: "cat-002",
    productType: "FG",
    brand: "BrakeMaster",
    model: "BM-FP100",
    oemPartNumber: "OEM-BM-FP100",
    unitId: "unit-001",
    processLineName: "Line B",
    productionProcess: "ขึ้นรูป + ประกอบ",
    cycleTimeMinutes: 15,
    weight: 0.5,
    hsCode: "8708.30.00",
    minStock: 100,
    maxStock: 500,
    unitPrice: 850,
    currency: "THB",
    imagePath: null,
    isActive: true,
    createdBy: null,
    updatedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    category: { id: "cat-002", code: "BRAKE", nameTh: "ระบบเบรก", nameEn: "Brake System" },
    unit: { id: "unit-001", code: "PCS", nameTh: "ชิ้น" },
  },
  {
    id: "prod-003",
    code: "PRD-003",
    nameTh: "ชุดกันสะเทือนหลัง",
    nameEn: "Rear Suspension Kit",
    description: "ชุดกันสะเทือนหลังแบบสปริงคู่",
    specification: "spring rate 8kg/mm",
    categoryId: "cat-003",
    productType: "FG",
    brand: "SuspFlex",
    model: "SF-RK200",
    oemPartNumber: "OEM-SF-RK200",
    unitId: "unit-002",
    processLineName: "Line C",
    productionProcess: "ประกอบชุด",
    cycleTimeMinutes: 45,
    weight: 15,
    hsCode: "8708.80.00",
    minStock: 20,
    maxStock: 100,
    unitPrice: 4500,
    currency: "THB",
    imagePath: null,
    isActive: true,
    createdBy: null,
    updatedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    category: { id: "cat-003", code: "SUSPENSION", nameTh: "ระบบกันสะเทือน", nameEn: "Suspension" },
    unit: { id: "unit-002", code: "SET", nameTh: "ชุด" },
  },
  {
    id: "prod-004",
    code: "PRD-004",
    nameTh: "แผงหน้าปัดดิจิทัล",
    nameEn: "Digital Dashboard Panel",
    description: "แผงหน้าปัดดิจิทัล LCD 7 นิ้ว",
    specification: "7-inch LCD, 800x480",
    categoryId: "cat-004",
    productType: "FG",
    brand: "ElecDash",
    model: "ED-DP700",
    oemPartNumber: "OEM-ED-DP700",
    unitId: "unit-001",
    processLineName: "Line D",
    productionProcess: "ประกอบ + ทดสอบ",
    cycleTimeMinutes: 30,
    weight: 1.2,
    hsCode: "9013.80.00",
    minStock: 30,
    maxStock: 150,
    unitPrice: 3200,
    currency: "THB",
    imagePath: null,
    isActive: false,
    createdBy: null,
    updatedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    category: { id: "cat-004", code: "ELECTRICAL", nameTh: "ระบบไฟฟ้า", nameEn: "Electrical" },
    unit: { id: "unit-001", code: "PCS", nameTh: "ชิ้น" },
  },
];

const boms: MockBom[] = [
  {
    id: "bom-001",
    productId: "prod-001",
    version: "v1",
    status: "ACTIVE",
    specification: "BOM สำหรับเครื่องยนต์ 4 สูบ",
    remark: "ใช้วัตถุดิบคุณภาพสูง",
    effectiveFrom: "2024-01-01",
    effectiveTo: null,
    createdBy: null,
    updatedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    product: { id: "prod-001", code: "PRD-001", nameTh: "เครื่องยนต์ 4 สูบ" },
    items: [
      {
        id: "bom-item-001",
        bomId: "bom-001",
        materialId: "mat-001",
        materialCode: "MAT-001",
        materialName: "เหล็กกล้าคาร์บอน",
        sortOrder: 1,
        quantity: 250,
        unitId: "unit-003",
        unitNameTh: "กิโลกรัม",
        isScrap: false,
        wastagePercent: 5,
        remark: "ใช้เกรด A",
        createdBy: null,
        updatedBy: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
      {
        id: "bom-item-002",
        bomId: "bom-001",
        materialId: "mat-004",
        materialCode: "MAT-004",
        materialName: "น้ำมันเครื่อง",
        sortOrder: 2,
        quantity: 5,
        unitId: "unit-004",
        unitNameTh: "ลิตร",
        isScrap: false,
        wastagePercent: null,
        remark: null,
        createdBy: null,
        updatedBy: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  },
  {
    id: "bom-002",
    productId: "prod-002",
    version: "v1",
    status: "DRAFT",
    specification: "BOM สำหรับผ้าเบรกหน้า",
    remark: null,
    effectiveFrom: null,
    effectiveTo: null,
    createdBy: null,
    updatedBy: null,
    createdAt: NOW,
    updatedAt: NOW,
    product: { id: "prod-002", code: "PRD-002", nameTh: "ผ้าเบรกหน้า" },
    items: [
      {
        id: "bom-item-003",
        bomId: "bom-002",
        materialId: "mat-005",
        materialCode: "MAT-005",
        materialName: "ผ้าเบรก",
        sortOrder: 1,
        quantity: 2,
        unitId: "unit-001",
        unitNameTh: "ชิ้น",
        isScrap: false,
        wastagePercent: 10,
        remark: "รวมของเสีย",
        createdBy: null,
        updatedBy: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
  },
];

// ============================================================================
// Products handlers
// ============================================================================

interface ListQuery {
  search?: string;
  isActive?: boolean;
  productType?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export async function setupProductsMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // GET /products
  if (path === "/products" && method === "GET") {
    await simulateLatency();
    const q = body as ListQuery;
    const search = q?.search ?? "";
    const isActive = q?.isActive;
    const productType = q?.productType as string | undefined;
    const categoryId = q?.categoryId as string | undefined;

    let items = [...products];

    if (search) {
      const s = String(search).toLowerCase();
      items = items.filter(
        (p) =>
          p.code.toLowerCase().includes(s) ||
          p.nameTh.toLowerCase().includes(s) ||
          (p.nameEn ?? "").toLowerCase().includes(s),
      );
    }
    if (isActive !== undefined) {
      items = items.filter((p) => p.isActive === isActive);
    }
    if (productType) {
      items = items.filter((p) => p.productType === productType);
    }
    if (categoryId) {
      items = items.filter((p) => p.categoryId === categoryId);
    }

    const totalItems = items.length;
    return ok({ items, meta: { totalItems } });
  }

  // GET /products/lookups
  if (path === "/products/lookups" && method === "GET") {
    await simulateLatency();
    const categories = mockCategories
      .filter((c) => c.isActive)
      .map((c) => ({
        id: c.id,
        code: c.code,
        nameTh: c.nameTh,
        nameEn: c.nameEn,
      }));
    const units = mockUnits
      .filter((u) => u.isActive)
      .map((u) => ({
        id: u.id,
        code: u.code,
        nameTh: u.nameTh,
      }));
    return ok({ categories, units });
  }

  // GET /products/:id
  const productDetailMatch = /^\/products\/([^/]+)$/.exec(path);
  if (productDetailMatch && method === "GET") {
    await simulateLatency();
    const id = productDetailMatch[1];
    const product = products.find((p) => p.id === id);
    if (!product) return fail("Product not found", 404);
    return ok(product);
  }

  // POST /products
  if (path === "/products" && method === "POST") {
    await simulateLatency();
    const dto = await getBody(body);
    const code = String(dto.code ?? "");
    const existing = products.find((p) => p.code === code);
    if (existing) return fail(`Product code "${code}" already exists`, 409);
    const catId = String(dto.categoryId ?? "");
    const cat = mockCategories.find((c) => c.id === catId);
    if (!cat) return fail(`Category ${catId} not found`, 400);
    const unitId = String(dto.unitId ?? "");
    const unit = mockUnits.find((u) => u.id === unitId);
    if (!unit) return fail(`Unit ${unitId} not found`, 400);

    const product: MockProduct = {
      id: generateId("prod"),
      code,
      nameTh: String(dto.nameTh ?? ""),
      nameEn: dto.nameEn != null ? String(dto.nameEn) : null,
      description: dto.description != null ? String(dto.description) : null,
      specification: dto.specification != null ? String(dto.specification) : null,
      categoryId: catId,
      productType: (dto.productType as "FG" | "SFG" | null) ?? "FG",
      brand: dto.brand != null ? String(dto.brand) : null,
      model: dto.model != null ? String(dto.model) : null,
      oemPartNumber: dto.oemPartNumber != null ? String(dto.oemPartNumber) : null,
      unitId,
      processLineName: dto.processLineName != null ? String(dto.processLineName) : null,
      productionProcess: dto.productionProcess != null ? String(dto.productionProcess) : null,
      cycleTimeMinutes: dto.cycleTimeMinutes != null ? Number(dto.cycleTimeMinutes) : null,
      weight: dto.weight != null ? Number(dto.weight) : null,
      hsCode: dto.hsCode != null ? String(dto.hsCode) : null,
      minStock: dto.minStock != null ? Number(dto.minStock) : null,
      maxStock: dto.maxStock != null ? Number(dto.maxStock) : null,
      unitPrice: dto.unitPrice != null ? Number(dto.unitPrice) : null,
      currency: dto.currency != null ? String(dto.currency) : "THB",
      imagePath: dto.imagePath != null ? String(dto.imagePath) : null,
      isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : true,
      createdBy: null,
      updatedBy: null,
      createdAt: NOW,
      updatedAt: NOW,
      category: { id: cat.id, code: cat.code, nameTh: cat.nameTh, nameEn: cat.nameEn },
      unit: { id: unit.id, code: unit.code, nameTh: unit.nameTh },
    };
    products.push(product);
    return ok(product, "Product created", 201);
  }

  // PATCH /products/:id
  const productPatchMatch = /^\/products\/([^/]+)$/.exec(path);
  if (productPatchMatch && method === "PATCH") {
    await simulateLatency();
    const id = productPatchMatch[1];
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return fail("Product not found", 404);
    const dto = await getBody(body);
    const existing = products[idx]!;

    if (dto.categoryId) {
      const catId = String(dto.categoryId);
      const cat = mockCategories.find((c) => c.id === catId);
      if (!cat) return fail(`Category ${catId} not found`, 400);
      (dto as Record<string, unknown>).category = { id: cat.id, code: cat.code, nameTh: cat.nameTh, nameEn: cat.nameEn };
    }
    if (dto.unitId) {
      const unitId = String(dto.unitId);
      const unit = mockUnits.find((u) => u.id === unitId);
      if (!unit) return fail(`Unit ${unitId} not found`, 400);
      (dto as Record<string, unknown>).unit = { id: unit.id, code: unit.code, nameTh: unit.nameTh };
    }

    const updated: MockProduct = {
      ...existing,
      code: dto.code != null ? String(dto.code) : existing.code,
      nameTh: dto.nameTh != null ? String(dto.nameTh) : existing.nameTh,
      nameEn: dto.nameEn != null ? String(dto.nameEn) : existing.nameEn,
      description: dto.description != null ? String(dto.description) : existing.description,
      specification: dto.specification != null ? String(dto.specification) : existing.specification,
      categoryId: dto.categoryId != null ? String(dto.categoryId) : existing.categoryId,
      productType: dto.productType != null ? (dto.productType as "FG" | "SFG") : existing.productType,
      brand: dto.brand != null ? String(dto.brand) : existing.brand,
      model: dto.model != null ? String(dto.model) : existing.model,
      oemPartNumber: dto.oemPartNumber != null ? String(dto.oemPartNumber) : existing.oemPartNumber,
      unitId: dto.unitId != null ? String(dto.unitId) : existing.unitId,
      processLineName: dto.processLineName != null ? String(dto.processLineName) : existing.processLineName,
      productionProcess: dto.productionProcess != null ? String(dto.productionProcess) : existing.productionProcess,
      cycleTimeMinutes: dto.cycleTimeMinutes != null ? Number(dto.cycleTimeMinutes) : existing.cycleTimeMinutes,
      weight: dto.weight != null ? Number(dto.weight) : existing.weight,
      hsCode: dto.hsCode != null ? String(dto.hsCode) : existing.hsCode,
      minStock: dto.minStock != null ? Number(dto.minStock) : existing.minStock,
      maxStock: dto.maxStock != null ? Number(dto.maxStock) : existing.maxStock,
      unitPrice: dto.unitPrice != null ? Number(dto.unitPrice) : existing.unitPrice,
      currency: dto.currency != null ? String(dto.currency) : existing.currency,
      imagePath: dto.imagePath != null ? String(dto.imagePath) : existing.imagePath,
      isActive: dto.isActive != null ? Boolean(dto.isActive) : existing.isActive,
      updatedAt: NOW,
      category: (dto as Record<string, unknown>).category as MockProduct["category"] ?? existing.category,
      unit: (dto as Record<string, unknown>).unit as MockProduct["unit"] ?? existing.unit,
    };
    products[idx] = updated;
    return ok(updated);
  }

  // DELETE /products/:id — deactivate
  const productDeleteMatch = /^\/products\/([^/]+)$/.exec(path);
  if (productDeleteMatch && method === "DELETE") {
    await simulateLatency();
    const id = productDeleteMatch[1];
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return fail("Product not found", 404);
    const existing = products[idx]!;
    const updated: MockProduct = { ...existing, isActive: false, updatedAt: NOW };
    products[idx] = updated;
    return ok(updated);
  }

  // PATCH /products/:id/restore
  const productRestoreMatch = /^\/products\/([^/]+)\/restore$/.exec(path);
  if (productRestoreMatch && method === "PATCH") {
    await simulateLatency();
    const id = productRestoreMatch[1];
    const idx = products.findIndex((p) => p.id === id);
    if (idx === -1) return fail("Product not found", 404);
    const existing = products[idx]!;
    const updated: MockProduct = { ...existing, isActive: true, updatedAt: NOW };
    products[idx] = updated;
    return ok(updated);
  }

  return null; // Not handled
}

// ============================================================================
// BOMs handlers
// ============================================================================

interface BomItemDto {
  materialId: string;
  quantity: number;
  unitId: string;
  isScrap?: boolean;
  wastagePercent?: number | null;
  remark?: string | null;
}

interface CreateBomDto {
  productId: string;
  specification?: string | null;
  remark?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  items: BomItemDto[];
}

export async function setupBomsMocks(
  path: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // GET /boms/product/:productId
  const bomByProductMatch = /^\/boms\/product\/([^/]+)$/.exec(path);
  if (bomByProductMatch && method === "GET") {
    await simulateLatency();
    const productId = bomByProductMatch[1];
    const items = boms.filter((b) => b.productId === productId);
    return ok(items);
  }

  // GET /boms/:id
  const bomDetailMatch = /^\/boms\/([^/]+)$/.exec(path);
  if (bomDetailMatch && method === "GET") {
    await simulateLatency();
    const id = bomDetailMatch[1];
    const bom = boms.find((b) => b.id === id);
    if (!bom) return fail("BOM not found", 404);
    return ok(bom);
  }

  // POST /boms
  if (path === "/boms" && method === "POST") {
    await simulateLatency();
    const dto = await getBody(body) as Record<string, unknown>;
    const productId = String(dto.productId ?? "");
    const product = products.find((p) => p.id === productId);
    if (!product) return fail(`Product ${productId} not found`, 400);

    // Calculate next version
    const existing = boms.filter((b) => b.productId === productId);
    const latest = existing.length > 0
      ? existing.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      : null;
    const nextNum = latest ? parseInt(latest.version.replace(/^v/, ""), 10) + 1 : 1;
    const version = `v${nextNum}`;

    // Resolve material + unit names
    const dtoItems = (dto.items ?? []) as Array<{
      materialId: string;
      quantity: number;
      unitId: string;
      isScrap?: boolean;
      wastagePercent?: number | null;
      remark?: string | null;
    }>;
    const resolvedItems: MockBomItem[] = dtoItems.map((item, idx) => {
      const mat = mockMaterials.find((m) => m.id === item.materialId);
      const unit = mockUnits.find((u) => u.id === item.unitId);
      return {
        id: generateId("bom-item"),
        bomId: "",
        materialId: item.materialId,
        materialCode: mat?.code ?? "",
        materialName: mat?.name ?? "",
        sortOrder: idx + 1,
        quantity: item.quantity,
        unitId: item.unitId,
        unitNameTh: unit?.nameTh ?? "",
        isScrap: item.isScrap ?? false,
        wastagePercent: item.wastagePercent ?? null,
        remark: item.remark ?? null,
        createdBy: null,
        updatedBy: null,
        createdAt: NOW,
        updatedAt: NOW,
      };
    });

    const bomId = generateId("bom");
    const bom: MockBom = {
      id: bomId,
      productId,
      version,
      status: "DRAFT",
      specification: dto.specification != null ? String(dto.specification) : null,
      remark: dto.remark != null ? String(dto.remark) : null,
      effectiveFrom: dto.effectiveFrom != null ? String(dto.effectiveFrom) : null,
      effectiveTo: dto.effectiveTo != null ? String(dto.effectiveTo) : null,
      createdBy: null,
      updatedBy: null,
      createdAt: NOW,
      updatedAt: NOW,
      product: { id: product.id, code: product.code, nameTh: product.nameTh },
      items: resolvedItems.map((item) => ({ ...item, bomId })),
    };
    boms.push(bom);
    return ok(bom, "BOM created", 201);
  }

  // PATCH /boms/:id
  const bomPatchMatch = /^\/boms\/([^/]+)$/.exec(path);
  if (bomPatchMatch && method === "PATCH") {
    await simulateLatency();
    const id = bomPatchMatch[1];
    const idx = boms.findIndex((b) => b.id === id);
    if (idx === -1) return fail("BOM not found", 404);
    const existingBom = boms[idx]!;
    const dto = await getBody(body) as Record<string, unknown>;
    if (existingBom.status === "ACTIVE") {
      return fail("Cannot update an ACTIVE BOM. Deactivate it first.", 400);
    }
    const updated: MockBom = {
      ...existingBom,
      specification: dto.specification != null ? String(dto.specification) : existingBom.specification,
      remark: dto.remark != null ? String(dto.remark) : existingBom.remark,
      effectiveFrom: dto.effectiveFrom != null ? String(dto.effectiveFrom) : existingBom.effectiveFrom,
      effectiveTo: dto.effectiveTo != null ? String(dto.effectiveTo) : existingBom.effectiveTo,
      updatedAt: NOW,
      items: existingBom.items,
    };
    boms[idx] = updated;
    return ok(updated);
  }

  // POST /boms/:id/items — add item
  const bomAddItemMatch = /^\/boms\/([^/]+)\/items$/.exec(path);
  if (bomAddItemMatch && method === "POST") {
    await simulateLatency();
    const bomId = bomAddItemMatch[1]!;
    const bomIdx = boms.findIndex((b) => b.id === bomId);
    if (bomIdx === -1) return fail("BOM not found", 404);
    const existingBom = boms[bomIdx]!;
    if (existingBom.status === "ACTIVE") {
      return fail("Cannot add item to an ACTIVE BOM", 400);
    }
    const dto = await getBody(body) as Record<string, unknown>;
    const mat = mockMaterials.find((m) => m.id === dto.materialId);
    const unit = mockUnits.find((u) => u.id === dto.unitId);
    const maxSort = existingBom.items.length > 0
      ? Math.max(...existingBom.items.map((i) => i.sortOrder))
      : 0;
    const newItem: MockBomItem = {
      id: generateId("bom-item"),
      bomId,
      materialId: String(dto.materialId ?? ""),
      materialCode: mat?.code ?? "",
      materialName: mat?.name ?? "",
      sortOrder: maxSort + 1,
      quantity: Number(dto.quantity ?? 0),
      unitId: String(dto.unitId),
      unitNameTh: unit?.nameTh ?? "",
      isScrap: dto.isScrap !== undefined ? Boolean(dto.isScrap) : false,
      wastagePercent: dto.wastagePercent != null ? Number(dto.wastagePercent) : null,
      remark: dto.remark != null ? String(dto.remark) : null,
      createdBy: null,
      updatedBy: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
    existingBom.items.push(newItem);
    return ok(existingBom);
  }

  // DELETE /boms/:id/items/:itemId
  const bomRemoveItemMatch = /^\/boms\/([^/]+)\/items\/([^/]+)$/.exec(path);
  if (bomRemoveItemMatch && method === "DELETE") {
    await simulateLatency();
    const bomId = bomRemoveItemMatch[1];
    const itemId = bomRemoveItemMatch[2];
    const bomIdx = boms.findIndex((b) => b.id === bomId);
    if (bomIdx === -1) return fail("BOM not found", 404);
    const existingBom = boms[bomIdx]!;
    if (existingBom.status === "ACTIVE") {
      return fail("Cannot remove item from an ACTIVE BOM", 400);
    }
    const itemIdx = existingBom.items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) return fail("Item not found", 404);
    existingBom.items.splice(itemIdx, 1);
    return ok(existingBom);
  }

  // PATCH /boms/:id/activate
  const bomActivateMatch = /^\/boms\/([^/]+)\/activate$/.exec(path);
  if (bomActivateMatch && method === "PATCH") {
    await simulateLatency();
    const id = bomActivateMatch[1];
    const idx = boms.findIndex((b) => b.id === id);
    if (idx === -1) return fail("BOM not found", 404);
    const targetBom = boms[idx]!;
    // Deactivate all others for this product
    boms.forEach((b, i) => {
      if (b.productId === targetBom.productId && b.status === "ACTIVE") {
        boms[i] = { ...b, status: "INACTIVE", updatedAt: NOW };
      }
    });
    const updated: MockBom = { ...targetBom, status: "ACTIVE", updatedAt: NOW };
    boms[idx] = updated;
    return ok(updated);
  }

  // PATCH /boms/:id/deactivate
  const bomDeactivateMatch = /^\/boms\/([^/]+)\/deactivate$/.exec(path);
  if (bomDeactivateMatch && method === "PATCH") {
    await simulateLatency();
    const id = bomDeactivateMatch[1];
    const idx = boms.findIndex((b) => b.id === id);
    if (idx === -1) return fail("BOM not found", 404);
    const existingBom = boms[idx]!;
    const updated: MockBom = { ...existingBom, status: "INACTIVE", updatedAt: NOW };
    boms[idx] = updated;
    return ok(updated);
  }

  // DELETE /boms/:id
  const bomDeleteMatch = /^\/boms\/([^/]+)$/.exec(path);
  if (bomDeleteMatch && method === "DELETE") {
    await simulateLatency();
    const id = bomDeleteMatch[1];
    const idx = boms.findIndex((b) => b.id === id);
    if (idx === -1) return fail("BOM not found", 404);
    const existingBom = boms[idx]!;
    if (existingBom.status === "ACTIVE") {
      return fail("Cannot delete an ACTIVE BOM. Deactivate it first.", 400);
    }
    boms.splice(idx, 1);
    return ok({ deleted: true });
  }

  return null;
}
