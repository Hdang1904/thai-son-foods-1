import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { calculateNextDeliveryDate } from '@/lib/membership/service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || 'staging_test_cron_secret_1234567890';
    const authHeader = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');

    if (authHeader !== cronSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized CRON execution' }, { status: 401 });
    }

    const client = await pool.connect();
    const generatedOrderCodes: string[] = [];

    try {
      // Tìm các lịch giao hàng vào ngày mai (hoặc hôm nay nếu chưa sinh)
      const sqlSchedules = `
        SELECT 
          ss.id AS schedule_id, ss.scheduled_date, ss.subscription_id,
          s.id AS sub_id, s.subscription_code, s.user_id, s.delivery_frequency,
          s.preferred_day_of_week, s.preferred_time_slot, s.recipient_name,
          s.recipient_phone, s.shipping_address, s.province, s.district,
          s.ward, s.store_code, s.payment_method
        FROM subscription_schedules ss
        JOIN subscriptions s ON ss.subscription_id = s.id
        WHERE ss.status IN ('SCHEDULED', 'REMINDER_SENT')
          AND ss.scheduled_date::date <= (CURRENT_DATE + INTERVAL '1 day')::date
          AND s.status = 'ACTIVE'
        ORDER BY ss.scheduled_date ASC
        LIMIT 50;
      `;

      const schedulesRes = await client.query(sqlSchedules);
      const schedules = schedulesRes.rows;

      for (const sc of schedules) {
        await client.query('BEGIN;');

        // 1. Lấy danh sách sản phẩm của hợp đồng
        const itemsRes = await client.query(
          `SELECT product_id, variant_id, name, unit, final_price, quantity 
           FROM subscription_items 
           WHERE subscription_id = $1;`,
          [sc.sub_id]
        );
        const subItems = itemsRes.rows;
        if (subItems.length === 0) {
          await client.query('ROLLBACK;');
          continue;
        }

        // 2. Tính subtotal
        let subtotal = 0;
        for (const it of subItems) {
          subtotal += it.final_price * it.quantity;
        }
        const shippingFee = 0; // Đơn Subscribe & Save luôn miễn phí ship
        const total = subtotal + shippingFee;

        // 3. Tạo đơn hàng mới trong bảng orders
        const orderId = `ord_sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        const orderCode = `TSF-SUB-${Date.now().toString().slice(-4)}${crypto.randomInt(100, 999)}`;

        const insertOrderSql = `
          INSERT INTO orders (
            id, order_code, user_id, full_name, phone, address, province, district, ward,
            store_code, payment_method, status, subtotal, shipping_fee, total,
            order_channel, note, inventory_deducted
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'PENDING', $12, $13, $14,
            'SUBSCRIBE_AND_SAVE', $15, false
          );
        `;

        await client.query(insertOrderSql, [
          orderId,
          orderCode,
          sc.user_id,
          sc.recipient_name,
          sc.recipient_phone,
          sc.shipping_address,
          sc.province,
          sc.district,
          sc.ward,
          sc.store_code || 'NH',
          sc.payment_method || 'vietqr',
          subtotal,
          shippingFee,
          total,
          `Đơn giao tự động định kỳ theo hợp đồng #${sc.subscription_code} (Khung giờ: ${sc.preferred_time_slot})`,
        ]);

        // 4. Lưu từng món vào bảng order_items
        for (const it of subItems) {
          const orderItemId = `oi_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
          await client.query(
            `INSERT INTO order_items (
              id, order_id, product_id, name, price, quantity, unit,
              canonical_product_id, bottle_multiplier, total_bottles
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 7, $9);`,
            [
              orderItemId,
              orderId,
              it.product_id,
              it.name,
              it.final_price,
              it.quantity,
              it.unit,
              it.product_id,
              it.quantity * 7,
            ]
          );
        }

        // 5. Cập nhật trạng thái của kỳ giao
        await client.query(
          `UPDATE subscription_schedules 
           SET status = 'ORDER_GENERATED', generated_order_id = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1;`,
          [sc.schedule_id, orderId]
        );

        // 6. Tính ngày giao kế tiếp của chu kỳ mới
        const nextDate = calculateNextDeliveryDate(
          new Date(sc.scheduled_date),
          sc.delivery_frequency,
          sc.preferred_day_of_week
        );

        await client.query(
          `UPDATE subscriptions 
           SET last_delivered_date = $2, next_delivery_date = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1;`,
          [sc.sub_id, sc.scheduled_date, nextDate]
        );

        // 7. Tạo bản ghi schedule mới cho chu kỳ tiếp theo
        const newScheduleId = `sc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        await client.query(
          `INSERT INTO subscription_schedules (id, subscription_id, scheduled_date, status)
           VALUES ($1, $2, $3, 'SCHEDULED')
           ON CONFLICT (subscription_id, scheduled_date) DO NOTHING;`,
          [newScheduleId, sc.sub_id, nextDate]
        );

        await client.query('COMMIT;');
        generatedOrderCodes.push(orderCode);
      }
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: `Đã tự động tạo thành công ${generatedOrderCodes.length} đơn hàng định kỳ.`,
      ordersCount: generatedOrderCodes.length,
      generatedOrderCodes,
    });
  } catch (error: any) {
    console.error('Error in cron generate-orders:', error);
    return NextResponse.json({ success: false, error: 'Lỗi thực thi cron sinh đơn định kỳ.' }, { status: 500 });
  }
}
