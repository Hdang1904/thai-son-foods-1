import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

function maskEmail(email: string | null | undefined): string {
  if (!email) return '***';
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [user, domain] = parts;
  const maskedUser = user.length <= 2 ? user[0] + '***' : user.slice(0, 2) + '***' + user.slice(-1);
  return `${maskedUser}@${domain}`;
}

function maskPhoneInText(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/(0[3|5|7|8|9][0-9]{8})/g, (match) => {
    return match.substring(0, 3) + '****' + match.substring(7);
  });
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  const session = await getAdminSession();
  const auth = requirePermission(session as any, 'system.seed');
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const res = await query(`
      SELECT id, order_code, recipient, email_type, subject, status, provider, created_at, error_message
      FROM email_logs
      ORDER BY created_at DESC
      LIMIT 30;
    `);

    const maskedLogs = res.rows.map((row: any) => ({
      id: row.id,
      order_code: row.order_code,
      recipient: maskEmail(row.recipient),
      email_type: row.email_type,
      subject: maskPhoneInText(row.subject),
      status: row.status,
      provider: row.provider,
      error_message: row.error_message ? maskPhoneInText(maskEmail(row.error_message)) : null,
      created_at: row.created_at,
    }));

    return NextResponse.json({ success: true, logs: maskedLogs });
  } catch (error: any) {
    // Nếu bảng chưa tạo, trả về mảng rỗng thay vì crash
    return NextResponse.json({ success: true, logs: [], note: error.message });
  }
}

