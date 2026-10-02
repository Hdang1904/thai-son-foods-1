import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tsf_super_secret_jwt_key_2026_thai_son_foods'
);
const BASE_URL = 'http://127.0.0.1:3000';

async function makeAdminCookie(payload) {
  const token = await new SignJWT({ ...payload, userId: payload.id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return `tsf_admin_token=${token}`;
}

async function run() {
  console.log('--- KIỂM TRA TOÀN BỘ CÁC ROUTE ADMIN APIS ---');
  const cookie = await makeAdminCookie({
    id: 'admin_1790137884783_kr9lt',
    username: 'admin',
    email: 'admin@gmail.com',
    role: 'SUPER_ADMIN'
  });

  const headers = {
    'Cookie': cookie,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    '/api/admin/orders',
    '/api/admin/products',
    '/api/admin/combos',
    '/api/admin/inventory',
    '/api/admin/inventory/logs',
    '/api/admin/stores',
    '/api/admin/banners',
    '/api/admin/brand-slides',
    '/api/admin/categories',
    '/api/admin/stats',
    '/api/admin/audit',
    '/api/admin/users',
    '/api/admin/members',
    '/api/admin/reports/profit',
    '/api/admin/auth/me',
    '/api/admin/products/prod-ss-01/images',
    '/api/admin/combos/combo-4/images'
  ];

  let passed = 0;
  let failed = 0;
  const failedList = [];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep}`, { headers });
      const text = await res.text();
      let isSuccess = res.status >= 200 && res.status < 300;
      let hasDbError = text.includes('error') && (text.includes('column') || text.includes('syntax') || text.includes('relation'));

      if (isSuccess && !hasDbError) {
        console.log(`✅ [${res.status}] ${ep}`);
        passed++;
      } else {
        console.error(`❌ [${res.status}] ${ep} -> ${text.slice(0, 200)}`);
        failed++;
        failedList.push({ ep, status: res.status, snippet: text.slice(0, 200) });
      }
    } catch (e) {
      console.error(`❌ [ERR] ${ep} -> ${e.message}`);
      failed++;
      failedList.push({ ep, error: e.message });
    }
  }

  console.log(`\n========================================`);
  console.log(`KẾT QUẢ ADMIN APIS: ${passed} PASS, ${failed} FAIL`);
  if (failedList.length > 0) {
    console.error('Chi tiết lỗi:', JSON.stringify(failedList, null, 2));
  }
}

run();
