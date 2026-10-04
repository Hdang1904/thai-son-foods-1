import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { products as defaultProducts } from '@/data/products';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');

    let sql = `
      SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE((
          SELECT json_agg(
            json_build_object('id', pv.id, 'name', pv.name, 'quantity', pv.quantity, 'price', pv.price, 'unit', pv.unit)
            ORDER BY pv.quantity ASC
          )
          FROM product_variants pv WHERE pv.product_id = p.id
        ), '[]') AS variants,
        COALESCE((
          SELECT json_agg(
            json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'sortOrder', pi.sort_order, 'isThumbnail', (pi.image_type = 'thumbnail'))
            ORDER BY pi.sort_order ASC
          )
          FROM product_images pi WHERE pi.product_id = p.id AND pi.is_active = true
        ), '[]') AS images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      sql += ` AND (p.category_id = $${params.length} OR c.slug = $${params.length} OR p.category_id = ('cat-' || $${params.length}))`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(p.slug) LIKE $${params.length} OR LOWER(p.sku) LIKE $${params.length})`;
    }

    if (featured === 'true') {
      sql += ` AND p.is_featured = true`;
    }

    sql += ` ORDER BY p.is_featured DESC, p.created_at ASC;`;

    const res = await query(sql, params);

    // Nếu DB hoàn toàn chưa có dữ liệu sản phẩm, fallback sang static data
    if (res.rows.length === 0) {
      const countRes = await query(`SELECT COUNT(*) AS total FROM products;`);
      const totalInDb = Number(countRes.rows[0]?.total || 0);
      if (totalInDb === 0) {
        let filtered = defaultProducts.filter((p) => p.isActive);
        if (category) filtered = filtered.filter((p) => p.categoryId === category);
        if (search) {
          const s = search.toLowerCase();
          filtered = filtered.filter((p) => p.name.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s));
        }
        return NextResponse.json({ success: true, data: filtered, fallback: true });
      }
      return NextResponse.json({ success: true, data: [] });
    }

    // Kết hợp thông tin động từ DB với các assets tĩnh (video, highlights) từ products.ts
    const mappedProducts: Product[] = res.rows.map((row: any) => {
      const base = defaultProducts.find((p) => p.id === row.id || p.slug === row.slug || p.sku === row.sku) || {
        id: row.id,
        name: row.name,
        nameEn: row.name_en || row.name,
        slug: row.slug,
        sku: row.sku || row.id,
        price: Number(row.price) || 0,
        unit: row.unit || 'lốc',
        categoryId: (row.category_id ? row.category_id.replace(/^cat-/, '') : 'sua-hat'),
        thumbnail: row.thumbnail || '/images/products/sua-bap-nep.png',
        images: [{ id: 'img-1', url: row.thumbnail || '/images/products/sua-bap-nep.png', alt: row.name, sortOrder: 1 }],
        shortDescription: row.short_description || '',
        description: row.description || '',
        isActive: Boolean(row.is_active),
        isFeatured: Boolean(row.is_featured),
        isBestSeller: Boolean(row.is_best_seller),
        isNew: Boolean(row.is_new),
        variants: [],
      };

      const activeImages = Array.isArray(row.images) && row.images.length > 0 ? row.images : [];
      const thumbFromImages = activeImages.find((img: any) => img.isThumbnail)?.url || activeImages[0]?.url;
      const finalThumbnail = row.thumbnail || thumbFromImages || base.thumbnail;

      return {
        ...base,
        name: row.name || base.name,
        nameEn: row.name_en || base.nameEn,
        sku: row.sku || base.sku,
        price: Number(row.price) || base.price,
        unit: row.unit || base.unit,
        shortDescription: row.short_description || base.shortDescription,
        description: row.description || base.description,
        thumbnail: finalThumbnail,
        categoryId: (row.category_id ? row.category_id.replace(/^cat-/, '') : base.categoryId),
        isFeatured: row.is_featured !== null ? Boolean(row.is_featured) : base.isFeatured,
        isNew: row.is_new !== null ? Boolean(row.is_new) : base.isNew,
        isBestSeller: row.is_best_seller !== null ? Boolean(row.is_best_seller) : base.isBestSeller,
        isActive: Boolean(row.is_active),
        variants: (Array.isArray(row.variants) && row.variants.length > 0)
          ? row.variants.map((v: any) => ({
              id: v.id,
              name: v.name,
              quantity: Number(v.quantity) || 1,
              price: Number(v.price) || 0,
              unit: v.unit || 'lốc',
            }))
          : base.variants,
      };
    });

    return NextResponse.json({ success: true, data: mappedProducts });
  } catch (error: any) {
    console.error('Error fetching public products:', error);
    return NextResponse.json({ success: true, data: defaultProducts.filter((p) => p.isActive), fallback: true });
  }
}
