import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';
import { processOrderReturn, reconcileCodPayment } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, orderId } = body;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ success: false, error: 'Thiếu mã đơn hàng (orderId)' }, { status: 400 });
    }

    // Kiểm tra quyền theo hành động
    if (action === 'reconcile_cod') {
      if (!hasPermission(session, 'cod.reconcile')) {
        return NextResponse.json(
          { success: false, error: 'Bạn không có quyền đối soát COD.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else if (action === 'process_return') {
      if (!hasPermission(session, 'cod.process_return')) {
        return NextResponse.json(
          { success: false, error: 'Bạn không có quyền xử lý hàng hoàn trả.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ success: false, error: `Hành động không hợp lệ: ${action}` }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN;');

      if (action === 'reconcile_cod') {
        const amount = Math.round(Number(body.amount) || 0);
        const note = body.note ? String(body.note).slice(0, 500) : 'Đối soát COD thành công';
        const res = await reconcileCodPayment(orderId, client, {
          collectedAmount: amount,
          actor: session.username,
          note,
        });

        // Đồng bộ đối soát doanh thu và hoa hồng đối tác
        const { processPartnerOrderEvent } = await import('@/lib/partner/orderEvent');
        await processPartnerOrderEvent(orderId, 'COD_RECONCILED', {
          client,
          actor: session.username,
          reconciledAmount: amount,
        });

        await client.query('COMMIT;');

        await writeAuditLog({
          adminId: session.id,
          adminUsername: session.username,
          role: session.role,
          action: 'COD_RECONCILE',
          entityType: 'ORDER',
          entityId: orderId,
          afterJson: { collectedAmount: amount, note },
        });

        return NextResponse.json({
          success: true,
          message: `Đã xác nhận đối soát COD thành công (${amount.toLocaleString('vi-VN')} ₫)!`,
          data: res,
        });
      }

      if (action === 'process_return') {
        const disposition = body.disposition === 'damaged_spoilage' ? 'damaged_spoilage' : 'restocked';
        const reason = body.reason ? String(body.reason).slice(0, 500) : 'Khách từ chối nhận / bom hàng';
        const res = await processOrderReturn(orderId, client, {
          disposition,
          reason,
          actor: session.username,
        });

        // Đồng bộ thu hồi / hủy hoa hồng đối tác khi hoàn đơn
        const { processPartnerOrderEvent } = await import('@/lib/partner/orderEvent');
        await processPartnerOrderEvent(orderId, 'ORDER_RETURNED', {
          client,
          actor: session.username,
          note: reason,
        });

        await client.query('COMMIT;');

        await writeAuditLog({
          adminId: session.id,
          adminUsername: session.username,
          role: session.role,
          action: 'COD_PROCESS_RETURN',
          entityType: 'ORDER',
          entityId: orderId,
          afterJson: { disposition, reason, restoredBottles: res.restoredBottles },
        });

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
