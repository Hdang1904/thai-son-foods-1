import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendOrderEmail } from '@/lib/email/service';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách đơn hàng hoặc chi tiết 1 đơn hàng
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const status = searchParams.get('status') || 'ALL';
    const search = searchParams.get('q') || '';

    // Nếu yêu cầu chi tiết 1 đơn hàng
    if (orderId) {
      const orderRes = await query(`SELECT * FROM orders WHERE id = $1;`, [orderId]);
      if (orderRes.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
      }

      const itemsRes = await query(
        `SELECT * FROM order_items WHERE order_id = $1 ORDER BY id ASC;`,
        [orderId]
      );

      return NextResponse.json({
        success: true,
        order: {
          ...orderRes.rows[0],
          items: itemsRes.rows,
        },
      });
    }

    // Lấy danh sách đơn hàng có kèm số lượng món và món đầu tiên
    let sql = `
      SELECT 
        o.*,
        COUNT(oi.id) AS item_count,
        COALESCE(json_agg(
          json_build_object(
            'id', oi.id,
            'name', oi.name,
            'price', oi.price,
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

// PUT: Cập nhật trạng thái đơn hàng hoặc ghi chú
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, note } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID đơn hàng' }, { status: 400 });
    }

    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Trạng thái không hợp lệ: ${status}` },
        { status: 400 }
      );
    }

    // Lấy thông tin đơn hàng hiện tại
    const currentOrderRes = await query(`SELECT * FROM orders WHERE id = $1;`, [id]);
    if (currentOrderRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    const currentOrder = currentOrderRes.rows[0];

    // Lấy session admin (nếu có)
    let adminUsername = 'admin';
    try {
      const { getAdminSession } = await import('@/lib/auth');
      const session = await getAdminSession();
      if (session) adminUsername = session.username;
    } catch {
      // ignore
    }

    // Xác định cửa hàng xử lý đơn
    let targetStoreCode = currentOrder.store_code;
    if (!targetStoreCode) {
      targetStoreCode = adminUsername && adminUsername !== 'admin' ? adminUsername : 'NH';
    }

    let deductedNow = false;

    // Thực hiện trong Transaction an toàn
    const { pool } = await import('@/lib/db');
    const client = await pool.connect();
    let updatedOrder;

    try {
      await client.query('BEGIN;');

      if (status === 'CONFIRMED' || status === 'PROCESSING' || status === 'SHIPPING' || status === 'COMPLETED') {
        const { confirmStock } = await import('@/lib/inventory');
        const confirmRes = await confirmStock(id, targetStoreCode, client, adminUsername);
        deductedNow = !confirmRes.alreadyConfirmed;
      } else if (status === 'CANCELLED') {
        const { releaseStock } = await import('@/lib/inventory');
        await releaseStock(id, client, note || 'Hủy bởi Admin', adminUsername);
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
              shipperName: body.shipperName || 'Đội ngũ giao nhận Thái Sơn Foods',
              shipperPhone: body.shipperPhone || '0961 888 888',
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

// DELETE: Xóa đơn hàng
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID đơn hàng' }, { status: 400 });
    }

    await query(`DELETE FROM order_items WHERE order_id = $1;`, [id]);
    await query(`DELETE FROM orders WHERE id = $1;`, [id]);

    return NextResponse.json({ success: true, message: 'Đã xóa đơn hàng thành công' });
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
