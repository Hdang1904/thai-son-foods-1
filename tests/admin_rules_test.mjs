/**
 * Kiểm thử các quy tắc thuần (không cần server/CSDL) của phân hệ admin:
 *  - chuyển trạng thái đơn hàng, điều kiện xóa đơn
 *  - chính sách mật khẩu
 *  - khóa JWT fail-closed ở production
 *  - phạm vi chi nhánh fail-closed của STORE_STAFF
 * Chạy: npx tsx tests/admin_rules_test.mjs
 */
import {
  getAllowedNextStatuses,
  canTransitionOrderStatus,
  canDeleteOrder,
  isOrderStatus,
} from '../src/lib/order-status.ts';
import { validateAdminPassword } from '../src/lib/password-policy.ts';
import { resolveJwtSecret, INSECURE_DEFAULT_JWT_SECRET } from '../src/lib/jwtSecret.ts';
import { getStoreScope, NO_STORE_SCOPE } from '../src/lib/rbac.ts';
import { isSafeUrl, isOptionalSafeUrl, resolveUploadedFile } from '../src/lib/content-validation.ts';
import path from 'node:path';

let failed = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
};

// ── Chuyển trạng thái đơn ──
check('PENDING → CONFIRMED/PROCESSING/SHIPPING/COMPLETED/CANCELLED', getAllowedNextStatuses('PENDING').join() === 'CONFIRMED,PROCESSING,SHIPPING,COMPLETED,CANCELLED');
check('SHIPPING chỉ tiến COMPLETED hoặc CANCELLED', getAllowedNextStatuses('SHIPPING').join() === 'COMPLETED,CANCELLED');
check('COMPLETED là trạng thái cuối', getAllowedNextStatuses('COMPLETED').length === 0);
check('CANCELLED là trạng thái cuối', getAllowedNextStatuses('CANCELLED').length === 0);
check('Không lùi: CONFIRMED → PENDING bị chặn', !canTransitionOrderStatus('CONFIRMED', 'PENDING'));
check('Không mở lại: CANCELLED → CONFIRMED bị chặn', !canTransitionOrderStatus('CANCELLED', 'CONFIRMED'));
check('Không hủy đơn đã hoàn tất', !canTransitionOrderStatus('COMPLETED', 'CANCELLED'));
check('Cùng trạng thái được phép (chỉ sửa ghi chú)', canTransitionOrderStatus('SHIPPING', 'SHIPPING'));
check('Trạng thái lạ không hợp lệ', !isOrderStatus('HACKED') && !canTransitionOrderStatus('PENDING', 'HACKED'));
check('Chỉ xóa đơn PENDING / CANCELLED', canDeleteOrder('PENDING') && canDeleteOrder('CANCELLED') && !canDeleteOrder('CONFIRMED') && !canDeleteOrder('SHIPPING') && !canDeleteOrder('COMPLETED'));

// ── Mật khẩu ──
check('Mật khẩu hợp lệ (chữ + số, ≥ 8)', validateAdminPassword('Matkhau123') === null);
check('Mật khẩu < 8 ký tự bị từ chối', validateAdminPassword('abc123') !== null);
check('Mật khẩu thiếu chữ số bị từ chối', validateAdminPassword('abcdefghij') !== null);
check('Mật khẩu thiếu chữ cái bị từ chối', validateAdminPassword('1234567890') !== null);
check('Mật khẩu không phải chuỗi bị từ chối', validateAdminPassword(undefined) !== null);

// ── Khóa JWT ──
const env = process.env;
const withEnv = (vars, fn) => {
  const backup = { NODE_ENV: env.NODE_ENV, JWT_SECRET: env.JWT_SECRET };
  for (const [k, v] of Object.entries(vars)) v === undefined ? delete env[k] : (env[k] = v);
  try { return fn(); } finally { for (const [k, v] of Object.entries(backup)) v === undefined ? delete env[k] : (env[k] = v); }
};
const throws = (fn) => { try { fn(); return false; } catch { return true; } };
check('Production thiếu JWT_SECRET → báo lỗi', withEnv({ NODE_ENV: 'production', JWT_SECRET: undefined }, () => throws(resolveJwtSecret)));
check('Production dùng khóa mặc định công khai → báo lỗi', withEnv({ NODE_ENV: 'production', JWT_SECRET: INSECURE_DEFAULT_JWT_SECRET }, () => throws(resolveJwtSecret)));
check('Production khóa ngắn (< 32) → báo lỗi', withEnv({ NODE_ENV: 'production', JWT_SECRET: 'ngan' }, () => throws(resolveJwtSecret)));
check('Production khóa mạnh → chấp nhận', withEnv({ NODE_ENV: 'production', JWT_SECRET: 'k'.repeat(48) }, () => resolveJwtSecret() === 'k'.repeat(48)));
check('Development thiếu khóa → dùng khóa dev', withEnv({ NODE_ENV: 'development', JWT_SECRET: undefined }, () => resolveJwtSecret() === INSECURE_DEFAULT_JWT_SECRET));

// ── Phạm vi chi nhánh ──
check('STORE_STAFF có chi nhánh → đúng chi nhánh đó', getStoreScope({ role: 'STORE_STAFF', storeCode: 'D1' }) === 'D1');
check('STORE_STAFF KHÔNG có chi nhánh → mã chặn (fail-closed), không phải null', getStoreScope({ role: 'STORE_STAFF', storeCode: null }) === NO_STORE_SCOPE);
check('SUPER_ADMIN / MARKETING → không giới hạn (null)', getStoreScope({ role: 'SUPER_ADMIN' }) === null && getStoreScope({ role: 'MARKETING', storeCode: 'D1' }) === null);


// ── URL do admin nhập / xóa file upload ──
check('URL nội bộ & https hợp lệ', isSafeUrl('/images/banners/a.jpg') && isSafeUrl('https://cdn.example.com/a.png') && isSafeUrl('/uploads/banners/x.webp'));
check('Chặn javascript: / data: / //host / chuỗi rỗng', !isSafeUrl('javascript:alert(1)') && !isSafeUrl('data:text/html;base64,AAA') && !isSafeUrl('//evil.com/a.png') && !isSafeUrl('') && !isSafeUrl(undefined));
check('Chặn ../ và %2e%2e trong URL', !isSafeUrl('/uploads/../../.env') && !isSafeUrl('/uploads/%2e%2e/%2e%2e/.env') && !isSafeUrl('/uploads/..\\..\\x'));
check('Trường tùy chọn: rỗng được phép, độc hại thì không', isOptionalSafeUrl('') && isOptionalSafeUrl(undefined) && !isOptionalSafeUrl('javascript:x'));
const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
const okFile = resolveUploadedFile('/uploads/banners/a b.jpg');
check('File upload hợp lệ → đường dẫn trong public/uploads', typeof okFile === 'string' && okFile.startsWith(uploadsRoot + path.sep));
check('Path traversal /uploads/../../.env bị từ chối (không xóa được file ngoài uploads)', resolveUploadedFile('/uploads/../../.env') === null && resolveUploadedFile('/uploads/..%2f..%2f.env') === null && resolveUploadedFile('/uploads/%2e%2e/%2e%2e/package.json') === null);
check('Không phải /uploads/ → null', resolveUploadedFile('/images/logo.png') === null && resolveUploadedFile('uploads/x.png') === null && resolveUploadedFile(null) === null);
console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra đạt');
process.exit(failed ? 1 : 0);
