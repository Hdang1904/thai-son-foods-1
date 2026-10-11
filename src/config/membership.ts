/**
 * Cấu hình Phân hệ Hội viên & Đăng ký Giao định kỳ (Subscribe & Save)
 * Tuân thủ quy tắc cô lập & cờ tính năng Feature Flag MẶC ĐỊNH TẮT (false)
 */

export const MEMBERSHIP_CONFIG = {
  // Cờ tính năng hội viên: LUÔN TẮT (chưa chốt phương án với doanh nghiệp)
  ENABLE_MEMBERSHIP: false,

  // Cờ tính năng Subscribe & Save: LUÔN TẮT (chưa chốt phương án với doanh nghiệp)
  ENABLE_SUBSCRIBE_SAVE: false,

  // Múi giờ chuẩn vận hành toàn chuỗi
  TIMEZONE: 'Asia/Ho_Chi_Minh',

  // Bán kính giao hàng tối đa cho đơn định kỳ (km)
  MAX_DELIVERY_RADIUS_KM: 25,

  // Ngưỡng đơn hàng tối thiểu tính theo giá niêm yết (VND) để áp dụng Subscribe & Save
  MIN_SUBSCRIPTION_ORDER_VALUE: 120_000,

  // Tỷ lệ chiết khấu cố định Subscribe & Save (15%)
  SUBSCRIPTION_DISCOUNT_RATE: 0.15,
  SUBSCRIPTION_DISCOUNT_PERCENT: 15,

  // Giờ cắt đơn T-1 (18:00 giờ Việt Nam)
  CUTOFF_HOUR: 18,

  // Số ngày gửi nhắc lịch trước ngày giao (T-5)
  REMINDER_LEAD_DAYS: 5,
  REMINDER_DAYS_BEFORE: [5, 3] as const,

  // Phí giao hàng xe lạnh cho đơn định kỳ (Freeship 100%)
  FREE_SHIPPING_FEE: 0,

  // Quy cách đóng gói tiêu chuẩn
  PACK_SPECS: {
    BOTTLE_7_PACK_ML: 330,
    BOTTLE_5_PACK_ML: 568,
  },

  // Cấu hình các gói hội viên chuẩn
  TIERS: {
    FREE: {
      code: 'FREE',
      name: 'Khách hàng Thân thiết (Miễn phí)',
      price: 0,
      billingCycle: 'none',
      discountRate: 0.0,
      freeShipping: false,
      pointRate: 1.0, // 1%
    },
    PRIME_MONTHLY: {
      code: 'PRIME_MONTHLY',
      name: 'Thái Sơn Prime (Gói Tháng)',
      price: 49_000,
      billingCycle: 'month',
      discountRate: 0.15, // 15%
      freeShipping: true,
      pointRate: 2.0, // 2%
      trialDays: 30,
    },
    PRIME_YEARLY: {
      code: 'PRIME_YEARLY',
      name: 'Thái Sơn Prime (Gói Năm)',
      price: 499_000,
      billingCycle: 'year',
      discountRate: 0.15, // 15%
      freeShipping: true,
      pointRate: 2.0,
      trialDays: 30,
    },
  },

  // Cấu hình 3 chu kỳ giao hàng định kỳ chuẩn
  DELIVERY_FREQUENCIES: {
    '1_WEEK': { code: '1_WEEK', days: 7, label: 'Mỗi tuần (1 tuần/lần)' },
    '2_WEEKS': { code: '2_WEEKS', days: 14, label: '2 tuần/lần' },
    '4_WEEKS': { code: '4_WEEKS', days: 28, label: 'Mỗi tháng (4 tuần/lần)' },
  },

  // Giờ chốt tạo đơn JIT (Hours before scheduled delivery date)
  JIT_ORDER_LEAD_HOURS: 24,
} as const;
