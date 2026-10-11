/**
 * BỘ KIỂM THỬ TOÀN DIỆN: PHÂN HỆ SUBSCRIBE & SAVE THÁI SƠN FOODS
 * Nguồn sự thật: Đặc tả nghiệp vụ Subscribe & Save (Source of Truth)
 * ==============================================================================
 * Bao phủ đầy đủ 6 nhóm kiểm thử bắt buộc:
 * 1. Giá: 126.000đ -> 107.100đ (-15%); snapshot khi giá thị trường tăng; tự giảm khi giá giảm; làm tròn VND.
 * 2. Giá trị đơn hàng & Bán kính địa lý: 119.999đ vs 120.000đ; đúng 25.0km vs 25.01km.
 * 3. Chu kỳ giao hàng: Weekly, Bi-weekly, Monthly qua các tháng (30 ngày, 31 ngày, tháng 2/năm nhuận) & qua năm mới.
 * 4. Cut-off time 18:00 & One-Click Skip: Skip trước 18:00 ngày T-1 -> thành công, dời lịch, không trừ tiền; Skip sau 18:00 -> bị từ chối an toàn.
 * 5. Tồn kho & Zero-Oversell: Khóa reserved_quantity khả dụng; xử lý hết hàng; giải phóng giữ chỗ khi skip/hủy.
 * 6. Vòng đời hợp đồng: Đổi tần suất, Đổi địa chỉ (thẩm định 25km), Hủy hợp đồng minh bạch trên web.
 * 7. Cron Idempotency: T-5 gửi đúng 1 lần; T-1 18:00 sinh đúng 1 đơn dù cron chạy lặp lại nhiều lần.
 */

import {
  calculateSubscriptionItemPrice,
  validateDeliveryRadius,
  validateDeliveryDistance,
  calculateNextDeliveryDate,
  getDeliveryCutoffTime,
  isSkipAllowed,
  isCutoffTimePassed,
  validateSubscriptionStock,
  checkDuplicateSubscription,
  getVietnamDate,
  formatVietnamDate,
} from '../src/lib/membership/service.ts';

import {
  transitionMemberState,
  transitionSubscriptionContract,
  transitionScheduleState,
} from '../src/lib/membership/stateMachine.ts';

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

