import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { categories as defaultCategories } from '@/data/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = `
      SELECT 
        c.id, 
        c.name, 
        c.name_en AS "nameEn", 
        c.slug,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', p.id, 
              'name', p.name, 
              'nameEn', p.name_en, 
              'slug', p.slug, 
              'price', p.price, 
              'thumbnail', p.thumbnail
            ) 
            ORDER BY p.is_featured DESC, p.created_at ASC
          )
          FROM products p 
          WHERE (p.category_id = c.id OR p.category_id = ('cat-' || c.slug) OR p.category_id = c.slug) 
            AND p.is_active = true
        ), '[]') AS items
      FROM categories c
      ORDER BY c.created_at ASC;
    `;

    const res = await query(sql);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: true, data: defaultCategories, fallback: true });
    }

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json({ success: true, data: defaultCategories, fallback: true });
  }
}
