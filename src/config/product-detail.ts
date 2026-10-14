/**
 * Cấu hình giao diện trang chi tiết sản phẩm (/san-pham/[slug])
 * Cờ tính năng (Feature Flag) — theo cùng quy ước với MEMBERSHIP_CONFIG.
 */

export const PRODUCT_DETAIL_CONFIG = {
  // Giao diện chi tiết sản phẩm mới theo bố cục Amazon (Gallery | Thông tin | Buy Box).
  // false = hiển thị giao diện cũ (đang dùng). Đổi thành true để bật giao diện mới.
  ENABLE_NEW_LAYOUT: false,
} as const;
