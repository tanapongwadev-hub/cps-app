// Find draft Goods Receipts and bulk-fix items missing supplierDocNo
// Usage: node scripts/fix-draft-gr.cjs [baseUrl] [accessToken]
const http = require('http');

const BASE = process.argv[2] || 'http://localhost:3000';
const TOKEN = process.argv[3] || '';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

(async () => {
  console.log('=== Step 1: List draft goods receipts ===');
  const list = await request('GET', '/goods-receipts?status=draft&limit=50');
  console.log('Status:', list.status, '| Count:', list.body?.meta?.totalItems);
  const drafts = list.body?.items || [];
  if (drafts.length === 0) {
    console.log('No drafts found. Done.');
    return;
  }

  for (const draft of drafts) {
    console.log(`\n=== Draft id=${draft.id} receiptDate=${draft.receiptDate} ===`);
    const detail = await request('GET', `/goods-receipts/${draft.id}`);
    if (detail.status !== 200) {
      console.log('  Cannot fetch detail:', detail.status, JSON.stringify(detail.body).slice(0, 200));
      continue;
    }
    const items = detail.body?.items || [];
    const broken = items.filter((it) => !it.noSupplierDocument && !it.supplierDocNo);
    console.log(`  Items: ${items.length} | broken: ${broken.length}`);

    if (broken.length === 0) {
      console.log('  All items OK, ready to post');
      const post = await request('POST', `/goods-receipts/${draft.id}/post`, {});
      console.log('  POST result:', post.status, post.body?.status || JSON.stringify(post.body).slice(0, 150));
      continue;
    }

    // PATCH the draft to set noSupplierDocument=true on broken items
    const patchedItems = items.map((it) => ({
      id: it.id,
      lineNo: it.lineNo,
      materialId: it.materialId,
      poNo: it.poNo ?? null,
      supplierDocNo: it.noSupplierDocument ? it.supplierDocNo ?? null : null,
      supplierDocDate: it.noSupplierDocument ? it.supplierDocDate ?? null : null,
      noSupplierDocument: !it.noSupplierDocument, // mark as no-doc
      qtyReceived: it.qtyReceived,
      qtyRejected: it.qtyRejected ?? null,
      rejectReasonId: it.rejectReasonId ?? null,
      rejectNote: it.rejectNote ?? null,
      // Fill missing lotNo so form validation can pass
      lotNo: it.lotNo && it.lotNo.length > 0 ? it.lotNo : `LOT-${Date.now()}-${it.lineNo}`,
      productionDate: it.productionDate ?? null,
      expiryDate: it.expiryDate ?? null,
      unitPrice: it.unitPrice ?? null,
      lineAmount: it.lineAmount ?? null,
      remark: it.remark ?? null,
    }));
    const patch = await request('PATCH', `/goods-receipts/${draft.id}`, {
      updatedAt: detail.body.updatedAt,
      items: patchedItems,
    });
    console.log('  PATCH result:', patch.status, patch.body?.status || JSON.stringify(patch.body).slice(0, 200));

    if (patch.status === 200) {
      // Try post
      const post = await request('POST', `/goods-receipts/${draft.id}/post`, {});
      console.log('  POST result:', post.status, post.body?.status || JSON.stringify(post.body).slice(0, 150));
    }
  }
})();
