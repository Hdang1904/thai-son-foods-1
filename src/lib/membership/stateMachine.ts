/**
 * Cỗ máy Trạng thái (Finite State Machine) cho Hội viên & Đăng ký Giao định kỳ
 * Bảo đảm chuyển đổi trạng thái nghiêm ngặt, chống Dark Patterns và có kiểm tra tính hợp lệ
 */

import {
  MembershipStatus,
  SubscriptionStatus,
  SubscriptionScheduleStatus,
} from '@/types/membership';

// ==============================================================================
// 1. MÁY TRẠNG THÁI HỘI VIÊN (MEMBER LIFECYCLE STATE MACHINE)
// ==============================================================================

export type MemberEvent =
  | 'OPT_IN_TRIAL'
  | 'PURCHASE_PAID'
  | 'TRIAL_EXPIRED'
  | 'RENEWAL_WINDOW_OPENED'
  | 'RENEWAL_PAID'
  | 'RENEWAL_OVERDUE'
  | 'REQUEST_PAUSE'
  | 'RESUME_MEMBERSHIP'
  | 'REQUEST_CANCEL'
  | 'REACTIVATE_CANCELLED'
  | 'PERIOD_EXPIRED'
  | 'TRIGGER_WIN_BACK'
  | 'WIN_BACK_CONVERTED'
  | 'KEEP_FREE';

export interface MemberTransitionResult {
  allowed: boolean;
  nextStatus: MembershipStatus;
  reason?: string;
  hasAccessToBenefits: boolean;
}

const MEMBER_BENEFIT_ACCESS: Record<MembershipStatus, boolean> = {
  STANDARD_FREE: false,
  TRIAL_ACTIVE: true,
  PAID_ACTIVE: true,
  RENEWAL_DUE: true,
  PAUSED: false,
  CANCELLED_GRACE: true, // Bảo lưu quyền đến hết kỳ thanh toán (Anti-Dark Pattern)
  EXPIRED_CHURN: false,
  WIN_BACK: false,
};

export function transitionMemberState(
  currentStatus: MembershipStatus,
  event: MemberEvent
): MemberTransitionResult {
  switch (currentStatus) {
    case 'STANDARD_FREE':
      if (event === 'OPT_IN_TRIAL') {
        return { allowed: true, nextStatus: 'TRIAL_ACTIVE', hasAccessToBenefits: true };
      }
      if (event === 'PURCHASE_PAID') {
        return { allowed: true, nextStatus: 'PAID_ACTIVE', hasAccessToBenefits: true };
      }
      break;

    case 'TRIAL_ACTIVE':
      if (event === 'PURCHASE_PAID') {
        return { allowed: true, nextStatus: 'PAID_ACTIVE', hasAccessToBenefits: true };
      }
      if (event === 'TRIAL_EXPIRED') {
        return { allowed: true, nextStatus: 'STANDARD_FREE', hasAccessToBenefits: false };
      }
      if (event === 'REQUEST_CANCEL') {
        return { allowed: true, nextStatus: 'STANDARD_FREE', hasAccessToBenefits: false };
      }
      break;

    case 'PAID_ACTIVE':
      if (event === 'RENEWAL_WINDOW_OPENED') {
        return { allowed: true, nextStatus: 'RENEWAL_DUE', hasAccessToBenefits: true };
      }
      if (event === 'REQUEST_PAUSE') {
        return { allowed: true, nextStatus: 'PAUSED', hasAccessToBenefits: false };
      }
      if (event === 'REQUEST_CANCEL') {
        // Anti-Dark pattern: Khách hủy nhưng vẫn được dùng quyền đến hết chu kỳ đã thanh toán
        return { allowed: true, nextStatus: 'CANCELLED_GRACE', hasAccessToBenefits: true };
      }
      break;

    case 'RENEWAL_DUE':
      if (event === 'RENEWAL_PAID') {
        return { allowed: true, nextStatus: 'PAID_ACTIVE', hasAccessToBenefits: true };
      }
      if (event === 'RENEWAL_OVERDUE') {
        return { allowed: true, nextStatus: 'EXPIRED_CHURN', hasAccessToBenefits: false };
      }
      if (event === 'REQUEST_CANCEL') {
        return { allowed: true, nextStatus: 'CANCELLED_GRACE', hasAccessToBenefits: true };
      }
      break;

    case 'PAUSED':
      if (event === 'RESUME_MEMBERSHIP') {
        return { allowed: true, nextStatus: 'PAID_ACTIVE', hasAccessToBenefits: true };
      }
      if (event === 'REQUEST_CANCEL') {
        return { allowed: true, nextStatus: 'EXPIRED_CHURN', hasAccessToBenefits: false };
      }
      break;

    case 'CANCELLED_GRACE':
      if (event === 'REACTIVATE_CANCELLED') {
        return { allowed: true, nextStatus: 'PAID_ACTIVE', hasAccessToBenefits: true };
      }
      if (event === 'PERIOD_EXPIRED') {
        return { allowed: true, nextStatus: 'EXPIRED_CHURN', hasAccessToBenefits: false };
      }
      break;

    case 'EXPIRED_CHURN':
      if (event === 'TRIGGER_WIN_BACK') {
        return { allowed: true, nextStatus: 'WIN_BACK', hasAccessToBenefits: false };
      }
      if (event === 'PURCHASE_PAID') {
        return { allowed: true, nextStatus: 'PAID_ACTIVE', hasAccessToBenefits: true };
      }
      break;

    case 'WIN_BACK':
      if (event === 'WIN_BACK_CONVERTED' || event === 'PURCHASE_PAID') {
        return { allowed: true, nextStatus: 'PAID_ACTIVE', hasAccessToBenefits: true };
      }
      if (event === 'KEEP_FREE') {
        return { allowed: true, nextStatus: 'STANDARD_FREE', hasAccessToBenefits: false };
      }
      break;
  }

  return {
    allowed: false,
    nextStatus: currentStatus,
    reason: `Chuyển đổi trạng thái từ [${currentStatus}] với sự kiện [${event}] không hợp lệ.`,
    hasAccessToBenefits: MEMBER_BENEFIT_ACCESS[currentStatus],
  };
}

