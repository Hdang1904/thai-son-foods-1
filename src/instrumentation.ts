/**
 * Chạy một lần khi server Next.js khởi động (Node runtime).
 * Kiểm tra cấu hình bắt buộc ở production (JWT_SECRET mạnh, CRON_SECRET, ...) và ghi log lỗi rõ ràng
 * ngay từ lúc khởi động, thay vì để lộ ra muộn khi có người dùng đăng nhập.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { validateProductionEnvironment } = await import('@/lib/auth');
  validateProductionEnvironment();
}
