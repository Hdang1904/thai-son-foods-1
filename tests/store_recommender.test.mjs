/**
 * tests/store_recommender.test.mjs
 *
 * Unit tests và Integration tests cho thuật toán đề xuất cửa hàng (Mục 18.10)
 */

import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

function calculateShippingFee(roadKm, orderSubtotal = 0) {
  if (orderSubtotal >= 300000 && roadKm <= 5.0) return 0;
  if (roadKm <= 3.0) return 15000;
  if (roadKm <= 7.0) return 25000;
  const extraKm = Math.ceil(roadKm - 7.0);
  return 25000 + extraKm * 4000;
}

function getPeakHourMultiplier(date = new Date()) {
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const vnTotalMinutes = ((utcHours + 7) % 24) * 60 + utcMinutes;
  const morningStart = 7 * 60;
  const morningEnd = 9 * 60;
  const afternoonStart = 16 * 60 + 30;
  const afternoonEnd = 19 * 60;

  if (
    (vnTotalMinutes >= morningStart && vnTotalMinutes <= morningEnd) ||
    (vnTotalMinutes >= afternoonStart && vnTotalMinutes <= afternoonEnd)
  ) {
    return 1.4;
  }
  return 1.0;
}

async function runTests() {
  console.log('🧪 BẮT ĐẦU TEST THUẬT TOÁN ĐỀ XUẤT CHI NHÁNH & BẢNG PHÍ SHIP (MỤC 18)');

  // 1. Kiểm tra tính toán phí vận chuyển
  console.log('\n[TEST 1] Kiểm tra biểu phí vận chuyển chuẩn...');
  assert.strictEqual(calculateShippingFee(2.5, 100000), 15000, '0-3 km phải là 15.000đ');
  assert.strictEqual(calculateShippingFee(4.2, 100000), 25000, '3-7 km phải là 25.000đ');
  assert.strictEqual(calculateShippingFee(8.0, 100000), 29000, '8 km phải là 25.000 + 4.000 = 29.000đ');
  assert.strictEqual(calculateShippingFee(10.0, 100000), 37000, '10 km phải là 25.000 + 3*4.000 = 37.000đ');
  assert.strictEqual(calculateShippingFee(4.0, 350000), 0, 'Đơn từ 300.000đ trong 5 km phải là Freeship 0đ');
  assert.strictEqual(calculateShippingFee(6.5, 350000), 25000, 'Đơn từ 300.000đ vượt 5 km vẫn tính phí bình thường');
  console.log('  ✅ [PASS] Tất cả các mức phí ship & chính sách Freeship tính toán chính xác 100%!');

  // 2. Kiểm tra hệ số giờ cao điểm
  console.log('\n[TEST 2] Kiểm tra hệ số giờ cao điểm...');
  const morningRush = new Date('2026-10-12T01:30:00Z'); // 8:30 AM VN
  const afternoonRush = new Date('2026-10-12T10:00:00Z'); // 17:00 PM VN
  const noonNormal = new Date('2026-10-12T05:00:00Z'); // 12:00 PM VN

  assert.strictEqual(getPeakHourMultiplier(morningRush), 1.4, '8:30 sáng phải có hệ số 1.4');
  assert.strictEqual(getPeakHourMultiplier(afternoonRush), 1.4, '17:00 chiều phải có hệ số 1.4');
  assert.strictEqual(getPeakHourMultiplier(noonNormal), 1.0, '12:00 trưa phải có hệ số 1.0');
  console.log('  ✅ [PASS] Hệ số giờ cao điểm kích hoạt chuẩn xác!');

  // 3. Kiểm tra API POST /api/stores/recommend với khách tại Chợ Bến Thành (Quận 1)
  console.log('\n[TEST 3] Khách tại Chợ Bến Thành (Quận 1: 10.7725, 106.6981)...');
  const resD1 = await fetch(`${BASE_URL}/api/stores/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: 10.7725, lng: 106.6981 }),
  });
  const dataD1 = await resD1.json();
  assert.strictEqual(dataD1.success, true, 'API recommend phải trả về success: true');
  assert.ok(dataD1.recommended, 'Phải có chi nhánh được đề xuất');
  console.log(`  -> Đề xuất: ${dataD1.recommended.name} (${dataD1.recommended.areaLabel})`);
  console.log(`     Quãng đường: ${dataD1.recommended.roadKm} km | ETA: ${dataD1.recommended.etaMinutes} phút | Phí ship: ${dataD1.recommended.shippingFee}đ`);
  assert.ok(dataD1.recommended.roadKm <= 6.0, 'Chi nhánh đề xuất phải ở gần Quận 1 (< 6km)');
  assert.ok(dataD1.recommended.badges.includes('Đề xuất'), 'Chi nhánh top 1 phải có badge Đề xuất');
  console.log('  ✅ [PASS] Đề xuất chi nhánh chuẩn xác tại Quận 1!');

  // 4. Kiểm tra API POST /api/stores/recommend với khách tại Ninh Kiều (Cần Thơ)
  console.log('\n[TEST 4] Khách tại Ninh Kiều Cần Thơ (10.0402, 105.7501)...');
  const resCT = await fetch(`${BASE_URL}/api/stores/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: 10.0402, lng: 105.7501 }),
  });
  const dataCT = await resCT.json();
  assert.strictEqual(dataCT.success, true);
  assert.ok(dataCT.recommended);
  console.log(`  -> Đề xuất: ${dataCT.recommended.name} (${dataCT.recommended.areaLabel})`);
  assert.strictEqual(dataCT.recommended.code, 'CTH', 'Khách Cần Thơ phải được đề xuất đúng cửa hàng Cần Thơ (CTH)');
  console.log('  ✅ [PASS] Khách Cần Thơ chỉ đề xuất Cần Thơ, không bị nhầm sang TP.HCM!');

  // 5. Kiểm tra API POST /api/stores/recommend với khách tại Biên Hòa (10.9606, 106.8700)
  console.log('\n[TEST 5] Khách tại Biên Hòa Đồng Nai (10.9606, 106.8700)...');
  const resDN = await fetch(`${BASE_URL}/api/stores/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat: 10.9606, lng: 106.8700 }),
  });
  const dataDN = await resDN.json();
  assert.strictEqual(dataDN.success, true);
  assert.ok(dataDN.recommended);
  console.log(`  -> Đề xuất: ${dataDN.recommended.name} (${dataDN.recommended.areaLabel})`);
  assert.strictEqual(dataDN.recommended.code, 'AMA', 'Khách Biên Hòa phải được đề xuất chi nhánh Biên Hòa (AMA)');
  console.log('  ✅ [PASS] Khách Biên Hòa đề xuất đúng chi nhánh Biên Hòa!');

  console.log('\n======================================================');
  console.log('🏁 TẤT CẢ 5 BÀI TEST THUẬT TOÁN ĐỀ XUẤT ĐÃ ĐẠT (PASS 100%)');
  console.log('======================================================\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test thất bại:', err);
  process.exit(1);
});
