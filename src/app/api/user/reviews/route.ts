import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { ensureReviewsSchema, normalizePhoneNumber } from '@/lib/reviews/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureReviewsSchema();
    const session = await getUserSession();

    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để xem đánh giá' },
        { status: 401 }
      );
    }

    const userRes = await query('SELECT phone FROM users WHERE id = $1 LIMIT 1;', [session.id]);
    const userPhone = normalizePhoneNumber(userRes.rows[0]?.phone || session.phone || '');

    const params: any[] = [session.id];
    let where = 'user_id = $1';
    if (userPhone) {
      params.push(userPhone);
      where += ` OR customer_phone = $2`;
    }

    const sql = `
      SELECT 
        id,
        product_id AS "productId",
        variant_info AS "variantInfo",
        rating,
        title,
        comment,
        is_verified_buyer AS "isVerifiedBuyer",
        status,
        helpful_count AS "helpfulCount",
        admin_reply AS "adminReply",
        admin_replied_at AS "adminRepliedAt",
        created_at AS "createdAt"
      FROM product_reviews
      WHERE ${where}
      ORDER BY created_at DESC;
    `;

    const res = await query(sql, params);

    return NextResponse.json({
      success: true,
      reviews: res.rows,
    });
  } catch (error: any) {
    console.error('Error in GET /api/user/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi tải danh sách đánh giá: ' + (error?.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}
