import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ensureReviewsSchema, getAdminMemoryReviews } from '@/lib/reviews/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const productId = searchParams.get('productId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    await ensureReviewsSchema();
    const offset = (page - 1) * limit;

    let where = '1=1';
    const params: any[] = [];
    let pIdx = 1;

    if (status && status !== 'ALL') {
      where += ` AND status = $${pIdx}`;
      params.push(status);
      pIdx++;
    }

    if (productId) {
      where += ` AND product_id ILIKE $${pIdx}`;
      params.push(`%${productId}%`);
      pIdx++;
    }

    const countRes = await query(`SELECT count(*)::int as total FROM product_reviews WHERE ${where};`, params);
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await query(
      `SELECT 
        id, product_id AS "productId", user_id AS "userId", order_id AS "orderId",
        customer_name AS "customerName", customer_phone AS "customerPhone",
        variant_info AS "variantInfo", rating, title, comment, images,
        is_verified_buyer AS "isVerifiedBuyer", status, helpful_count AS "helpfulCount",
        admin_reply AS "adminReply", admin_replied_at AS "adminRepliedAt",
        created_at AS "createdAt"
       FROM product_reviews
       WHERE ${where}
       ORDER BY created_at DESC
       LIMIT $${pIdx} OFFSET $${pIdx + 1};`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      success: true,
      reviews: dataRes.rows,
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.warn('Notice in GET /api/admin/reviews (DB unavailable, falling back to memory):', error?.message);
    const memData = getAdminMemoryReviews({ status, productId, page, limit });
    return NextResponse.json({
      success: true,
      reviews: memData.reviews,
      total: memData.total,
      page,
      limit,
    });
  }
}