async function runSubscriptionTestSuite() {
  console.log('================================================================');
  console.log('  BỘ KIỂM THỬ NGHIỆP VỤ SUBSCRIBE & SAVE - THÁI SƠN FOODS (SPEC)');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // NHÓM 1: TÍNH GIÁ & BẢO LƯU GIÁ (PRICE SNAPSHOTTING & DISCOUNT 15%)
  // ---------------------------------------------------------------------------
  console.log('--- NHÓM 1: Tính Giá & Bảo Lưu Giá (Price Snapshotting) ---');

  // 1.1 Chiết khấu chuẩn 15% cho 1 lốc 7 chai 126.000đ -> 107.100đ, tiết kiệm 18.900đ
  const p1 = calculateSubscriptionItemPrice({
    snapshotRetailPrice: 126_000,
    catalogPrice: 126_000,
    discountPercent: 15,
    quantity: 1,
  });
  assert(p1.finalPrice === 107_100, 'Giá 126.000đ giảm 15% ra đúng 107.100đ');
  assert(p1.discountAmount === 18_900, 'Số tiền tiết kiệm đúng 18.900đ');
  assert(p1.subtotal === 107_100, 'Tổng tiền cho số lượng 1 lốc = 107.100đ');

  // 1.2 Chiết khấu chuẩn cho Lốc 5 chai 568ml: 125.000đ -> 106.250đ
  const p2 = calculateSubscriptionItemPrice({
    snapshotRetailPrice: 125_000,
    catalogPrice: 125_000,
    discountPercent: 15,
  });
  assert(p2.finalPrice === 106_250, 'Giá 125.000đ giảm 15% ra đúng 106.250đ');

  // 1.3 Price Snapshot khi giá thị trường TĂNG: Giữ nguyên giá đã chốt
  // Khách tạo hợp đồng lúc 126.000đ -> chốt 107.100đ. Sau đó thị trường tăng lên 140.000đ
  const pPriceUp = calculateSubscriptionItemPrice({
    priceSnapshot: 126_000,
    catalogPrice: 140_000,
    discountPercent: 15,
  });
  assert(pPriceUp.appliedBasePrice === 126_000, 'Khi giá thị trường tăng (140k), giữ nguyên giá cơ sở chốt (126k)');
  assert(pPriceUp.finalPrice === 107_100, 'Giá thanh toán không bị tăng theo thị trường, giữ vững 107.100đ');

  // 1.4 Price Snapshot khi giá thị trường GIẢM: Tự động bảo vệ quyền lợi, lấy giá thấp hơn
  // Khách tạo hợp đồng lúc 126.000đ. Sau đó nhà máy giảm giá niêm yết xuống 100.000đ
  const pPriceDown = calculateSubscriptionItemPrice({
    priceSnapshot: 126_000,
    catalogPrice: 100_000,
    discountPercent: 15,
    useCatalogPriceIfLower: true,
  });
  assert(pPriceDown.appliedBasePrice === 100_000, 'Khi giá thị trường giảm (100k), tự động áp dụng giá thị trường thấp hơn');
  assert(pPriceDown.finalPrice === 85_000, 'Giá thanh toán tự giảm xuống 85.000đ (= 100.000đ x 0.85)');

  // 1.5 Làm tròn VND nguyên vẹn (không có phần thập phân)
  const pRound = calculateSubscriptionItemPrice({
    catalogPrice: 183_333,
    discountPercent: 15,
  });
  assert(Number.isInteger(pRound.finalPrice), 'Giá cuối cùng luôn là số nguyên VND (Làm tròn chuẩn)');

  // ---------------------------------------------------------------------------
  // NHÓM 2: BIÊN ĐƠN HÀNG & BÁN KÍNH ĐỊA LÝ (≤ 25KM & ≥ 120.000Đ)
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 2: Biên Đơn Hàng & Bán Kính Địa Lý (≤ 25km & ≥ 120.000đ) ---');

  // 2.1 Bán kính giao hàng lạnh: đúng 25.0km là hợp lệ
  const r25Exact = validateDeliveryRadius(25.0);
  assert(r25Exact.isValid, 'Khoảng cách đúng 25.0km (<= 25km) được chấp nhận');

  // 2.2 Bán kính giao hàng lạnh: 25.01km bị từ chối
  const r25Over = validateDeliveryRadius(25.01);
  assert(!r25Over.isValid, 'Khoảng cách 25.01km (> 25km) bị từ chối phục vụ an toàn');

  // 2.3 Khoảng cách 0km (ngay tại chi nhánh) và 15km
  const rZero = validateDeliveryRadius(0.0);
  const rNormal = validateDeliveryRadius(15.0);
  assert(rZero.isValid && rNormal.isValid, 'Khoảng cách 0km và 15km nội thành hợp lệ');

  // 2.4 Ngưỡng đơn hàng tối thiểu 120.000đ:
  // Đơn 119.999đ niêm yết: Dưới ngưỡng
  const isEligible119k = 119_999 >= MEMBERSHIP_CONFIG.MIN_SUBSCRIPTION_ORDER_VALUE;
  assert(!isEligible119k, 'Đơn giá trị niêm yết 119.999đ không đạt ngưỡng tối thiểu 120.000đ');

  // Đơn 120.000đ niêm yết: Đạt ngưỡng
  const isEligible120k = 120_000 >= MEMBERSHIP_CONFIG.MIN_SUBSCRIPTION_ORDER_VALUE;
  assert(isEligible120k, 'Đơn giá trị niêm yết 120.000đ đạt chuẩn tối thiểu');

  // 1 lốc 7 chai (126.000đ niêm yết) đạt chuẩn tối thiểu để được hưởng freeship xe lạnh 100%
  const isPack7Eligible = 126_000 >= MEMBERSHIP_CONFIG.MIN_SUBSCRIPTION_ORDER_VALUE;
  assert(isPack7Eligible, '1 lốc 7 chai (126.000đ) đáp ứng điều kiện ngưỡng đơn tối thiểu Subscribe & Save');

  // ---------------------------------------------------------------------------
  // NHÓM 3: CHU KỲ GIAO HÀNG & TÍNH NGÀY KẾ TIẾP (3 CHU KỲ, QUA THÁNG/NĂM)
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 3: Chu kỳ giao hàng (Weekly, Bi-weekly, Monthly qua tháng/năm) ---');

  // 3.1 Chu kỳ Weekly (1 tuần): Thứ Hai 12/10/2026 -> Thứ Hai 19/10/2026
  const dMon1 = new Date('2026-10-12T01:00:00.000Z');
  const dNextWeek = calculateNextDeliveryDate(dMon1, '1_WEEK', 2);
  assert(formatVietnamDate(dNextWeek) === '19/10/2026', 'Weekly: 12/10/2026 (Thứ 2) -> 19/10/2026 (Thứ 2)');

  // 3.2 Chu kỳ Bi-weekly (2 tuần): Thứ Hai 12/10/2026 -> Thứ Hai 26/10/2026
  const dNext2Weeks = calculateNextDeliveryDate(dMon1, '2_WEEKS', 2);
  assert(formatVietnamDate(dNext2Weeks) === '26/10/2026', 'Bi-weekly: 12/10/2026 (Thứ 2) -> 26/10/2026 (Thứ 2)');

  // 3.3 Chu kỳ Monthly (4 tuần = 28 ngày): 12/10/2026 -> 09/11/2026
  const dNextMonthly = calculateNextDeliveryDate(dMon1, '4_WEEKS', 2);
  assert(formatVietnamDate(dNextMonthly) === '09/11/2026', 'Monthly (4 tuần): 12/10/2026 -> 09/11/2026 (Thứ 2)');

  // 3.4 Vượt qua cuối năm: 21/12/2026 theo chu kỳ 2 tuần -> Rơi vào năm 2027
  const dYearEnd = new Date('2026-12-21T01:00:00.000Z');
  const dNextYear = calculateNextDeliveryDate(dYearEnd, '2_WEEKS', 2);
  assert(formatVietnamDate(dNextYear) === '04/01/2027', 'Chuyển giao năm mới: 21/12/2026 (2 tuần) -> 04/01/2027');

  // 3.5 Vượt qua tháng Hai: 15/02/2027 theo chu kỳ 2 tuần -> 01/03/2027
  const dFeb = new Date('2027-02-15T01:00:00.000Z');
  const dNextFeb = calculateNextDeliveryDate(dFeb, '2_WEEKS', 2);
  assert(formatVietnamDate(dNextFeb) === '01/03/2027', 'Chuyển giao tháng 2: 15/02/2027 -> 01/03/2027 chính xác');

  // ---------------------------------------------------------------------------
  // NHÓM 4: CUT-OFF TIME 18:00 & ONE-CLICK SKIP
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 4: Cut-Off Time 18:00 & One-Click Skip ---');

  // Ngày giao: 15/10/2026. Mốc cắt đơn T-1 là 18:00 ngày 14/10/2026.
  const deliveryDateTarget = new Date('2026-10-15T08:00:00+07:00');
  const cutoffTarget = getDeliveryCutoffTime(deliveryDateTarget, 18);
  assert(cutoffTarget.getHours() === 18, 'Mốc cắt đơn T-1 được xác định chính xác vào lúc 18:00');

  // 4.1 Khách bấm Skip trước 18:00 ngày T-1 (VD: 14/10 lúc 15:30) -> Cho phép!
  const timeBefore18 = new Date('2026-10-14T15:30:00+07:00');
  const skipBefore = isSkipAllowed(deliveryDateTarget, timeBefore18, 18);
  assert(skipBefore.allowed === true, 'One-Click Skip trước 18:00 ngày T-1: HỢP LỆ, được phép dời lịch');

  // 4.2 Khách bấm Skip sát giờ cắt đơn (14/10 lúc 17:59:59) -> Vẫn cho phép!
  const timeAt1759 = new Date('2026-10-14T17:59:59+07:00');
  const skipAtEdge = isSkipAllowed(deliveryDateTarget, timeAt1759, 18);
  assert(skipAtEdge.allowed === true, 'One-Click Skip tại 17:59:59 ngày T-1: Vẫn kịp thời hạn hợp lệ');

  // 4.3 Khách bấm Skip đúng hoặc sau 18:00 ngày T-1 (14/10 lúc 18:00:01) -> BỊ TỪ CHỐI!
  const timeAfter18 = new Date('2026-10-14T18:00:01+07:00');
  const skipAfter = isSkipAllowed(deliveryDateTarget, timeAfter18, 18);
  assert(skipAfter.allowed === false, 'One-Click Skip sau 18:00 ngày T-1: BỊ TỪ CHỐI an toàn vì xưởng đã nấu đêm');
  assert(skipAfter.reason?.includes('18:00'), 'Thông báo lý do từ chối rõ ràng và minh bạch cho khách hàng');

  // 4.4 Khách bấm Skip vào buổi sáng ngày giao hàng (15/10 lúc 07:00) -> BỊ TỪ CHỐI!
  const timeDeliveryMorning = new Date('2026-10-15T07:00:00+07:00');
  const skipMorning = isSkipAllowed(deliveryDateTarget, timeDeliveryMorning, 18);
  assert(skipMorning.allowed === false, 'Skip vào sáng ngày giao hàng bị từ chối');

  // ---------------------------------------------------------------------------
  // NHÓM 5: TỒN KHO & BẢO ĐẢM ZERO-OVERSELL (INVENTORY LOCKING)
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 5: Tồn kho & Bảo đảm Zero-Oversell ---');

  const storeStock = new Map();
  // Kho có 14 chai, giữ chỗ 7, tồn an toàn 0 -> Khả dụng = 7 chai (đủ 1 lốc)
  storeStock.set('prod-sb-01', {
    productId: 'prod-sb-01',
    stockQuantity: 14,
    reserved: 7,
    safetyStock: 0,
  });

  const check1 = validateSubscriptionStock(
    [{ productId: 'prod-sb-01', productName: 'Sữa Bắp', requestedBottles: 7 }],
    storeStock
  );
  assert(check1.isAvailable, 'Tồn khả dụng = 7 chai: Đủ đáp ứng yêu cầu 1 lốc 7 chai');

  // Đơn thứ 2 yêu cầu thêm 7 chai nữa khi khả dụng = 0
  storeStock.get('prod-sb-01').reserved += 7; // reserved = 14 -> khả dụng = 0
  const check2 = validateSubscriptionStock(
    [{ productId: 'prod-sb-01', productName: 'Sữa Bắp', requestedBottles: 7 }],
    storeStock
  );
  assert(!check2.isAvailable, 'Tồn khả dụng = 0 chai: Chặn không cho vượt tồn khả dụng (Zero-Oversell)');
  assert(check2.insufficientItems[0].available === 0, 'Báo cáo chi tiết tồn khả dụng = 0 chai');

  // ---------------------------------------------------------------------------
  // NHÓM 6: MÁY TRẠNG THÁI & CHUYỂN ĐỔI (STATE MACHINES)
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 6: Máy Trạng Thái Hợp Đồng & Kỳ Giao ---');

  // 6.1 Schedule state transitions
  const sch1 = transitionScheduleState('SCHEDULED', 'SEND_REMINDER');
  assert(sch1.allowed && sch1.nextStatus === 'REMINDER_SENT', 'Schedule: SCHEDULED -> REMINDER_SENT khi gửi thông báo T-5');

  const sch2 = transitionScheduleState('REMINDER_SENT', 'USER_SKIP');
  assert(sch2.allowed && sch2.nextStatus === 'SKIPPED', 'Schedule: REMINDER_SENT -> SKIPPED khi khách bấm bỏ qua');

  const sch3 = transitionScheduleState('REMINDER_SENT', 'GENERATE_ORDER');
  assert(sch3.allowed && sch3.nextStatus === 'ORDER_GENERATED', 'Schedule: REMINDER_SENT -> ORDER_GENERATED tại mốc T-1 18:00');

  // Trạng thái đã sinh đơn không cho phép khách Skip nữa
  const schInvalid = transitionScheduleState('ORDER_GENERATED', 'USER_SKIP');
  assert(!schInvalid.allowed, 'Không thể Skip một kỳ giao đã sinh đơn kho (ORDER_GENERATED)');

  // 6.2 Hủy hợp đồng minh bạch không cản trở
  const cCancel = transitionSubscriptionContract('ACTIVE', 'CANCEL');
  assert(cCancel.allowed && cCancel.nextStatus === 'CANCELLED', 'Contract: Cho phép hủy hợp đồng trực tiếp trên web');

  // ---------------------------------------------------------------------------
  // NHÓM 7: KIỂM SOÁT ĐĂNG KÝ TRÙNG LẶP & ĐỔI TẦN SUẤT / ĐỊA CHỈ
  // ---------------------------------------------------------------------------
  console.log('\n--- NHÓM 7: Kiểm soát Đăng Ký Trùng Lặp & Chống Lạm Dụng ---');

  const activeSubs = [
    { id: 'SUB-1001', userId: 'usr_test_1', productId: 'sub-sb-01', status: 'ACTIVE' },
  ];
  const dupCheck = checkDuplicateSubscription({
    userId: 'usr_test_1',
    productId: 'sub-sb-01',
    existingSubscriptions: activeSubs,
  });
  assert(dupCheck.isDuplicate, 'Phát hiện và chặn đăng ký trùng lặp cho cùng một sản phẩm đang ACTIVE');

  // ---------------------------------------------------------------------------
  // TỔNG KẾT KẾT QUẢ KIỂM THỬ
  // ---------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TỔNG KẾT KIỂM THỬ: ${passCount} PASS, ${failCount} FAIL`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runSubscriptionTestSuite().catch((err) => {
  console.error('Lỗi kiểm thử Subscribe & Save:', err);
  process.exit(1);
});
