import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

// GET: Lấy danh sách tất cả combo
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'ALL'; // ALL, ACTIVE, INACTIVE, FEATURED, BEST_SELLER

    let sql = `
      SELECT 
        c.*,
        COALESCE(json_agg(
          CASE WHEN ci.id IS NOT NULL 
          THEN json_build_object('id', ci.id, 'product_id', ci.product_id, 'quantity', ci.quantity, 'unit', ci.unit)
          ELSE NULL END
        ) FILTER (WHERE ci.id IS NOT NULL), '[]') AS items
      FROM combos c
      LEFT JOIN combo_items ci ON ci.combo_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(c.name) LIKE $${params.length} OR LOWER(COALESCE(c.description, '')) LIKE $${params.length})`;
    }

    if (filter === 'ACTIVE') {
      sql += ` AND c.is_active = true`;
    } else if (filter === 'INACTIVE') {
      sql += ` AND c.is_active = false`;
    } else if (filter === 'FEATURED') {
      sql += ` AND c.is_featured = true`;
    } else if (filter === 'BEST_SELLER') {
      sql += ` AND c.is_best_seller = true`;
    }

    sql += ` GROUP BY c.id ORDER BY c.created_at DESC;`;

    const res = await query(sql, params);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching admin combos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Thêm mới combo
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      original_price,
      sale_price,
      total_items = 10,
      discount = 0,
      image,
      is_featured = true,
      is_best_seller = false,
      is_active = true,
      items = [],
    } = body;

    if (!name || sale_price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Tên combo và giá bán là bắt buộc' },
        { status: 400 }
      );
    }

    const id = `combo_${Date.now()}`;
    const slug = slugify(name);

    await query(
      `INSERT INTO combos (
        id, slug, name, description, original_price, sale_price,
        total_items, discount, image, is_featured, is_best_seller, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
      [
        id,
        slug,
        name,
        description || null,
        original_price || sale_price,
        sale_price,
        total_items,
        discount,
        image || '/images/combos/combo-1.jpg',
        is_featured,
        is_best_seller,
        is_active,
      ]
    );

    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await query(
          `INSERT INTO combo_items (id, combo_id, product_id, quantity, unit)
           VALUES ($1, $2, $3, $4, $5);`,
          [`${id}_item_${i + 1}`, id, it.product_id, it.quantity || 1, it.unit || 'chai']
        );
      }
    }

    return NextResponse.json({ success: true, data: { id, slug, name } });
  } catch (error: any) {
    console.error('Error creating admin combo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật combo
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      original_price,
      sale_price,
      total_items,
      discount,
      image,
      is_featured,
      is_best_seller,
      is_active,
      items,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID combo' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [id];

    if (name !== undefined) {
      params.push(name);
      updates.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description);
      updates.push(`description = $${params.length}`);
    }
    if (original_price !== undefined) {
      params.push(original_price);
      updates.push(`original_price = $${params.length}`);
    }
    if (sale_price !== undefined) {
      params.push(sale_price);
      updates.push(`sale_price = $${params.length}`);
    }
    if (total_items !== undefined) {
      params.push(total_items);
      updates.push(`total_items = $${params.length}`);
    }
    if (discount !== undefined) {
      params.push(discount);
      updates.push(`discount = $${params.length}`);
    }
    if (image !== undefined) {
      params.push(image);
      updates.push(`image = $${params.length}`);
    }
    if (is_featured !== undefined) {
      params.push(is_featured);
      updates.push(`is_featured = $${params.length}`);
    }
    if (is_best_seller !== undefined) {
      params.push(is_best_seller);
      updates.push(`is_best_seller = $${params.length}`);
    }
    if (is_active !== undefined) {
      params.push(is_active);
      updates.push(`is_active = $${params.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length > 0) {
      await query(`UPDATE combos SET ${updates.join(', ')} WHERE id = $1;`, params);
    }

    if (Array.isArray(items)) {
      await query(`DELETE FROM combo_items WHERE combo_id = $1;`, [id]);
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await query(
          `INSERT INTO combo_items (id, combo_id, product_id, quantity, unit)
           VALUES ($1, $2, $3, $4, $5);`,
          [`${id}_item_${i + 1}`, id, it.product_id, it.quantity || 1, it.unit || 'chai']
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Cập nhật combo thành công' });
  } catch (error: any) {
    console.error('Error updating admin combo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Xóa combo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID combo' }, { status: 400 });
    }

    await query(`DELETE FROM combos WHERE id = $1;`, [id]);
    return NextResponse.json({ success: true, message: 'Đã xóa combo thành công' });
  } catch (error: any) {
    console.error('Error deleting admin combo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
