/**
 * Rate Limiting Utility (In-Memory with Sliding/Fixed Window & Auto-Cleanup)
 * 
 * Mục đích: Chống brute-force tấn công dò mật khẩu tài khoản quản trị viên.
 * Cấu hình mặc định:
 * - Tối đa 5 lần thử sai trong 15 phút.
 * - Khóa 15 phút nếu vượt quá ngưỡng.
 */

interface RateLimitRecord {
  failedAttempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 phút
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 phút

// Tự động dọn dẹp bộ nhớ mỗi 30 phút
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (
        (record.blockedUntil && record.blockedUntil < now) ||
        (!record.blockedUntil && now - record.firstAttemptAt > ATTEMPT_WINDOW_MS)
      ) {
        rateLimitStore.delete(key);
      }
    }
  }, 30 * 60 * 1000);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

export interface RateLimitCheckResult {
  isBlocked: boolean;
  remainingSeconds: number;
  remainingAttempts: number;
}

/**
 * Kiểm tra xem một khóa (IP hoặc username) có đang bị khóa hay không.
 */
export function checkRateLimit(key: string): RateLimitCheckResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return {
      isBlocked: false,
      remainingSeconds: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  // Nếu đang bị block
  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      isBlocked: true,
      remainingSeconds: Math.ceil((record.blockedUntil - now) / 1000),
      remainingAttempts: 0,
    };
  }

  // Nếu hết hạn block hoặc hết cửa sổ theo dõi
  if (now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    rateLimitStore.delete(key);
    return {
      isBlocked: false,
      remainingSeconds: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  return {
    isBlocked: false,
    remainingSeconds: 0,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.failedAttempts),
  };
}

/**
 * Ghi nhận một lần đăng nhập thất bại.
 */
export function recordFailedLogin(key: string): {
  isBlocked: boolean;
  remainingSeconds: number;
  remainingAttempts: number;
  failedCount: number;
} {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    record = {
      failedAttempts: 1,
      firstAttemptAt: now,
      blockedUntil: null,
    };
  } else {
    record.failedAttempts += 1;
  }

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    rateLimitStore.set(key, record);
    return {
      isBlocked: true,
      remainingSeconds: Math.ceil(BLOCK_DURATION_MS / 1000),
      remainingAttempts: 0,
      failedCount: record.failedAttempts,
    };
  }

  rateLimitStore.set(key, record);
  return {
    isBlocked: false,
    remainingSeconds: 0,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - record.failedAttempts),
    failedCount: record.failedAttempts,
  };
}

/**
 * Đặt lại trạng thái khi người dùng đăng nhập thành công.
 */
export function resetLoginRateLimit(key: string): void {
  rateLimitStore.delete(key);
}
