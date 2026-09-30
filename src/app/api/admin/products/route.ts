import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { syncProductToStaticFile } from '@/lib/products-file-sync';

export const dynamic = 'force-dynamic';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// GET: Lấy danh sách sản phẩm (hỗ trợ tìm kiếm, lọc theo category, trạng thái)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const filter = searchParams.get('filter') || 'ALL'; // ALL, ACTIVE, INACTIVE, FEATURED, BEST_SELLER

    let sql = `
      SELECT 
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        COALESCE(json_agg(
          CASE WHEN pv.id IS NOT NULL 
          THEN json_build_object('id', pv.id, 'name', pv.name, 'quantity', pv.quantity, 'price', pv.price, 'unit', pv.unit)
          ELSE NULL END
        ) FILTER (WHERE pv.id IS NOT NULL), '[]') AS variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(p.name) LIKE $${params.length} OR LOWER(COALESCE(p.sku, '')) LIKE $${params.length})`;
    }

    if (categoryId && categoryId !== 'ALL') {
      params.push(categoryId);
      sql += ` AND p.category_id = $${params.length}`;
    }

    if (filter === 'ACTIVE') {
      sql += ` AND p.is_active = true`;
    } else if (filter === 'INACTIVE') {
      sql += ` AND p.is_active = false`;
    } else if (filter === 'FEATURED') {
      sql += ` AND p.is_featured = true`;
    } else if (filter === 'BEST_SELLER') {
      sql += ` AND p.is_best_seller = true`;
    }

    sql += ` GROUP BY p.id, c.name, c.slug ORDER BY p.created_at DESC;`;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching admin products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Thêm mới sản phẩm
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      sku,
      short_description,
      description,
      price,
      unit,
      thumbnail,
      category_id,
      is_featured = false,
      is_new = false,
      is_best_seller = false,
      is_active = true,
      variants = [],
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Tên sản phẩm và giá là bắt buộc' },
        { status: 400 }
      );
    }

    const baseSlug = slugify(name);
    const uniqueSuffix = Date.now().toString().slice(-4);
    const slug = `${baseSlug}-${uniqueSuffix}`;
    const id = `prod_${Date.now()}`;

    const insertSql = `
      INSERT INTO products (
        id, slug, name, sku, short_description, description, price, unit, thumbnail,
        category_id, is_featured, is_new, is_best_seller, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const values = [
      id,
      slug,
      name,
      sku || `TSF-${Date.now().toString().slice(-4)}`,
      short_description || '',
      description || '',
      parseInt(price, 10),
      unit || '1 chai',
      thumbnail || '/images/products/sua-bap-nep.png',
      category_id || null,
      Boolean(is_featured),
      Boolean(is_new),
      Boolean(is_best_seller),
      Boolean(is_active),
    ];

    const result = await query(insertSql, values);
    const createdProduct = result.rows[0];

    // Thêm variants nếu có
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (v.name && v.price) {
          const varId = `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await query(
            `INSERT INTO product_variants (id, product_id, name, quantity, price, unit)
             VALUES ($1, $2, $3, $4, $5, $6);`,
            [varId, id, v.name, parseInt(v.quantity || 1, 10), parseInt(v.price, 10), v.unit || 'chai']
          );
        }
      }
    }

    return NextResponse.json({ success: true, data: createdProduct });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật sản phẩm
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      sku,
      short_description,
      description,
      price,
      unit,
      thumbnail,
      category_id,
      is_featured,
      is_new,
      is_best_seller,
      is_active,
      variants,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID sản phẩm' }, { status: 400 });
    }

    const updateSql = `
      UPDATE products SET
        name = COALESCE($2, name),
        sku = COALESCE($3, sku),
        short_description = COALESCE($4, short_description),
        description = COALESCE($5, description),
        price = COALESCE($6, price),
        unit = COALESCE($7, unit),
        thumbnail = COALESCE($8, thumbnail),
        category_id = $9,
        is_featured = COALESCE($10, is_featured),
        is_new = COALESCE($11, is_new),
        is_best_seller = COALESCE($12, is_best_seller),
        is_active = COALESCE($13, is_active)
      WHERE id = $1
      RETURNING *;
    `;

    const values = [
      id,
      name,
      sku,
      short_description,
      description,
      price !== undefined ? parseInt(price, 10) : null,
      unit,
      thumbnail,
      category_id || null,
      is_featured !== undefined ? Boolean(is_featured) : null,
      is_new !== undefined ? Boolean(is_new) : null,
      is_best_seller !== undefined ? Boolean(is_best_seller) : null,
      is_active !== undefined ? Boolean(is_active) : null,
    ];

    const result = await query(updateSql, values);

    // Cập nhật variants nếu có truyền vào
    if (Array.isArray(variants)) {
      await query(`DELETE FROM product_variants WHERE product_id = $1;`, [id]);
      for (const v of variants) {
        if (v.name && v.price) {
          const varId = `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await query(
            `INSERT INTO product_variants (id, product_id, name, quantity, price, unit)
             VALUES ($1, $2, $3, $4, $5, $6);`,
            [varId, id, v.name, parseInt(v.quantity || 1, 10), parseInt(v.price, 10), v.unit || 'chai']
          );
        }
      }
    }

    const updatedProd = result.rows[0];

    // Tự động đồng bộ vào file src/data/products.ts để toàn bộ website lập tức hiển thị thông tin mới
    syncProductToStaticFile({
      id: updatedProd?.id || id,
      sku: updatedProd?.sku || sku,
      slug: updatedProd?.slug,
      name: updatedProd?.name || name,
      price: updatedProd?.price !== undefined ? Number(updatedProd.price) : price,
      unit: updatedProd?.unit || unit,
      short_description: updatedProd?.short_description || short_description,
      description: updatedProd?.description || description,
      thumbnail: updatedProd?.thumbnail || thumbnail,
      category_id: updatedProd?.category_id || category_id,
      is_active: updatedProd?.is_active ?? is_active,
      is_featured: updatedProd?.is_featured ?? is_featured,
      is_best_seller: updatedProd?.is_best_seller ?? is_best_seller,
      is_new: updatedProd?.is_new ?? is_new,
    });

    return NextResponse.json({ success: true, data: updatedProd });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Xóa sản phẩm
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID sản phẩm' }, { status: 400 });
    }

    // Set null trong order_items để không vi phạm ràng buộc khóa ngoại
    await query(`UPDATE order_items SET product_id = NULL WHERE product_id = $1;`, [id]);
    await query(`DELETE FROM product_variants WHERE product_id = $1;`, [id]);
    await query(`DELETE FROM products WHERE id = $1;`, [id]);

    return NextResponse.json({ success: true, message: 'Đã xóa sản phẩm thành công' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
