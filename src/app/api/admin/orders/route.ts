import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission, getStoreScope } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';
import { sendOrderEmail } from '@/lib/email/service';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách đơn hàng hoặc chi tiết 1 đơn hàng (có kiểm tra quyền + chống IDOR)
export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const canViewAll = hasPermission(session, 'orders.view_all');
    const canViewOwnStore = hasPermission(session, 'orders.view_own_store');

    if (!canViewAll && !canViewOwnStore) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xem đơn hàng.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const storeScope = getStoreScope(session);
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('q') || '';
    const queryStoreCode = searchParams.get('storeCode');

    const canViewCostPrice = hasPermission(session, 'cost_price.view');

    // 1. Nếu yêu cầu chi tiết 1 đơn hàng (chống IDOR)
    if (orderId) {
      const orderRes = await query(`SELECT * FROM orders WHERE id = $1;`, [orderId]);
      if (orderRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }

      const orderData = orderRes.rows[0];

      // STORE_STAFF không được phép đọc đơn ngoài cửa hàng của mình (chống IDOR)
      if (storeScope && orderData.store_code !== storeScope) {
        return NextResponse.json(
          { success: false, error: 'Bạn không có quyền xem đơn hàng của cửa hàng khác.', code: 'FORBIDDEN' },
          { status: 403 }
        );
      }

      const itemsRes = await query(
        `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC;`,
        [orderId]
      );

      const sanitizedItems = itemsRes.rows.map(item => {
        if (!canViewCostPrice) {
          const { cost_price, ...safeItem } = item;
          return safeItem;
        }
        return item;
      });

      return NextResponse.json({
        success: true,
        order: {
          ...orderData,
          items: sanitizedItems,
        },
      });
    }

    // 2. Lấy danh sách đơn hàng (bắt buộc ép WHERE store_code = storeScope nếu là STORE_STAFF)
    const costFieldSql = canViewCostPrice ? `'cost_price', oi.cost_price,` : '';
    let sql = `
      SELECT 
        o.*,
        COUNT(oi.id) AS item_count,
        COALESCE(json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'price', oi.price,
            ${costFieldSql}
            'quantity', oi.quantity,
            'unit', oi.unit,
            'thumbnail', oi.thumbnail,
            'bottle_multiplier', oi.bottle_multiplier,
            'total_bottles', oi.total_bottles,
            'canonical_product_id', oi.canonical_product_id,
            'combo_snapshot', oi.combo_snapshot
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Phạm vi cửa hàng: STORE_STAFF bị ép buộc dùng storeScope từ DB session
    if (storeScope) {
      params.push(storeScope);
      sql += ` AND o.store_code = $${params.length}`;
    } else if (queryStoreCode && queryStoreCode !== 'ALL') {
      params.push(queryStoreCode);
      sql += ` AND o.store_code = $${params.length}`;
    }

    if (status !== 'ALL') {
      params.push(status);
      sql += ` AND o.status = $${params.length}`;
    }

    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(o.order_code) LIKE $${params.length} 
        OR LOWER(o.full_name) LIKE $${params.length} 
        OR o.phone LIKE $${params.length}
        OR LOWER(COALESCE(o.email, '')) LIKE $${params.length}
      )`;
    }

    sql += ` GROUP BY o.id ORDER BY o.created_at DESC;`;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật trạng thái đơn hàng hoặc ghi chú (chống IDOR + chống Mass Assignment)
