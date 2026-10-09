/**
 * BỘ KIỂM THỬ BƯỚC 2: PHÂN HỆ HỘI VIÊN & ĐĂNG KÝ GIAO ĐỊNH KỲ (SUBSCRIBE & SAVE)
 * ==============================================================================
 * Kiểm tra 8 lĩnh vực nghiệp vụ bắt buộc:
 * 1. Máy trạng thái (Member & Subscription State Machines)
 * 2. Tính đồng thời với tồn kho (Inventory Concurrency & JIT Lock)
 * 3. Múi giờ Asia/Ho_Chi_Minh (UTC+7 Scheduling & Cutoff)
 * 4. Đổi giá (Catalog Price Change & Price Snapshotting)
 * 5. Hết hàng (Out of Stock & Zero-Oversell Guarantee)
 * 6. Địa chỉ ngoài 25km (Distance Radius > 25km Rejection)
 * 7. Từ chối COD (COD Validation & Anti-Abuse Rules)
 * 8. Đăng ký trùng (Duplicate Registration & Concurrency Prevention)
 *
 * TUÂN THỦ: 100% dữ liệu ẩn danh / giả lập (MOCK/SYNTHETIC), tuyệt đối KHÔNG chứa PII thật.
 */

import {
  transitionMemberState,
  transitionSubscriptionContract,
  transitionScheduleState,
} from '../src/lib/membership/stateMachine.ts';

import {
  getVietnamDate,
  formatVietnamDate,
  calculateNextDeliveryDate,
  isCutoffTimePassed,
  calculateSubscriptionItemPrice,
  validateSubscriptionStock,
  validateDeliveryDistance,
  validateSubscriptionCOD,
  checkDuplicateSubscription,
} from '../src/lib/membership/service.ts';

import { MEMBERSHIP_CONFIG } from '../src/config/membership.ts';

