import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!hasPermission(session, 'cod.reconcile') && !hasPermission(session, 'orders.update_status_all')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xác nhận thanh toán đơn hàng.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { id } = await props.params;
    const body = await request.json();
    const paymentRef = (body.paymentReference || body.payment_reference || body.bankReference || '').toString().trim();

    if (!paymentRef) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mã giao dịch ngân hàng (payment reference).' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra đơn hàng tồn tại
    const orderRes = await query(`SELECT * FROM orders WHERE id = $1;`, [id]);
    if (orderRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    const currentOrder = orderRes.rows[0];

    // 2. Cập nhật trạng thái thanh toán chuyển khoản
    const updateRes = await query(
      `UPDATE orders
       SET payment_status = 'PAID',
           payment_reference = $1::text,
           payment_reconciled_at = CURRENT_TIMESTAMP,
           payment_reconciled_by = $2,
           status = CASE WHEN status = 'PENDING' THEN 'CONFIRMED' ELSE status END,
           note = COALESCE(note, '') || ' [Đã khớp lệnh chuyển khoản: ' || $1::text || ']'
       WHERE id = $3
       RETURNING *;`,
      [paymentRef, session.username, id]
    );

    const updatedOrder = updateRes.rows[0];

    // 2.5. Đồng bộ trạng thái thanh toán chuyển khoản sang sổ cái hoa hồng đối tác
    try {
      const { processPartnerOrderEvent } = await import('@/lib/partner/orderEvent');
      await processPartnerOrderEvent(id, 'PAYMENT_RECONCILED', {
        actor: session.username,
        note: `Đã xác nhận thanh toán chuyển khoản: ${paymentRef}`,
      });
    } catch (partnerErr) {
      console.error('[ConfirmPayment] Error updating partner order event:', partnerErr);
    }

    // 3. Ghi Audit Log
    await writeAuditLog({
      adminId: session.userId || session.id,
      adminUsername: session.username,
      role: session.role,
      action: 'ORDER_PAYMENT_CONFIRM',
      entityType: 'ORDER',
      entityId: id,
      beforeJson: {
        payment_status: currentOrder.payment_status,
        payment_reference: currentOrder.payment_reference,
        status: currentOrder.status,
      },
      afterJson: {
        payment_status: updatedOrder.payment_status,
        payment_reference: updatedOrder.payment_reference,
        status: updatedOrder.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xác nhận thanh toán chuyển khoản thành công cho đơn ${updatedOrder.order_code}!`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('[ConfirmPayment] Error confirming order payment:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
