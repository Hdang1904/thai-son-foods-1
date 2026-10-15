/**
 * Quy tắc chuyển trạng thái đơn hàng (dùng chung cho API và giao diện admin — không phụ thuộc Node).
 *
 *  Chờ xử lý → Đã xác nhận → Đang xử lý → Đang giao → Hoàn tất   (được phép nhảy cóc về phía trước)
 *  Hủy: chỉ khi đơn chưa Hoàn tất và chưa Hủy.
 *  Hoàn tất và Đã hủy là trạng thái CUỐI — không mở lại (tránh lệch tồn kho, doanh thu, hoa hồng đối tác).
 */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';

export const ORDER_STATUSES: readonly OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

const FORWARD_FLOW: readonly OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED'];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function isFinalOrderStatus(status: string): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED';
}

/** Các trạng thái được phép chuyển tới từ `current` (không gồm chính nó) */
export function getAllowedNextStatuses(current: string): OrderStatus[] {
  if (isFinalOrderStatus(current)) return [];
  const idx = FORWARD_FLOW.indexOf(current as OrderStatus);
  if (idx === -1) return [];
  return [...FORWARD_FLOW.slice(idx + 1), 'CANCELLED'];
}

export function canTransitionOrderStatus(current: string, next: string): boolean {
  if (current === next) return true; // không đổi trạng thái (chỉ sửa ghi chú)
  return (getAllowedNextStatuses(current) as string[]).includes(next);
}

/** Đơn chỉ được xóa khi chưa phát sinh doanh thu / xuất kho: đã hủy, hoặc còn chờ xử lý (sẽ được hủy + nhả giữ chỗ trước) */
export function canDeleteOrder(status: string): boolean {
  return status === 'CANCELLED' || status === 'PENDING';
}
