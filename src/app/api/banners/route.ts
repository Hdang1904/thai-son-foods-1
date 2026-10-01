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

    // Fallback nếu DB trống
    if (res.rows.length === 0) {
      if (placement === 'hero') {
        return NextResponse.json({ success: true, data: defaultBanners });
      }
      if (placement === 'scroll') {
        return NextResponse.json({ success: true, data: defaultScrollBanners });
      }
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
