import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { brandSlides as defaultBrandSlides } from '@/data/brand-showcase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, tag, title, description, image, cta_text AS "ctaText", cta_link AS "ctaLink", sort_order AS "sortOrder"
       FROM brand_slides
       WHERE is_active = true
       ORDER BY sort_order ASC, created_at ASC;`
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ success: true, data: defaultBrandSlides });
    }

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching public brand slides:', error);
    return NextResponse.json({ success: true, data: defaultBrandSlides, fallback: true });
  }
}
