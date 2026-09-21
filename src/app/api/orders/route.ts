import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderCode,
      fullName,
      phone,
      email,
      province,
      district,
      ward,
      address,
      note,
      paymentMethod,
      shippingFee,
      subtotal,
      total,
      items,
    } = body;

    try {
      // Ensure tables exist
      await initDatabase();

      const orderId = `ord_${Date.now()}`;
      await query(
        `INSERT INTO orders (id, order_code, full_name, phone, email, province, district, ward, address, note, payment_method, shipping_fee, subtotal, total, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          orderId,
          orderCode,
          fullName,
          phone,
          email || null,
          province,
          district,
          ward,
          address,
          note || null,
          paymentMethod || 'cod',
          shippingFee || 0,
          subtotal,
          total,
          'PENDING',
        ]
      );

      if (Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const itemId = `item_${Date.now()}_${i}`;
          await query(
            `INSERT INTO order_items (id, order_id, product_id, name, price, quantity, unit, thumbnail)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              itemId,
              orderId,
              item.productId || null,
              item.name,
              item.price,
              item.quantity,
              item.unit || '1 chai',
              item.thumbnail || null,
            ]
          );
        }
      }

      return NextResponse.json({
        success: true,
        orderId,
        orderCode,
        savedToPostgres: true,
      });
    } catch (dbError: any) {
      console.warn('PostgreSQL connection warning (pgAdmin / WebTSF):', dbError.message);
      return NextResponse.json({
        success: true,
        orderCode,
        savedToPostgres: false,
        message: dbError.message,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
