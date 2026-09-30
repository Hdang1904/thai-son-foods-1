/**
 * Cấu hình nghiệp vụ Quản lý Kho & Giữ chỗ tồn kho Thái Sơn Foods
 * Không hardcode trong code logic - tất cả cấu hình tập trung tại đây.
 */

export const INVENTORY_CONFIG = {
  // Thời gian giữ chỗ cho đơn hàng PENDING (mặc định 24 giờ)
  RESERVATION_EXPIRY_HOURS: 24,

  // Ngưỡng cảnh báo sản phẩm sắp hết hàng tại chi nhánh
  LOW_STOCK_THRESHOLD: 5,

  // Chính sách chống lạm dụng COD
  COD_VALIDATION: {
    // Giá trị đơn COD tối đa (10 triệu - đơn lớn hơn cần xác nhận)
    MAX_ORDER_VALUE: 10_000_000,

    // Số đơn PENDING tối đa cùng SĐT (chống spam)
    MAX_PENDING_ORDERS_PER_PHONE: 3,

    // Thời gian tối thiểu giữa 2 đơn cùng SĐT (phút)
    MIN_ORDER_INTERVAL_MINUTES: 5,

    // SĐT Việt Nam hợp lệ (regex)
    PHONE_REGEX: /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-689]|9[0-46-9])\d{7}$/,

    // Yêu cầu địa chỉ tối thiểu (số ký tự)
    MIN_ADDRESS_LENGTH: 10,
  },

  // Chính sách phí vận chuyển
  SHIPPING: {
    // Mặc định hiện tại: 30.000đ, miễn phí từ 200.000đ
    DEFAULT_FEE: 30000,
    FREE_SHIPPING_THRESHOLD: 200000,

    // GIAI ĐOẠN 5: Cấu trúc tính phí theo khoảng cách km (chuẩn bị sẵn sàng)
    DISTANCE_BASED: {
      ENABLED: false, // Mặc định FALSE cho đến khi có chỉ định bật từ người dùng
      MAX_DELIVERY_RADIUS_KM: 25, // Bán kính giao hàng tối đa 25km
      TIERS: [
        { maxKm: 3, fee: 15000 }, // Bậc 1: Dưới 3km
        { maxKm: 6, fee: 25000 }, // Bậc 2: 3 - 6km
        { maxKm: 10, fee: 35000 }, // Bậc 3: 6 - 10km
        { maxKm: 25, fee: 50000 }, // Bậc 4: 10 - 25km
      ],
      EXTRA_FEE_PER_KM: 5000, // Phụ thu nếu có km vượt mức
    },
  },
} as const;

/**
 * Hàm tính phí vận chuyển dùng chung cho Client & Server
 * Đảm bảo: Nếu đơn đạt ngưỡng miễn phí -> 0đ.
 * Nếu chưa bật khoảng cách -> 30.000đ.
 * Nếu bật khoảng cách -> tra cứu theo bậc km tương ứng.
 */
export function calculateShippingFee(
  subtotal: number,
  distanceKm?: number | null
): {
  fee: number;
  isFree: boolean;
  isBeyondRadius: boolean;
  reason?: string;
} {
  // 1. Kiểm tra chính sách miễn phí giao hàng theo giá trị đơn
  if (subtotal >= INVENTORY_CONFIG.SHIPPING.FREE_SHIPPING_THRESHOLD) {
    return { fee: 0, isFree: true, isBeyondRadius: false };
  }

  // 2. Nếu cấu trúc tính phí theo khoảng cách được kích hoạt
  const distConfig = INVENTORY_CONFIG.SHIPPING.DISTANCE_BASED;
  if (distConfig.ENABLED && typeof distanceKm === 'number' && distanceKm >= 0) {
    if (distanceKm > distConfig.MAX_DELIVERY_RADIUS_KM) {
      return {
        fee: INVENTORY_CONFIG.SHIPPING.DEFAULT_FEE,
        isFree: false,
        isBeyondRadius: true,
        reason: `Khoảng cách (${distanceKm.toFixed(1)}km) vượt quá bán kính giao tối đa (${distConfig.MAX_DELIVERY_RADIUS_KM}km)`,
      };
    }

    for (const tier of distConfig.TIERS) {
      if (distanceKm <= tier.maxKm) {
        return { fee: tier.fee, isFree: false, isBeyondRadius: false };
      }
    }
  }

  // 3. Mặc định áp dụng mức phí cố định 30.000đ
  return {
    fee: INVENTORY_CONFIG.SHIPPING.DEFAULT_FEE,
    isFree: false,
    isBeyondRadius: false,
  };
}
