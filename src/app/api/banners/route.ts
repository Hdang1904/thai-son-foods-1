import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { banners as defaultBanners } from '@/data/banners';
import { defaultScrollBanners } from '@/components/product/ScrollBannerShowcase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement'); // 'hero' | 'scroll' | null (all)

    let sql = `
      SELECT id, slug, title, subtitle, tag, image, mobile_image, alt, link, placement, sort_order
      FROM banners
      WHERE is_active = true
    `;
    const params: any[] = [];

    if (placement) {
      params.push(placement);
      sql += ` AND placement = $${params.length}`;
    }

    sql += ` ORDER BY sort_order ASC, created_at ASC;`;

    const res = await query(sql, params);

    // Chỉ fallback nếu DB thực sự trống (chưa có bản ghi nào được cấu hình)
    if (res.rows.length === 0) {
      let countSql = `SELECT COUNT(*) AS total FROM banners`;
      const countParams: any[] = [];
      if (placement) {
        countParams.push(placement);
        countSql += ` WHERE placement = $1`;
      }
      const countRes = await query(countSql, countParams);
      const totalInDb = Number(countRes.rows[0]?.total || 0);

      if (totalInDb === 0) {
        if (placement === 'hero') {
          return NextResponse.json({ success: true, data: defaultBanners });
        }
        if (placement === 'scroll') {
          return NextResponse.json({ success: true, data: defaultScrollBanners });
        }
      }
      // Nếu admin đã cấu hình banner nhưng chủ động tắt hiển thị (is_active = false)
      // thì trả về mảng rỗng để website ẩn đi theo đúng ý admin.
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching public banners:', error);
    // Fallback gracefully to static banners
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');
    const fallback = placement === 'scroll' ? defaultScrollBanners : defaultBanners;
    return NextResponse.json({ success: true, data: fallback, fallback: true });
  }
}