// ==============================================================================
// 2. MÁY TRẠNG THÁI HỢP ĐỒNG ĐỊNH KỲ (SUBSCRIPTION CONTRACT STATE MACHINE)
// ==============================================================================

export type SubscriptionContractEvent =
  | 'ACTIVATE'
  | 'PAUSE'
  | 'RESUME'
  | 'CANCEL';

export function transitionSubscriptionContract(
  currentStatus: SubscriptionStatus,
  event: SubscriptionContractEvent
): { allowed: boolean; nextStatus: SubscriptionStatus; reason?: string } {
  switch (currentStatus) {
    case 'DRAFT':
      if (event === 'ACTIVATE') return { allowed: true, nextStatus: 'ACTIVE' };
      break;
    case 'ACTIVE':
      if (event === 'PAUSE') return { allowed: true, nextStatus: 'PAUSED' };
      if (event === 'CANCEL') return { allowed: true, nextStatus: 'CANCELLED' };
      break;
    case 'PAUSED':
      if (event === 'RESUME') return { allowed: true, nextStatus: 'ACTIVE' };
      if (event === 'CANCEL') return { allowed: true, nextStatus: 'CANCELLED' };
      break;
    case 'CANCELLED':
      // Hợp đồng đã hủy không thể phục hồi trực tiếp mà phải tạo hợp đồng mới
      break;
  }
  return {
    allowed: false,
    nextStatus: currentStatus,
    reason: `Không thể chuyển hợp đồng từ [${currentStatus}] bằng sự kiện [${event}].`,
  };
}

// ==============================================================================
// 3. MÁY TRẠNG THÁI TỪNG KỲ GIAO HÀNG (SUBSCRIPTION SCHEDULE STATE MACHINE)
// ==============================================================================

export type ScheduleEvent =
  | 'SEND_REMINDER'
  | 'USER_SKIP'
  | 'GENERATE_ORDER'
  | 'CANCEL_SCHEDULE';

export function transitionScheduleState(
  currentStatus: SubscriptionScheduleStatus,
  event: ScheduleEvent
): { allowed: boolean; nextStatus: SubscriptionScheduleStatus; reason?: string } {
  switch (currentStatus) {
    case 'SCHEDULED':
      if (event === 'SEND_REMINDER') return { allowed: true, nextStatus: 'REMINDER_SENT' };
      if (event === 'USER_SKIP') return { allowed: true, nextStatus: 'SKIPPED' };
      if (event === 'CANCEL_SCHEDULE') return { allowed: true, nextStatus: 'CANCELLED' };
      break;

    case 'REMINDER_SENT':
      if (event === 'USER_SKIP') return { allowed: true, nextStatus: 'SKIPPED' };
      if (event === 'GENERATE_ORDER') return { allowed: true, nextStatus: 'ORDER_GENERATED' };
      if (event === 'CANCEL_SCHEDULE') return { allowed: true, nextStatus: 'CANCELLED' };
      break;

    case 'SKIPPED':
    case 'ORDER_GENERATED':
    case 'CANCELLED':
      // Trạng thái kết thúc của một kỳ
      break;
  }

  return {
    allowed: false,
    nextStatus: currentStatus,
    reason: `Kỳ giao hàng ở trạng thái [${currentStatus}] không chấp nhận sự kiện [${event}].`,
  };
}
