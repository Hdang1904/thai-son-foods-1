/**
 * Khoá ký JWT dùng chung (không import thư viện Node nào → an toàn cho cả middleware/edge).
 *
 * - Development: dùng khoá mặc định khi chưa cấu hình để chạy local thuận tiện.
 * - Production: BẮT BUỘC đặt JWT_SECRET (≥ 32 ký tự, khác khoá mặc định). Nếu không, mọi thao tác
 *   ký/xác minh token sẽ báo lỗi (fail-closed) thay vì lặng lẽ dùng khoá công khai trong mã nguồn.
 *   Kiểm tra diễn ra khi dùng (không phải lúc import) nên `next build` không bị chặn.
 */
export const INSECURE_DEFAULT_JWT_SECRET = 'tsf_super_secret_jwt_key_2026_thai_son_foods';

export function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!configured || configured === INSECURE_DEFAULT_JWT_SECRET || configured.length < 32) {
      throw new Error('JWT_SECRET chưa được cấu hình an toàn (cần ≥ 32 ký tự, khác khoá mặc định) ở môi trường production.');
    }
    return configured;
  }
  return configured || INSECURE_DEFAULT_JWT_SECRET;
}

let cached: { raw: string; bytes: Uint8Array } | null = null;

export function getJwtSecretBytes(): Uint8Array {
  const raw = resolveJwtSecret();
  if (!cached || cached.raw !== raw) {
    cached = { raw, bytes: new TextEncoder().encode(raw) };
  }
  return cached.bytes;
}
