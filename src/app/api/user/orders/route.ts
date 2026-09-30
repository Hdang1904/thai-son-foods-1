import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    const session = await getUserSession();

    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để xem đơn hàng' },
        { status: 401 }
      );
    }

    // Get user details to match by user_id or email
    const userRes = await query('SELECT email, phone FROM users WHERE id = $1 LIMIT 1;', [session.id]);
    const userEmail = userRes.rows[0]?.email || session.email;
    const userPhone = userRes.rows[0]?.phone || null;

    const sql = `
      SELECT 
        o.id,
        o.order_code,
        o.full_name,
        o.phone,
        o.email,
        o.province,
        o.district,
        o.ward,
        o.address,
        o.note,
        o.payment_method,
        o.shipping_fee,
        o.subtotal,
        o.total,
        o.status,
        o.created_at,
        COALESCE(json_agg(
          json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'name', oi.name,
            'price', oi.price,
            'quantity', oi.quantity,
            'unit', oi.unit,
            'thumbnail', oi.thumbnail
          )
        ) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = $1 
         OR (o.email IS NOT NULL AND LOWER(o.email) = LOWER($2))
         ${userPhone ? 'OR (o.phone IS NOT NULL AND o.phone = $3)' : ''}
      GROUP BY o.id
      ORDER BY o.created_at DESC;
    `;

    const params = userPhone ? [session.id, userEmail, userPhone] : [session.id, userEmail];
    const res = await query(sql, params);

    return NextResponse.json({
      success: true,
      orders: res.rows,
    });
  } catch (error: any) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi tải đơn hàng: ' + (error.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}
