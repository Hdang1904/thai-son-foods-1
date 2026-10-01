import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';
import {
  expandComboItems,
  reserveStock,
  releaseStock,
  logInventoryChange,
  getAvailability,
  InsufficientStockError,
} from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    // CHỈ SUPER_ADMIN mới có quyền chuyển đơn hàng giữa các chi nhánh
    if (!hasPermission(session, 'orders.transfer')) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên có quyền chuyển đơn mới có thể chuyển đơn sang chi nhánh khác.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { orderId, targetStoreCode } = body;

    if (!orderId || !targetStoreCode) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã đơn hàng (orderId) hoặc mã chi nhánh đích (targetStoreCode)' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN;');

      // 1. Khóa và lấy thông tin đơn hàng hiện tại
      const orderRes = await client.query(
        `SELECT id, order_code, status, store_code, store_address, inventory_deducted, note
         FROM orders
         WHERE id = $1
         FOR UPDATE;`,
        [orderId]
      );

      if (orderRes.rows.length === 0) {
        await client.query('ROLLBACK;');
        return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }

      const order = orderRes.rows[0];
      const currentStoreCode = order.store_code || 'NH';

      if (currentStoreCode === targetStoreCode) {
        await client.query('ROLLBACK;');
        return NextResponse.json(
          { success: false, error: 'Đơn hàng đã thuộc chi nhánh này, không cần chuyển.' },
          { status: 400 }
        );
      }

      // Chỉ cho phép chuyển chi nhánh khi đơn chưa CONFIRMED (đang PENDING)
      if (order.status !== 'PENDING') {
        await client.query('ROLLBACK;');
        return NextResponse.json(
          {
            success: false,
            error: `Chỉ có thể chuyển chi nhánh cho đơn hàng đang ở trạng thái Chờ xác nhận (PENDING). Đơn này đang là ${order.status}.`,
          },
          { status: 400 }
        );
      }

      // 2. Lấy danh sách món trong đơn hàng
      const itemsRes = await client.query(
        `SELECT product_id, name, quantity, unit, price FROM order_items WHERE order_id = $1;`,
        [orderId]
      );
      if (itemsRes.rows.length === 0) {
        await client.query('ROLLBACK;');
        return NextResponse.json({ success: false, error: 'Đơn hàng không có sản phẩm' }, { status: 400 });
      }

      // 3. Bóc combo các món
      const { expandedBottles } = await expandComboItems(itemsRes.rows, client);

      // 4. Kiểm tra xem chi nhánh đích có đủ hàng không
      const availability = await getAvailability(targetStoreCode, itemsRes.rows, client);
      if (!availability.isAvailable) {
        await client.query('ROLLBACK;');
        return NextResponse.json(
          {
            success: false,
            error: `Chi nhánh đích (${targetStoreCode}) không đủ hàng cho các món trong đơn này.`,
            insufficientItems: availability.insufficientItems,
          },
          { status: 409 }
        );
      }

      // 5. Nhả reservation tại chi nhánh cũ (không hủy đơn, updateOrderStatus = false)
      await releaseStock(
        orderId,
        client,
        `Chuyển đơn từ kho ${currentStoreCode} sang kho ${targetStoreCode}`,
        session.username,
        false
      );

      // 6. Tạo reservation tại chi nhánh mới
      await reserveStock(targetStoreCode, orderId, expandedBottles, client, 24);

      // 7. Lấy địa chỉ của chi nhánh đích
      const storeRes = await client.query(
        `SELECT name, address FROM stores WHERE code = $1;`,
        [targetStoreCode]
      );
      const newStoreName = storeRes.rows[0]?.name || targetStoreCode;
      const newStoreAddress = storeRes.rows[0]?.address || null;

      // 8. Cập nhật đơn hàng (giữ nguyên trạng thái PENDING)
      const transferNote = `[Chuyển chi nhánh: từ ${currentStoreCode} sang ${newStoreName} bởi ${session.username} lúc ${new Date().toLocaleString('vi-VN')}]`;
      const updatedOrderRes = await client.query(
        `UPDATE orders
         SET store_code = $1,
             store_address = $2,
             status = 'PENDING',
             note = CASE WHEN note IS NULL OR note = '' THEN $3 ELSE note || ' ' || $3 END
         WHERE id = $4
         RETURNING *;`,
        [targetStoreCode, newStoreAddress, transferNote, orderId]
      );

      // 9. Ghi log chuyển chi nhánh cho từng mặt hàng (kho cũ và kho mới)
      for (const b of expandedBottles) {
        // Log kho chuyển đi
        await logInventoryChange(client, {
          storeCode: currentStoreCode,
          productId: b.productId,
          oldStock: 0,
          newStock: 0,
          changeType: 'order_transferred_out',
          orderId,
          actor: session.username,
          note: `Chuyển đơn ${order.order_code} sang kho ${targetStoreCode} (${b.bottleQuantity} chai)`,
        });

        // Log kho tiếp nhận
        await logInventoryChange(client, {
          storeCode: targetStoreCode,
          productId: b.productId,
          oldStock: 0,
          newStock: 0,
          changeType: 'order_transferred_in',
          orderId,
          actor: session.username,
          note: `Tiếp nhận chuyển đơn ${order.order_code} từ kho ${currentStoreCode} sang ${targetStoreCode} (${b.bottleQuantity} chai)`,
        });
      }

      await client.query('COMMIT;');

      await writeAuditLog({
        adminId: session.id,
        adminUsername: session.username,
        role: session.role,
        action: 'ORDER_TRANSFER_STORE',
        entityType: 'ORDER',
        entityId: orderId,
        storeCode: targetStoreCode,
        beforeJson: {
          store_code: currentStoreCode,
          order_code: order.order_code,
        },
        afterJson: {
          store_code: targetStoreCode,
          store_name: newStoreName,
          order_code: order.order_code,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Đã chuyển đơn hàng ${order.order_code} sang chi nhánh ${newStoreName} thành công!`,
        order: updatedOrderRes.rows[0],
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK;');
      if (txErr instanceof InsufficientStockError) {
        return NextResponse.json(
          {
            success: false,
            error: txErr.message,
            insufficientItems: txErr.insufficientItems,
          },
          { status: 409 }
        );
      }
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error transferring order store:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
