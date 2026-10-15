/**
 * Chính sách mật khẩu tài khoản quản trị — dùng chung cho đăng ký, tạo tài khoản, đặt lại và đổi mật khẩu.
 * (Không phụ thuộc Node nên dùng được cả ở giao diện.)
 */
export const ADMIN_PASSWORD_MIN_LENGTH = 8;

/** Trả về thông báo lỗi tiếng Việt, hoặc null nếu mật khẩu hợp lệ */
export function validateAdminPassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < ADMIN_PASSWORD_MIN_LENGTH) {
    return `Mật khẩu phải có ít nhất ${ADMIN_PASSWORD_MIN_LENGTH} ký tự`;
  }
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return 'Mật khẩu phải bao gồm cả chữ cái và chữ số';
  }
  if (password.length > 128) {
    return 'Mật khẩu tối đa 128 ký tự';
  }
  return null;
}
