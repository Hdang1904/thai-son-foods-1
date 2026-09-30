import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query(`
      SELECT * FROM email_logs
      ORDER BY created_at DESC
      LIMIT 30;
    `);
    return NextResponse.json({ success: true, logs: res.rows });
  } catch (error: any) {
    // Nếu bảng chưa tạo, trả về mảng rỗng thay vì crash
    return NextResponse.json({ success: true, logs: [], note: error.message });
  }
}