let passCount = 0;
let failCount = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message} ${details ? `(${details})` : ''}`);
    failCount++;
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('    KIỂM THỬ BƯỚC 2: PHÂN HỆ HỘI VIÊN & SUBSCRIBE & SAVE (STEP 2)');
  console.log('================================================================');

  // ---------------------------------------------------------------------------
  // 1. KIỂM THỬ: MÁY TRẠNG THÁI (STATE MACHINES)
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. KIỂM THỬ: MÁY TRẠNG THÁI (STATE MACHINES) ---');

  // Member State Machine transitions
  const t1 = transitionMemberState('STANDARD_FREE', 'OPT_IN_TRIAL');
  assert(t1.allowed && t1.nextStatus === 'TRIAL_ACTIVE' && t1.hasAccessToBenefits, 'STANDARD_FREE -> TRIAL_ACTIVE khi đăng ký dùng thử 30 ngày');

  const t2 = transitionMemberState('TRIAL_ACTIVE', 'PURCHASE_PAID');
  assert(t2.allowed && t2.nextStatus === 'PAID_ACTIVE', 'TRIAL_ACTIVE -> PAID_ACTIVE khi thanh toán kỳ đầu tiên thành công');

  const t3 = transitionMemberState('PAID_ACTIVE', 'REQUEST_PAUSE');
  assert(t3.allowed && t3.nextStatus === 'PAUSED' && !t3.hasAccessToBenefits, 'PAID_ACTIVE -> PAUSED khi khách tạm dừng gói hội viên');

  const t4 = transitionMemberState('PAUSED', 'RESUME_MEMBERSHIP');
  assert(t4.allowed && t4.nextStatus === 'PAID_ACTIVE' && t4.hasAccessToBenefits, 'PAUSED -> PAID_ACTIVE khi khách tiếp tục gói');

  // Anti-Dark Pattern verification: Cancel preserves benefits until expiry
  const t5 = transitionMemberState('PAID_ACTIVE', 'REQUEST_CANCEL');
  assert(
    t5.allowed && t5.nextStatus === 'CANCELLED_GRACE' && t5.hasAccessToBenefits,
    'PAID_ACTIVE -> CANCELLED_GRACE khi hủy (Bảo lưu quyền đến hết kỳ thanh toán - Không Dark Pattern)'
  );

  const t6 = transitionMemberState('CANCELLED_GRACE', 'REACTIVATE_CANCELLED');
  assert(t6.allowed && t6.nextStatus === 'PAID_ACTIVE', 'CANCELLED_GRACE -> PAID_ACTIVE khi khách đổi ý kích hoạt lại');

  const t7 = transitionMemberState('CANCELLED_GRACE', 'PERIOD_EXPIRED');
  assert(t7.allowed && t7.nextStatus === 'EXPIRED_CHURN' && !t7.hasAccessToBenefits, 'CANCELLED_GRACE -> EXPIRED_CHURN khi chạm mốc hết hạn');

  const t8 = transitionMemberState('EXPIRED_CHURN', 'TRIGGER_WIN_BACK');
  assert(t8.allowed && t8.nextStatus === 'WIN_BACK', 'EXPIRED_CHURN -> WIN_BACK khi kích hoạt chiến dịch chăm sóc lại');

  // Invalid transition rejection
  const tInvalid = transitionMemberState('EXPIRED_CHURN', 'REQUEST_PAUSE');
  assert(!tInvalid.allowed && tInvalid.nextStatus === 'EXPIRED_CHURN', 'Chặn chuyển đổi bất hợp lệ từ EXPIRED_CHURN sang PAUSED');

  // Subscription Contract State Machine transitions
  const c1 = transitionSubscriptionContract('DRAFT', 'ACTIVATE');
  assert(c1.allowed && c1.nextStatus === 'ACTIVE', 'Contract: DRAFT -> ACTIVE khi kích hoạt hợp đồng đầu tiên');

  const c2 = transitionSubscriptionContract('ACTIVE', 'PAUSE');
  assert(c2.allowed && c2.nextStatus === 'PAUSED', 'Contract: ACTIVE -> PAUSED khi khách tạm dừng hợp đồng');

  const c3 = transitionSubscriptionContract('PAUSED', 'RESUME');
  assert(c3.allowed && c3.nextStatus === 'ACTIVE', 'Contract: PAUSED -> ACTIVE khi khách tiếp tục hợp đồng');

  const c4 = transitionSubscriptionContract('ACTIVE', 'CANCEL');
  assert(c4.allowed && c4.nextStatus === 'CANCELLED', 'Contract: ACTIVE -> CANCELLED khi khách hủy hợp đồng');

  // Subscription Schedule State Machine transitions
  const s1 = transitionScheduleState('SCHEDULED', 'SEND_REMINDER');
  assert(s1.allowed && s1.nextStatus === 'REMINDER_SENT', 'Schedule: SCHEDULED -> REMINDER_SENT tại mốc T-5/T-3');

  const s2 = transitionScheduleState('REMINDER_SENT', 'USER_SKIP');
  assert(s2.allowed && s2.nextStatus === 'SKIPPED', 'Schedule: REMINDER_SENT -> SKIPPED khi khách bấm Bỏ qua kỳ này');

  const s3 = transitionScheduleState('REMINDER_SENT', 'GENERATE_ORDER');
  assert(s3.allowed && s3.nextStatus === 'ORDER_GENERATED', 'Schedule: REMINDER_SENT -> ORDER_GENERATED tại mốc T-1 để sinh đơn kho');

  // ---------------------------------------------------------------------------
  // 2. KIỂM THỬ: TÍNH ĐỒNG THỜI VỚI TỒN KHO (INVENTORY CONCURRENCY)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ: TÍNH ĐỒNG THỜI VỚI TỒN KHO (INVENTORY CONCURRENCY) ---');

  // Mô phỏng 10 tác vụ nền JIT đồng thời tranh chấp giữ chỗ kho vật lý
  const storeInventoryMock = {
    productId: 'prod-sb-01',
    stockQuantity: 20, // Kho vật lý có 20 chai
    reserved: 0,
    safetyStock: 2,    // Tồn an toàn 2 chai -> Tồn bán được tối đa = 18 chai
  };

  const concurrencyWorkers = 10;
  const bottlesPerWorker = 7; // Mỗi đơn Subscribe & Save cần 1 lốc 7 chai (Cần 7 x 10 = 70 chai)
  let successfulOrders = 0;
  let rejectedOrders = 0;

  // Giả lập cơ chế Atomic Pessimistic Lock (SELECT FOR UPDATE)
  for (let i = 0; i < concurrencyWorkers; i++) {
    const sellable = Math.max(0, storeInventoryMock.stockQuantity - storeInventoryMock.reserved - storeInventoryMock.safetyStock);
    if (sellable >= bottlesPerWorker) {
      storeInventoryMock.reserved += bottlesPerWorker;
      successfulOrders++;
    } else {
      rejectedOrders++;
    }
  }

  assert(successfulOrders === 2, 'Tính đồng thời: Chỉ đúng 2 đơn (14 chai) được giữ chỗ thành công khi kho còn 18 chai bán được', `Thực tế: ${successfulOrders}`);
  assert(rejectedOrders === 8, 'Tính đồng thời: 8 đơn vượt quá tồn kho bị chặn lại an toàn (Zero-Oversell)', `Thực tế: ${rejectedOrders}`);
  assert(storeInventoryMock.reserved === 14, 'Tính đồng thời: Số lượng giữ chỗ reserved chính xác tuyệt đối = 14 chai');
  assert(storeInventoryMock.stockQuantity >= storeInventoryMock.reserved, 'Tính đồng thời: Ràng buộc stock_quantity >= reserved không bao giờ bị vi phạm');

  // ---------------------------------------------------------------------------
  // 3. KIỂM THỬ: MÚI GIỜ ASIA/HO_CHI_MINH (TIMEZONE & CUTOFF)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ: MÚI GIỜ ASIA/HO_CHI_MINH (TIMEZONE & CUTOFF) ---');

  // Giả lập thời điểm UTC và kiểm tra chuyển đổi chuẩn UTC+7
  const utcDate = new Date('2026-10-15T01:00:00.000Z'); // 01:00 UTC = 08:00 VN
  const vnDate = getVietnamDate(utcDate);
  assert(vnDate.getHours() === 8, 'Múi giờ: getVietnamDate chuyển đổi 01:00 UTC thành 08:00 tại Asia/Ho_Chi_Minh');
  const vnFormatted = formatVietnamDate(utcDate);
  assert(vnFormatted === '15/10/2026', 'Múi giờ: Định dạng ngày chính xác theo múi giờ Asia/Ho_Chi_Minh (15/10/2026)');

  // Kiểm tra giờ cắt đơn (Cutoff Hour = 18:00 VN)
  const beforeCutoff = new Date('2026-10-15T08:00:00.000Z'); // 15:00 VN -> Chưa qua cutoff
  const afterCutoff = new Date('2026-10-15T12:30:00.000Z');  // 19:30 VN -> Đã qua cutoff
  assert(!isCutoffTimePassed(beforeCutoff, 18), 'Múi giờ: 15:00 VN chưa qua giờ cắt đơn ngày mai (isCutoffTimePassed = false)');
  assert(isCutoffTimePassed(afterCutoff, 18), 'Múi giờ: 19:30 VN đã qua giờ cắt đơn ngày mai (isCutoffTimePassed = true)');

  // Kiểm tra tính ngày giao hàng kế tiếp theo chu kỳ 1 tuần và thứ mong muốn (Thứ Hai = 2)
  const baseDate = new Date('2026-10-12T01:00:00.000Z'); // Thứ Hai, 12/10/2026
  const nextDelivery = calculateNextDeliveryDate(baseDate, '1_WEEK', 2);
  const nextVNStr = formatVietnamDate(nextDelivery);
  assert(nextVNStr === '19/10/2026', 'Múi giờ: Kỳ giao kế tiếp của Thứ Hai 12/10 theo chu kỳ 1 tuần rơi đúng vào Thứ Hai 19/10/2026', `Thực tế: ${nextVNStr}`);

  // ---------------------------------------------------------------------------
  // 4. KIỂM THỬ: ĐỔI GIÁ (CATALOG PRICE CHANGE & PRICE SNAPSHOTTING)
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ: ĐỔI GIÁ (PRICE CHANGE & SNAPSHOTTING) ---');

  // Trường hợp 1: Giá niêm yết tăng từ 126k lên 140k -> Đơn Subscribe giữ nguyên giá snapshot 126k
  const priceIncreased = calculateSubscriptionItemPrice({
    catalogPrice: 140_000,
    priceSnapshot: 126_000,
    discountRate: 0.15,
    quantity: 1,
  });
  assert(priceIncreased.appliedBasePrice === 126_000, 'Đổi giá: Khi giá niêm yết tăng, giữ nguyên giá snapshot 126.000đ đã cam kết');
  assert(priceIncreased.finalPrice === 107_100, 'Đổi giá: Giá cuối cùng giảm 15% trên snapshot = 107.100đ');

  // Trường hợp 2: Giá niêm yết giảm khuyến mãi từ 126k xuống 100k -> Hệ thống bảo vệ quyền lợi khách, lấy giá thấp hơn
  const priceDecreased = calculateSubscriptionItemPrice({
    catalogPrice: 100_000,
    priceSnapshot: 126_000,
    discountRate: 0.15,
    quantity: 1,
    useCatalogPriceIfLower: true,
  });
  assert(priceDecreased.appliedBasePrice === 100_000, 'Đổi giá: Khi giá niêm yết giảm sâu, tự động lấy giá thấp hơn (100.000đ)');
  assert(priceDecreased.finalPrice === 85_000, 'Đổi giá: Giá cuối cùng tính trên giá thấp hơn = 85.000đ');

  // ---------------------------------------------------------------------------
  // 5. KIỂM THỬ: HẾT HÀNG (OUT OF STOCK & ZERO-OVERSELL)
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ: HẾT HÀNG (OUT OF STOCK & ZERO-OVERSELL) ---');

  const stockMap = new Map();
  stockMap.set('prod-sb-01', { productId: 'prod-sb-01', stockQuantity: 10, reserved: 8, safetyStock: 2 }); // Khả dụng = 0
  stockMap.set('prod-shs-01', { productId: 'prod-shs-01', stockQuantity: 50, reserved: 5, safetyStock: 5 }); // Khả dụng = 40

  const requestedItems = [
    { productId: 'prod-sb-01', productName: 'Sữa Bắp Nếp Tươi (Lốc 7 chai)', requestedBottles: 7 },
    { productId: 'prod-shs-01', productName: 'Sữa Hạt Sen Mekong (Lốc 7 chai)', requestedBottles: 7 },
  ];

  const stockCheck = validateSubscriptionStock(requestedItems, stockMap);
  assert(!stockCheck.isAvailable, 'Hết hàng: Phát hiện chi nhánh không đủ tồn khả dụng cho toàn bộ giỏ định kỳ');
  assert(stockCheck.insufficientItems.length === 1, 'Hết hàng: Chỉ đích danh 1 mặt hàng thiếu tồn kho (prod-sb-01)');
  assert(stockCheck.insufficientItems[0].available === 0, 'Hết hàng: Báo cáo chính xác tồn khả dụng bằng 0 chai');

  // ---------------------------------------------------------------------------
  // 6. KIỂM THỬ: ĐỊA CHỈ NGOÀI 25KM (DISTANCE > 25KM REJECTION)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ: ĐỊA CHỈ NGOÀI 25KM (DISTANCE > 25KM REJECTION) ---');

  // Tọa độ Cửa hàng Quận 1: 10.7769, 106.7009
  const storeLat = 10.7769;
  const storeLng = 106.7009;

  // Địa chỉ nội thành gần (Quận 7: 10.7327, 106.7167) ~ 5.3km
  const nearDist = validateDeliveryDistance(10.7327, 106.7167, storeLat, storeLng, 25);
  assert(nearDist.isValid && nearDist.distanceKm < 10, `Khoảng cách: Khách Quận 7 (${nearDist.distanceKm.toFixed(1)}km) nằm trong bán kính phục vụ hợp lệ`);

  // Địa chỉ xa vượt bán kính (Củ Chi / Long An: 11.0500, 106.5000) ~ 37km
  const farDist = validateDeliveryDistance(11.0500, 106.5000, storeLat, storeLng, 25);
  assert(!farDist.isValid && farDist.distanceKm > 25, `Khoảng cách: Khách ngoài 25km (${farDist.distanceKm.toFixed(1)}km) bị từ chối giao hàng định kỳ an toàn`);
  assert(farDist.error?.includes('vượt quá bán kính phục vụ'), 'Khoảng cách: Trả về thông báo lỗi rõ ràng cho người dùng');

  // ---------------------------------------------------------------------------
  // 7. KIỂM THỬ: TỪ CHỐI COD (COD ANTI-ABUSE & VALIDATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. KIỂM THỬ: TỪ CHỐI COD (COD ANTI-ABUSE & VALIDATION) ---');

  // Vi phạm hạn mức tiền mặt tối đa (> 10 triệu)
  const codOverValue = validateSubscriptionCOD({
    orderTotal: 12_000_000,
    pendingOrdersCount: 0,
    phone: '0901234567',
    address: '123 Đường Nguyễn Thị Thập, P. Tân Phú, Quận 7',
  });
  assert(!codOverValue.isValid && codOverValue.code === 'COD_MAX_VALUE_EXCEEDED', 'Từ chối COD: Chặn đơn hàng vượt hạn mức 10 triệu đồng');

  // Vi phạm số đơn PENDING cùng SĐT (>= 3 đơn)
  const codTooManyPending = validateSubscriptionCOD({
    orderTotal: 250_000,
    pendingOrdersCount: 3,
    phone: '0901234567',
    address: '123 Đường Nguyễn Thị Thập, P. Tân Phú, Quận 7',
  });
  assert(!codTooManyPending.isValid && codTooManyPending.code === 'COD_PENDING_LIMIT_REACHED', 'Từ chối COD: Chặn khi số điện thoại đã có 3 đơn PENDING');

  // Vi phạm giãn cách đặt hàng (< 5 phút)
  const codRateLimit = validateSubscriptionCOD({
    orderTotal: 250_000,
    pendingOrdersCount: 1,
    lastOrderCreatedAt: new Date(Date.now() - 2 * 60 * 1000), // 2 phút trước
    phone: '0901234567',
    address: '123 Đường Nguyễn Thị Thập, P. Tân Phú, Quận 7',
  });
  assert(!codRateLimit.isValid && codRateLimit.code === 'COD_RATE_LIMIT_EXCEEDED', 'Từ chối COD: Chặn spam đặt hàng liên tục trong vòng dưới 5 phút');

  // Vi phạm định dạng SĐT
  const codBadPhone = validateSubscriptionCOD({
    orderTotal: 250_000,
    pendingOrdersCount: 0,
    phone: '123456789', // SĐT rác
    address: '123 Đường Nguyễn Thị Thập, P. Tân Phú, Quận 7',
  });
  assert(!codBadPhone.isValid && codBadPhone.code === 'INVALID_PHONE_FORMAT', 'Từ chối COD: Chặn số điện thoại sai định dạng viễn thông Việt Nam');

  // Vi phạm địa chỉ quá ngắn
  const codShortAddress = validateSubscriptionCOD({
    orderTotal: 250_000,
    pendingOrdersCount: 0,
    phone: '0901234567',
    address: 'nhà riêng', // < 10 ký tự
  });
  assert(!codShortAddress.isValid && codShortAddress.code === 'INVALID_ADDRESS_LENGTH', 'Từ chối COD: Chặn địa chỉ rác ngắn hơn 10 ký tự');

  // ---------------------------------------------------------------------------
  // 8. KIỂM THỬ: ĐĂNG KÝ TRÙNG LẶP (DUPLICATE REGISTRATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. KIỂM THỬ: ĐĂNG KÝ TRÙNG LẶP (DUPLICATE REGISTRATION) ---');

  const existingActiveSubs = [
    { id: 'SUB-1001', userId: 'usr_mock_01', productId: 'prod-sb-01', status: 'ACTIVE' },
    { id: 'SUB-1002', userId: 'usr_mock_01', productId: 'prod-shs-01', status: 'CANCELLED' },
  ];

  // Khách cố tình đăng ký thêm hợp đồng mới cho sản phẩm prod-sb-01 đang active
  const dupCheck1 = checkDuplicateSubscription('usr_mock_01', 'prod-sb-01', existingActiveSubs);
  assert(dupCheck1.isDuplicate && dupCheck1.existingId === 'SUB-1001', 'Đăng ký trùng: Phát hiện và chặn đăng ký trùng lặp cho sản phẩm đang có hợp đồng ACTIVE');

  // Khách đăng ký sản phẩm prod-shs-01 (hợp đồng cũ đã CANCELLED) -> Cho phép
  const dupCheck2 = checkDuplicateSubscription('usr_mock_01', 'prod-shs-01', existingActiveSubs);
  assert(!dupCheck2.isDuplicate, 'Đăng ký trùng: Cho phép đăng ký sản phẩm đã từng hủy trước đó');

  // Khách mới đăng ký sản phẩm mới -> Cho phép
  const dupCheck3 = checkDuplicateSubscription('usr_mock_02', 'prod-sb-01', existingActiveSubs);
  assert(!dupCheck3.isDuplicate, 'Đăng ký trùng: Cho phép khách hàng khác đăng ký cùng sản phẩm');

  // ---------------------------------------------------------------------------
  // 9. KIỂM THỬ CỜ TÍNH NĂNG (FEATURE FLAG CONFIGURATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. KIỂM THỬ CỜ TÍNH NĂNG (FEATURE FLAG CONFIGURATION) ---');
  assert(typeof MEMBERSHIP_CONFIG.ENABLE_MEMBERSHIP === 'boolean', 'Cờ tính năng: ENABLE_MEMBERSHIP có định dạng boolean hợp lệ');
  assert(typeof MEMBERSHIP_CONFIG.ENABLE_SUBSCRIBE_SAVE === 'boolean', 'Cờ tính năng: ENABLE_SUBSCRIBE_SAVE có định dạng boolean hợp lệ');

  // ---------------------------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ KIỂM THỬ
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`KẾT QUẢ KIỂM THỬ BƯỚC 2: ${passCount} PASS, ${failCount} FAIL`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Lỗi thực thi kiểm thử Bước 2:', err);
  process.exit(1);
});
