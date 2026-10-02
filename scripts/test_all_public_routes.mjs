const BASE_URL = 'http://127.0.0.1:3000';

async function testRoutes() {
  console.log('--- KIỂM TRA TOÀN BỘ CÁC TRANG & ROUTE CÔNG KHAI ---');

  // 1. Static and Dynamic Pages
  const pages = [
    '/',
    '/san-pham',
    '/combo',
    '/gio-hang',
    '/thanh-toan',
    '/dang-nhap',
    '/dang-ky',
    '/tai-khoan',
    '/test-email',
    '/admin',
    '/admin/login',
    '/admin/register',
  ];

  // 2. Real Product Slugs
  const productSlugs = [
    'sam-la-han-hoa-cuc-thai-son',
    'matcha-tra-sua-ciao',
    'nha-dam-mu-trom-thai-son',
    'sua-bap-nep-thai-son',
    'sua-gao-lut-mekong-xanh',
    'sua-hat-sen-mekong-xanh',
    'sua-gao-lut-ohsawa-yoo',
    'sua-hat-sen-lotus-yoo',
    'tao-do-hat-chia-thai-son',
    'tra-sua-ciao',
    'tra-sua-go',
    'tra-xanh-go'
  ];

  // 3. Real Combo Slugs
  const comboSlugs = [
    'combo-4',
    'combo-5',
    'combo-6',
    'combo-7',
    'combo-8',
    'combo-9',
    'combo-10',
    'combo-11',
    'combo-12',
    'combo-sieu-hoi',
    'combo-uu-dai',
    'combo-van-phong'
  ];

  // 4. Public API endpoints
  const apis = [
    { url: '/api/banners', method: 'GET' },
    { url: '/api/brand-slides', method: 'GET' },
    { url: '/api/stores', method: 'GET' },
    { url: '/api/geo/autocomplete?input=Cong+Hoa', method: 'GET' },
    { url: '/api/geo/geocode?address=123+Cong+Hoa+Tan+Binh', method: 'GET' },
    { 
      url: '/api/inventory/check', 
      method: 'POST', 
      body: JSON.stringify({ 
        storeCode: 'NH', 
        items: [{ productId: 'prod-sbn-01', quantity: 2 }] 
      }) 
    }
  ];

  const allUrls = [
    ...pages.map(p => ({ url: p, method: 'GET' })),
    ...productSlugs.map(s => ({ url: `/san-pham/${s}`, method: 'GET' })),
    ...comboSlugs.map(s => ({ url: `/combo/${s}`, method: 'GET' })),
    ...apis
  ];

  let passed = 0;
  let failed = 0;
  const issues = [];

  for (const item of allUrls) {
    try {
      const opts = { 
        method: item.method,
        headers: item.body ? { 'Content-Type': 'application/json' } : {}
      };
      if (item.body) opts.body = item.body;

      const res = await fetch(`${BASE_URL}${item.url}`, opts);
      const text = await res.text();

      // Check if page returned 500 or contains server error text
      const hasErrorSnippet = text.includes('Server Error') || 
                              text.includes('Internal Server Error') ||
                              text.includes('column') && text.includes('does not exist') ||
                              text.includes('syntax error at or near');

      if (res.status >= 200 && res.status < 400 && !hasErrorSnippet) {
        console.log(`✅ [${res.status}] ${item.url}`);
        passed++;
      } else {
        console.error(`❌ [${res.status}] ${item.url}`);
        failed++;
        issues.push({ url: item.url, status: res.status, preview: text.slice(0, 200) });
      }
    } catch (err) {
      console.error(`❌ [ERR] ${item.url}: ${err.message}`);
      failed++;
      issues.push({ url: item.url, error: err.message });
    }
  }

  console.log(`\n========================================`);
  console.log(`TỔNG KẾT: ${passed} PASS, ${failed} FAIL`);
  if (issues.length > 0) {
    console.error('Danh sách issues:', JSON.stringify(issues, null, 2));
    process.exit(1);
  } else {
    console.log('TẤT CẢ CÁC TRANG VÀ API ĐỀU HOẠT ĐỘNG HOÀN HẢO!');
  }
}

testRoutes();
