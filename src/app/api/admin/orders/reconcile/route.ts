import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { processOrderReturn, reconcileCodPayment } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    const body = await req.json();
    const { action, orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã đơn hàng (orderId)' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN;');

      if (action === 'reconcile_cod') {
        const amount = Math.round(Number(body.amount) || 0);
        const note = body.note || 'Đối soát COD thành công';
        const res = await reconcileCodPayment(orderId, client, {
          collectedAmount: amount,
          actor: session.username,
          note,
        });

        await client.query('COMMIT;');
        return NextResponse.json({
          success: true,
          message: `Đã xác nhận đối soát COD thành công (${amount.toLocaleString('vi-VN')} ₫)!`,
          data: res,
        });
      }

      if (action === 'process_return') {
        const disposition = body.disposition === 'damaged_spoilage' ? 'damaged_spoilage' : 'restocked';
        const reason = body.reason || 'Khách từ chối nhận / bom hàng';
        const res = await processOrderReturn(orderId, client, {
          disposition,
          reason,
          actor: session.username,
        });

        await client.query('COMMIT;');
        return NextResponse.json({
          success: true,
          message:
            disposition === 'restocked'
              ? `Đã xử lý hoàn trả: nhập lại kho ${res.restoredBottles} chai nguyên vẹn.`
              : `Đã xử lý hoàn trả: ghi nhận hủy ${res.restoredBottles} chai do hư hỏng/hết hạn.`,
          data: res,
        });
      }

      await client.query('ROLLBACK;');
      return NextResponse.json({ success: false, error: `Hành động không hợp lệ: ${action}` }, { status: 400 });
    } catch (txErr: any) {
      await client.query('ROLLBACK;');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error reconciling order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
