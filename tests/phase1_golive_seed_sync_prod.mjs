/**
 * tests/phase1_golive_seed_sync_prod.mjs
 * 
 * BỘ KIỂM THỬ TỰ ĐỘNG GOLIVE PHASE 1:
 * 1. Chứng minh các endpoint /api/admin/seed và /api/admin/sync trả về HTTP 403 Forbidden khi NODE_ENV=production.
 * 2. Chứng minh các endpoint trả về lỗi fail-closed trước khi kiểm tra auth/session.
 * 3. Kiểm tra hồi quy mã nguồn UI: toàn bộ nút/thẻ nạp đơn mẫu và đồng bộ đã được gỡ sạch khỏi giao diện.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let passedCount = 0;
let failedCount = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName} ${details ? `(${details})` : ''}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function runPhase1Suite() {
  console.log('================================================================');
  console.log('         KIỂM THỬ GOLIVE PHASE 1: BẢO MẬT PRODUCTION & DỌN DẸP UI');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // NHÓM 1: Kiểm thử Endpoint khi NODE_ENV=production (Fail-closed HTTP 403)
  // ---------------------------------------------------------------------------
  console.log('--- NHÓM 1: Kiểm thử API Endpoints khi NODE_ENV=production ---');
  
  // Thiết lập biến môi trường production
  process.env.NODE_ENV = 'production';

  // Import động các route handlers
  const seedRoute = await import('../src/app/api/admin/seed/route.ts');
  const syncRoute = await import('../src/app/api/admin/sync/route.ts');

  // Test 1: POST /api/admin/seed trên production -> 403 FORBIDDEN
  {
    const res = await seedRoute.POST();
    const data = await res.json();
    assert(
      res.status === 403 && data.success === false && data.code === 'FORBIDDEN',
      'POST /api/admin/seed trả về HTTP 403 Forbidden trên Production',
      `HTTP ${res.status}, code: ${data.code}, error: "${data.error}"`
    );
  }

  // Test 2: GET /api/admin/seed trên production -> 403 FORBIDDEN
  {
    const res = await seedRoute.GET();
    const data = await res.json();
    assert(
      res.status === 403 && data.success === false && data.code === 'FORBIDDEN',
      'GET /api/admin/seed trả về HTTP 403 Forbidden trên Production',
      `HTTP ${res.status}, code: ${data.code}, error: "${data.error}"`
    );
  }

  // Test 3: POST /api/admin/sync trên production -> 403 FORBIDDEN
  {
    const res = await syncRoute.POST();
    const data = await res.json();
    assert(
      res.status === 403 && data.success === false && data.code === 'FORBIDDEN',
      'POST /api/admin/sync trả về HTTP 403 Forbidden trên Production',
      `HTTP ${res.status}, code: ${data.code}, error: "${data.error}"`
    );
  }

  // Test 4: GET /api/admin/sync trên production -> 403 FORBIDDEN
  {
    const res = await syncRoute.GET();
    const data = await res.json();
    assert(
      res.status === 403 && data.success === false && data.code === 'FORBIDDEN',
      'GET /api/admin/sync trả về HTTP 403 Forbidden trên Production',
      `HTTP ${res.status}, code: ${data.code}, error: "${data.error}"`
    );
  }

  // ---------------------------------------------------------------------------
  // NHÓM 2: Kiểm thử tính cô lập - Non-production không bị chặn bởi production check
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 2: Kiểm thử cơ chế môi trường độc lập (Development vs Production) ---');
  {
    process.env.NODE_ENV = 'development';
    const origConsoleError = console.error;
    console.error = () => {}; // Mute Next.js cookies outside request scope warning in unit test runner
    let nonProdRes, nonProdData, nonProdSyncRes, nonProdSyncData;
    try {
      nonProdRes = await seedRoute.POST();
      nonProdData = await nonProdRes.json();
      nonProdSyncRes = await syncRoute.POST();
      nonProdSyncData = await nonProdSyncRes.json();
    } finally {
      console.error = origConsoleError;
    }

    assert(
      nonProdRes.status === 401 && nonProdData.code === 'FORBIDDEN',
      'Khi NODE_ENV=development, API seed vượt qua production guard và chuyển sang xác thực session (401 Unauthorized)',
      `HTTP ${nonProdRes.status}, error: "${nonProdData.error}"`
    );

    assert(
      nonProdSyncRes.status === 401 && nonProdSyncData.code === 'FORBIDDEN',
      'Khi NODE_ENV=development, API sync vượt qua production guard và chuyển sang xác thực session (401 Unauthorized)',
      `HTTP ${nonProdSyncRes.status}, error: "${nonProdSyncData.error}"`
    );
  }

  // Khôi phục lại NODE_ENV
  process.env.NODE_ENV = 'production';

  // ---------------------------------------------------------------------------
  // NHÓM 3: Kiểm toán mã nguồn UI - Đảm bảo toàn bộ dev buttons/cards đã gỡ bỏ
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 3: Kiểm toán mã nguồn giao diện Admin (src/app/admin/page.tsx) ---');
  const adminPagePath = path.join(__dirname, '..', 'src', 'app', 'admin', 'page.tsx');
  const adminPageContent = fs.readFileSync(adminPagePath, 'utf8');

  // Test 5: Không còn nút/hàm handleSyncStore trong UI
  assert(
    !adminPageContent.includes('handleSyncStore'),
    'Giao diện Admin không còn chứa hàm/tham chiếu handleSyncStore'
  );

  // Test 6: Không còn nút/hàm handleSeedDemoOrders trong UI
  assert(
    !adminPageContent.includes('handleSeedDemoOrders'),
    'Giao diện Admin không còn chứa hàm/tham chiếu handleSeedDemoOrders'
  );

  // Test 7: Không còn biến state syncLoading
  assert(
    !adminPageContent.includes('syncLoading'),
    'Giao diện Admin không còn chứa biến state syncLoading'
  );

  // Test 8: Không còn văn bản nút "Nạp Đơn Mẫu"
  assert(
    !adminPageContent.includes('Nạp Đơn Mẫu') && !adminPageContent.includes('Nạp Thêm Đơn Hàng Mẫu'),
    'Giao diện Admin không còn chứa bất kỳ nút bấm "Nạp Đơn Mẫu" hay "Nạp Thêm Đơn Hàng Mẫu"'
  );

  // Test 9: Không còn thẻ "Đồng Bộ Dữ Liệu Store Website Vào CSDL WebTSF"
  assert(
    !adminPageContent.includes('Đồng Bộ Dữ Liệu Store Website Vào CSDL WebTSF') &&
    !adminPageContent.includes('Đồng bộ Store -> DB'),
    'Giao diện Admin không còn chứa thẻ hoặc nút "Đồng bộ Store -> DB"'
  );

  console.log('\n================================================================');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passedCount} PASS, ${failedCount} FAIL`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase1Suite().catch((err) => {
  console.error('Lỗi ngoại lệ trong quá trình chạy test suite:', err);
  process.exit(1);
});