export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const canUpdateAll = hasPermission(session, 'orders.update_status_all');
    const canUpdateOwnStore = hasPermission(session, 'orders.update_status_own_store');

    if (!canUpdateAll && !canUpdateOwnStore) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền cập nhật đơn hàng.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Chống Mass Assignment: Chỉ bóc tách các trường hợp lệ từ request body
    const body = await request.json();
    const { id, status, note, shipperName, shipperPhone } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Thiếu ID đơn hàng hợp lệ' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Trạng thái không hợp lệ: ${status}` },
        { status: 400 }
      );
    }

    // 1. Kiểm tra đơn hàng trong CSDL (Anti-IDOR)
    const currentOrderRes = await query(`SELECT * FROM orders WHERE id = $1;`, [id]);
    if (currentOrderRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    const currentOrder = currentOrderRes.rows[0];

    // Chống IDOR: STORE_STAFF sửa đơn ngoài cửa hàng của mình phải bị 403
    const storeScope = getStoreScope(session);
    if (storeScope && currentOrder.store_code && currentOrder.store_code !== storeScope) {
      return NextResponse.json(
        {
          success: false,
          error: `Bạn không có quyền sửa đơn hàng thuộc chi nhánh ${currentOrder.store_code}.`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Xác định cửa hàng xử lý đơn
    let targetStoreCode = currentOrder.store_code;
    if (!targetStoreCode) {
      targetStoreCode = storeScope || (session.username !== 'admin' ? session.username : 'NH');
    }

    let deductedNow = false;

    // Thực hiện trong Transaction an toàn
    const client = await pool.connect();
    let updatedOrder;

    try {
      await client.query('BEGIN;');

      if (status === 'CONFIRMED' || status === 'PROCESSING' || status === 'SHIPPING' || status === 'COMPLETED') {
        const { confirmStock } = await import('@/lib/inventory');
        const confirmRes = await confirmStock(id, targetStoreCode, client, session.username);
        deductedNow = !confirmRes.alreadyConfirmed;
      } else if (status === 'CANCELLED') {
        const { releaseStock } = await import('@/lib/inventory');
        await releaseStock(id, client, note || 'Hủy bởi Admin', session.username);
      }

      // Cập nhật thông tin đơn hàng
      const res = await client.query(
        `UPDATE orders SET
          status = COALESCE($2, status),
          note = COALESCE($3, note),
          store_code = COALESCE(store_code, $4)
         WHERE id = $1
         RETURNING *;`,
        [
          id,
          status || null,
          note !== undefined ? note : null,
          targetStoreCode,
        ]
      );
      updatedOrder = res.rows[0];

      await client.query('COMMIT;');
    } catch (txErr) {
      await client.query('ROLLBACK;');
      throw txErr;
    } finally {
      client.release();
    }

    // Ghi Audit Log cho hành động cập nhật trạng thái đơn hàng
    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: status === 'CANCELLED' ? 'ORDER_CANCEL' : 'ORDER_STATUS_UPDATE',
      entityType: 'ORDER',
      entityId: id,
      storeCode: targetStoreCode,
      beforeJson: {
        status: currentOrder.status,
        note: currentOrder.note,
        store_code: currentOrder.store_code,
      },
      afterJson: {
        status: updatedOrder.status,
        note: updatedOrder.note,
        store_code: updatedOrder.store_code,
      },
    });

    // Tự động kích hoạt gửi email trạng thái cho khách hàng (Non-blocking async)
    if (updatedOrder && updatedOrder.email && (status === 'SHIPPING' || status === 'COMPLETED')) {
      (async () => {
        try {
          const itemsRes = await query(`SELECT * FROM order_items WHERE order_id = $1;`, [id]);
          const emailItems = itemsRes.rows.map((it: any) => ({
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            unit: it.unit,
            thumbnail: it.thumbnail,
          }));

          const payload = {
            id: updatedOrder.id,
            orderCode: updatedOrder.order_code,
            fullName: updatedOrder.full_name,
            phone: updatedOrder.phone,
            email: updatedOrder.email,
            address: updatedOrder.address,
            province: updatedOrder.province,
            district: updatedOrder.district,
            ward: updatedOrder.ward,
            paymentMethod: updatedOrder.payment_method,
            shippingFee: updatedOrder.shipping_fee,
            subtotal: updatedOrder.subtotal,
            total: updatedOrder.total,
            note: updatedOrder.note,
            storeCode: updatedOrder.store_code,
            storeAddress: updatedOrder.store_address,
            items: emailItems,
          };

          if (status === 'SHIPPING') {
            await sendOrderEmail('ORDER_SHIPPING', payload, {
              shipperName: shipperName || 'Đội ngũ giao nhận Thái Sơn Foods',
              shipperPhone: shipperPhone || '028 6291 5024',
              storeAddress: updatedOrder.store_address,
            });
          } else if (status === 'COMPLETED') {
            await sendOrderEmail('ORDER_COMPLETED', payload);
          }
        } catch (mailErr) {
          console.error('[AdminOrders] Error triggering status email:', mailErr);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      deducted: deductedNow,
      storeCode: targetStoreCode,
      message:
        status === 'SHIPPING' && updatedOrder.email
          ? `Đã chuyển sang Giao hàng và gửi email thông báo đến ${updatedOrder.email}!`
          : status === 'COMPLETED' && updatedOrder.email
          ? `Đã hoàn tất đơn hàng và gửi email cảm ơn + cẩm nang bảo quản đến ${updatedOrder.email}!`
          : deductedNow
          ? `Đã xác nhận đơn hàng #${updatedOrder?.order_code || id} và trừ hàng hoá từ kho ${targetStoreCode} thành công!`
          : undefined,
    });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Hỗ trợ cú pháp PATCH tương đương PUT
export const PATCH = PUT;

// DELETE: Xóa đơn hàng (chỉ dành cho cấp quản trị cao nhất có orders.update_status_all)
export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!hasPermission(session, 'orders.update_status_all')) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên cấp cao mới có quyền xóa đơn hàng.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID đơn hàng' }, { status: 400 });
    }

    const currentOrderRes = await query(`SELECT * FROM orders WHERE id = $1;`, [id]);
    if (currentOrderRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    const currentOrder = currentOrderRes.rows[0];

    await query(`DELETE FROM order_items WHERE order_id = $1;`, [id]);
    await query(`DELETE FROM orders WHERE id = $1;`, [id]);

    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: 'ORDER_DELETE',
      entityType: 'ORDER',
      entityId: id,
      storeCode: currentOrder.store_code,
      beforeJson: currentOrder,
      afterJson: null,
    });

    return NextResponse.json({ success: true, message: 'Đã xóa đơn hàng thành công' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
