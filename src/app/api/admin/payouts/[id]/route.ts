import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(
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

    if (!hasPermission(session, 'payouts.approve')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xét duyệt hoặc chi trả hoa hồng.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { id } = await props.params;
    const body = await request.json();
    const { action, reason, bankReference } = body;

    // 1. Kiểm tra yêu cầu rút tiền tồn tại
    const payoutRes = await query(`SELECT * FROM payout_requests WHERE id = $1;`, [id]);
    if (payoutRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền' }, { status: 404 });
    }

    const currentPayout = payoutRes.rows[0];

    // Không thể thao tác lại trên yêu cầu đã hoàn tất chi trả hoặc đã từ chối
    if (currentPayout.status === 'PAID') {
      return NextResponse.json({ success: false, error: 'Yêu cầu này đã được thanh toán thành công, không thể thay đổi.' }, { status: 400 });
    }
    if (currentPayout.status === 'REJECTED') {
      return NextResponse.json({ success: false, error: 'Yêu cầu này đã bị từ chối trước đó, không thể thay đổi.' }, { status: 400 });
    }

    const client = await pool.connect();
    let updatedPayout;

    try {
      await client.query('BEGIN;');

      switch (action) {
        case 'APPROVE': {
          const res = await client.query(
            `UPDATE payout_requests
             SET status = 'APPROVED',
                 reviewed_by = $1,
                 reviewed_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *;`,
            [session.username, id]
          );
          updatedPayout = res.rows[0];
          break;
        }

        case 'REJECT': {
          const rejectReason = (reason || 'Từ chối bởi kế toán').toString().trim();
          // Hoàn lại tiền vào ví đối tác
          await client.query(
            `UPDATE partner_profiles
             SET current_balance = current_balance + $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2;`,
            [currentPayout.amount, currentPayout.partner_id]
          );

          // Cập nhật dòng sổ cái tạm giữ sang VOID và ghi chú lý do
          await client.query(
            `UPDATE partner_ledger
             SET status = 'VOID',
                 note = COALESCE(note, '') || ' [Từ chối rút tiền: ' || $1 || ']'
             WHERE reference_id = $2;`,
            [rejectReason, id]
          );

          const res = await client.query(
            `UPDATE payout_requests
             SET status = 'REJECTED',
                 rejection_reason = $1,
                 reviewed_by = $2,
                 reviewed_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *;`,
            [rejectReason, session.username, id]
          );
          updatedPayout = res.rows[0];
          break;
        }

        case 'MARK_AS_PAID': {
          const bankRef = (bankReference || body.bank_reference || '').toString().trim();
          if (!bankRef) {
            await client.query('ROLLBACK;');
            return NextResponse.json(
              { success: false, error: 'Vui lòng cung cấp mã giao dịch ngân hàng (bank reference) khi xác nhận đã thanh toán.' },
              { status: 400 }
            );
          }

          // Cập nhật dòng sổ cái sang PAID
          await client.query(
            `UPDATE partner_ledger
             SET status = 'PAID',
                 note = COALESCE(note, '') || ' [Đã chuyển khoản thành công. Mã GD: ' || $1 || ']'
             WHERE reference_id = $2;`,
            [bankRef, id]
          );

          const res = await client.query(
            `UPDATE payout_requests
             SET status = 'PAID',
                 bank_reference = $1,
                 paid_by = $2,
                 paid_at = CURRENT_TIMESTAMP,
                 reviewed_by = COALESCE(reviewed_by, $2),
                 reviewed_at = COALESCE(reviewed_at, CURRENT_TIMESTAMP)
             WHERE id = $3
             RETURNING *;`,
            [bankRef, session.username, id]
          );
          updatedPayout = res.rows[0];
          break;
        }

        default:
          await client.query('ROLLBACK;');
          return NextResponse.json({ success: false, error: `Hành động không hợp lệ: ${action}` }, { status: 400 });
      }

      await client.query('COMMIT;');
    } catch (txErr) {
      await client.query('ROLLBACK;');
      throw txErr;
    } finally {
      client.release();
    }

    // Ghi Audit Log bất biến
    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: `PAYOUT_${action}`,
      entityType: 'PAYOUT_REQUEST',
      entityId: id,
      beforeJson: {
        status: currentPayout.status,
        amount: currentPayout.amount,
        bank_name: currentPayout.bank_name,
      },
      afterJson: {
        status: updatedPayout.status,
        amount: updatedPayout.amount,
        bank_reference: updatedPayout.bank_reference,
        rejection_reason: updatedPayout.rejection_reason,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cập nhật yêu cầu rút tiền thành công (Trạng thái: ${updatedPayout.status})`,
      payout: updatedPayout,
    });
  } catch (error: any) {
    console.error('[AdminPayoutAction] Error updating payout:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
