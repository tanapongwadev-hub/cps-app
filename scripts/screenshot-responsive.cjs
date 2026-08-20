// Screenshot script — takes responsive shots at 3 breakpoints
const { chromium } = require('@playwright/test');
const path = require('path');

const CHROME = 'C:\\Users\\USER\\AppData\\Local\\ms-playwright\\chromium-1217\\chrome-win64\\chrome.exe';
const BASE = 'http://localhost:3000';
const OUT_DIR = 'C:\\Users\\USER\\Desktop\\cps-mr-responsive';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 720 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

// Mock data for materials-receiving
const MOCK_RECEIVINGS = {
  success: true,
  data: {
    items: [
      {
        id: '1',
        internalLotNo: 'CCI-20260810-001',
        organizationId: '1',
        supplierId: '1',
        materialId: '1',
        unitId: '1',
        receiveQuantity: '1050.0000',
        packingQuantity: 200,
        packageCount: 6,
        supplierLotNo: 'SUP-20260801',
        supplierProductionDate: '2026-08-01',
        receiveDate: '2026-08-10',
        qrCode: null,
        qrPayload: { version: '1.0', internalLotNo: 'CCI-20260810-001' },
        status: 'draft',
        idempotencyKey: null,
        remark: 'ทดสอบ responsive',
        confirmedBy: null,
        confirmedAt: null,
        cancelledBy: null,
        cancelledAt: null,
        cancelReason: null,
        createdBy: '1',
        updatedBy: '1',
        createdAt: '2026-08-10T00:00:00.000Z',
        updatedAt: '2026-08-10T00:00:00.000Z',
        supplier: { id: '1', code: 'SUP-001', nameTh: 'บริษัท ตัวอย่าง จำกัด' },
        material: { id: '1', code: 'A-001', name: 'น้ำมันปาล์มดิบ' },
        unit: { id: '1', code: 'KG' },
      },
      {
        id: '2',
        internalLotNo: 'CCI-20260809-002',
        organizationId: '1',
        supplierId: '2',
        materialId: '2',
        unitId: '1',
        receiveQuantity: '500.0000',
        packingQuantity: 100,
        packageCount: 5,
        supplierLotNo: 'SUP-20260802',
        supplierProductionDate: '2026-08-02',
        receiveDate: '2026-08-09',
        qrCode: null,
        qrPayload: null,
        status: 'confirmed',
        idempotencyKey: null,
        remark: null,
        confirmedBy: '1',
        confirmedAt: '2026-08-09T10:00:00.000Z',
        cancelledBy: null,
        cancelledAt: null,
        cancelReason: null,
        createdBy: '1',
        updatedBy: '1',
        createdAt: '2026-08-09T00:00:00.000Z',
        updatedAt: '2026-08-09T10:00:00.000Z',
        supplier: { id: '2', code: 'SUP-002', nameTh: 'บริษัท ทดสอบ จำกัด' },
        material: { id: '2', code: 'A-002', name: 'น้ำมันมะพร้าว' },
        unit: { id: '1', code: 'KG' },
      },
      {
        id: '3',
        internalLotNo: 'CCI-20260808-001',
        organizationId: '1',
        supplierId: '1',
        materialId: '3',
        unitId: '1',
        receiveQuantity: '2000.0000',
        packingQuantity: 250,
        packageCount: 8,
        supplierLotNo: 'SUP-20260730',
        supplierProductionDate: '2026-07-30',
        receiveDate: '2026-08-08',
        qrCode: null,
        qrPayload: null,
        status: 'cancelled',
        idempotencyKey: null,
        remark: null,
        confirmedBy: '1',
        confirmedAt: '2026-08-08T10:00:00.000Z',
        cancelledBy: '1',
        cancelledAt: '2026-08-08T15:00:00.000Z',
        cancelReason: 'ทดสอบยกเลิก',
        createdBy: '1',
        updatedBy: '1',
        createdAt: '2026-08-08T00:00:00.000Z',
        updatedAt: '2026-08-08T15:00:00.000Z',
        supplier: { id: '1', code: 'SUP-001', nameTh: 'บริษัท ตัวอย่าง จำกัด' },
        material: { id: '3', code: 'A-003', name: 'น้ำตาลทราย' },
        unit: { id: '1', code: 'KG' },
      },
    ],
    meta: { page: 1, limit: 20, totalItems: 3, totalPages: 1 },
  },
};

const MOCK_LOOKUPS = {
  success: true,
  data: {
    suppliers: [
      { id: '1', code: 'SUP-001', nameTh: 'บริษัท ตัวอย่าง จำกัด' },
      { id: '2', code: 'SUP-002', nameTh: 'บริษัท ทดสอบ จำกัด' },
    ],
    materials: [
      { id: '1', code: 'A-001', name: 'น้ำมันปาล์มดิบ', packingQuantity: 200, unitId: '1' },
      { id: '2', code: 'A-002', name: 'น้ำมันมะพร้าว', packingQuantity: 100, unitId: '1' },
      { id: '3', code: 'A-003', name: 'น้ำตาลทราย', packingQuantity: 250, unitId: '1' },
    ],
    units: [
      { id: '1', code: 'KG', nameTh: 'กิโลกรัม' },
    ],
  },
};

const AUTH_PAYLOAD = {
  state: {
    user: {
      id: '1',
      username: 'superadmin',
      email: 'superadmin@cps.local',
      displayName: 'Super Admin',
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      permissionVersion: 1,
    },
    currentDepartmentRole: {
      departmentId: '1',
      departmentCode: 'CPS',
      departmentName: 'CPS',
      roleId: '1',
      roleCode: 'SUPER_ADMIN',
      roleName: 'Super Admin',
    },
    userDepartmentRoles: [],
    accessControl: { '*': 'SUPER_ADMIN' },
    permissions: ['*'],
    menu: [],
    accessToken: 'mock-screenshot-token',
    refreshToken: 'mock-screenshot-refresh',
    expiresAt: Date.now() + 3600 * 1000,
    isAuthenticated: true,
    needsDepartmentSelection: false,
  },
  version: 0,
};

async function seedAuth(context, realToken) {
  const payload = {
    state: {
      ...AUTH_PAYLOAD.state,
      accessToken: realToken,
    },
    version: 0,
  };
  await context.addInitScript((p) => {
    localStorage.setItem('admin.auth.token', JSON.stringify(p));
  }, payload);
}

async function getRealToken() {
  const http = require('http');
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ username: 'superadmin', password: 'change-me-secure-password' });
    const req = http.request(
      {
        method: 'POST',
        hostname: 'localhost',
        port: 3001,
        path: '/api/v1/auth/login',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try {
            const body = JSON.parse(buf);
            resolve(body?.data?.authentication?.accessToken ?? body?.data?.accessToken ?? body?.accessToken);
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const fs = require('fs');
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  // Get a real token from the backend
  console.log('Logging in to backend...');
  const realToken = await getRealToken();
  console.log('Got real token:', realToken ? `yes (${realToken.slice(0, 30)}...)` : 'NO');
  if (!realToken) {
    console.error('Cannot get backend token. Is the backend running on port 3001?');
    process.exit(1);
  }

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    await seedAuth(context, realToken);
    const page = await context.newPage();

    await page.goto(BASE + '/materials/materials-receiving', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);

    const file = path.join(OUT_DIR, `${vp.name}-${vp.width}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✓ ${vp.name} (${vp.width}x${vp.height}) → ${file}`);

    await context.close();
  }

  await browser.close();
  console.log('All screenshots done.');
})();
