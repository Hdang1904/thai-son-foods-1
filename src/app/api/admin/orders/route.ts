import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
            'thumbnail', oi.thumbnail
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

    const res = await query(
      `UPDATE orders SET
        status = COALESCE($2, status),
        note = COALESCE($3, note),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *;`,
      [id, status || null, note !== undefined ? note : null]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
