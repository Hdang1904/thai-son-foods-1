import { query } from '@/lib/db';

export interface AuditLogParams {
  adminId?: string | null;
  adminUsername?: string | null;
  role?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  storeCode?: string | null;
  beforeJson?: unknown;
  afterJson?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'passwordhash',
  'token',
  'secret',
  'jwt',
  'cookie',
  'apikey',
  'api_key',
  'authorization',
]);

/**
 * Khử sạch các trường nhạy cảm (mật khẩu, hash, token) trước khi ghi log
 */
export function sanitizeAuditData(data: unknown): unknown {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeAuditData(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    let isSensitive = false;
    for (const sens of SENSITIVE_KEYS) {
      if (lowerKey.includes(sens)) {
        isSensitive = true;
        break;
      }
    }

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Ghi nhật ký hoạt động quản trị viên (Audit Log)
 * Tuyệt đối không lưu mật khẩu, hash hoặc token.
 */
export async function writeAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sanitizedBefore = params.beforeJson ? JSON.stringify(sanitizeAuditData(params.beforeJson)) : null;
    const sanitizedAfter = params.afterJson ? JSON.stringify(sanitizeAuditData(params.afterJson)) : null;

    await query(
      `INSERT INTO audit_logs (
        id, admin_id, admin_username, role, action, entity_type, entity_id, store_code, before_json, after_json, ip, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        id,
        params.adminId || null,
        params.adminUsername || null,
        params.role || null,
        params.action,
        params.entityType,
        params.entityId || null,
        params.storeCode || null,
        sanitizedBefore,
        sanitizedAfter,
        params.ip || null,
        params.userAgent || null,
      ]
    );
  } catch (err) {
    // Không làm sập request nếu việc ghi log gặp lỗi, chỉ in cảnh báo server
    console.error('Failed to write audit log:', err);
  }
}
