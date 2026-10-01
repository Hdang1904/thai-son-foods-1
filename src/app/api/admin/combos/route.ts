import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

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

// GET: Lấy danh sách tất cả combo (lọc bỏ cost_price nếu không có quyền)
export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!hasPermission(session, 'combos.view')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xem danh sách combo.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const canViewCostPrice = hasPermission(session, 'cost_price.view');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'ALL'; // ALL, ACTIVE, INACTIVE, FEATURED, BEST_SELLER

    let sql = `
      SELECT 
        c.*,
        COALESCE((
          SELECT json_agg(
            json_build_object('id', ci.id, 'product_id', ci.product_id, 'quantity', ci.quantity, 'unit', ci.unit)
          ) FROM combo_items ci WHERE ci.combo_id = c.id
        ), '[]') AS items,
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'id', cimg.id,
              'url', cimg.url,
              'alt', cimg.alt,
              'sortOrder', cimg.sort_order,
              'sort_order', cimg.sort_order,
              'imageType', cimg.image_type,
              'image_type', cimg.image_type,
              'isActive', cimg.is_active,
              'is_active', cimg.is_active
            )
            ORDER BY cimg.sort_order ASC, cimg.created_at ASC
          ) FROM combo_images cimg WHERE cimg.combo_id = c.id
        ), '[]') AS images
      FROM combos c
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

    sql += ` ORDER BY c.created_at DESC;`;

    const res = await query(sql, params);

    // Lọc bỏ cost_price ở server nếu không có cost_price.view
    const sanitizedCombos = res.rows.map(row => {
      if (!canViewCostPrice) {
        const { cost_price, ...safeData } = row;
        return safeData;
      }
      return row;
    });

    return NextResponse.json({ success: true, data: sanitizedCombos });
  } catch (error: any) {
    console.error('Error fetching admin combos:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Thêm mới combo
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!hasPermission(session, 'combos.manage')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền tạo combo.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

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

    const canEditCostPrice = hasPermission(session, 'cost_price.edit');
    const costPriceVal = canEditCostPrice && body.cost_price !== undefined
      ? Math.max(0, parseInt(body.cost_price, 10) || 0)
      : 0;

    await query(
      `INSERT INTO combos (
        id, slug, name, description, original_price, sale_price,
        total_items, discount, image, is_featured, is_best_seller, is_active, cost_price
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13);`,
      [
        id,
        slug,
        String(name).trim(),
        description ? String(description) : null,
        parseInt(original_price || sale_price, 10),
        parseInt(sale_price, 10),
        parseInt(total_items || 10, 10),
        parseInt(discount || 0, 10),
        image ? String(image) : '/images/combos/combo-1.jpg',
        Boolean(is_featured),
        Boolean(is_best_seller),
        Boolean(is_active),
        costPriceVal,
      ]
    );

    if (Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        await query(
          `INSERT INTO combo_items (id, combo_id, product_id, quantity, unit)
           VALUES ($1, $2, $3, $4, $5);`,
          [`${id}_item_${i + 1}`, id, String(it.product_id), parseInt(it.quantity || 1, 10), it.unit ? String(it.unit) : 'chai']
        );
      }
    }

    if (Array.isArray(body.images) && body.images.length > 0) {
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        if (img && (img.url || typeof img === 'string')) {
          const imgUrl = typeof img === 'string' ? img : img.url;
          const imgAlt = typeof img === 'object' && img.alt ? img.alt : name;
          const sortOrder = typeof img === 'object' && img.sortOrder !== undefined ? img.sortOrder : i + 1;
          const imgId = `cimg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await query(
            `INSERT INTO combo_images (id, combo_id, url, alt, sort_order, image_type, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true);`,
            [imgId, id, imgUrl, imgAlt, sortOrder, 'gallery']
          );
        }
      }
    }

    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: 'COMBO_CREATE',
      entityType: 'COMBO',
      entityId: id,
      afterJson: { id, slug, name, sale_price },
    });

    return NextResponse.json({ success: true, data: { id, slug, name } });
  } catch (error: any) {
    console.error('Error creating admin combo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật combo
export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

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

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Thiếu ID combo' }, { status: 400 });
    }

    const currRes = await query(`SELECT * FROM combos WHERE id = $1;`, [id]);
    if (currRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy combo' }, { status: 404 });
    }
    const currentCombo = currRes.rows[0];

    // Kiểm tra quyền sửa giá bán
    const isPriceChanging = sale_price !== undefined && parseInt(sale_price, 10) !== currentCombo.sale_price;
    if (isPriceChanging && !hasPermission(session, 'products.manage_price')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền chỉnh sửa giá combo.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Kiểm tra quyền sửa giá vốn
    const isCostPriceChanging = body.cost_price !== undefined && parseInt(body.cost_price, 10) !== currentCombo.cost_price;
    if (isCostPriceChanging && !hasPermission(session, 'cost_price.edit')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền chỉnh sửa giá vốn combo.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (!hasPermission(session, 'combos.manage')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền chỉnh sửa combo.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const params: any[] = [id];

    if (name !== undefined) {
      params.push(String(name).trim());
      updates.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description ? String(description) : null);
      updates.push(`description = $${params.length}`);
    }
    if (original_price !== undefined) {
      params.push(parseInt(original_price, 10));
      updates.push(`original_price = $${params.length}`);
    }
    if (sale_price !== undefined) {
      params.push(parseInt(sale_price, 10));
      updates.push(`sale_price = $${params.length}`);
    }
    if (total_items !== undefined) {
      params.push(parseInt(total_items, 10));
      updates.push(`total_items = $${params.length}`);
    }
    if (discount !== undefined) {
      params.push(parseInt(discount, 10));
      updates.push(`discount = $${params.length}`);
    }
    if (image !== undefined) {
      params.push(String(image));
      updates.push(`image = $${params.length}`);
    }
    if (is_featured !== undefined) {
      params.push(Boolean(is_featured));
      updates.push(`is_featured = $${params.length}`);
    }
    if (is_best_seller !== undefined) {
      params.push(Boolean(is_best_seller));
      updates.push(`is_best_seller = $${params.length}`);
    }
    if (is_active !== undefined) {
      params.push(Boolean(is_active));
      updates.push(`is_active = $${params.length}`);
    }
    if (body.cost_price !== undefined && hasPermission(session, 'cost_price.edit')) {
      params.push(parseInt(body.cost_price, 10));
      updates.push(`cost_price = $${params.length}`);
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
          [`${id}_item_${i + 1}`, id, String(it.product_id), parseInt(it.quantity || 1, 10), it.unit ? String(it.unit) : 'chai']
        );
      }
    }

    if (Array.isArray(body.images)) {
      await query(`DELETE FROM combo_images WHERE combo_id = $1;`, [id]);
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        if (img && (img.url || typeof img === 'string')) {
          const imgUrl = typeof img === 'string' ? img : img.url;
          const imgAlt = typeof img === 'object' && img.alt ? img.alt : (name || 'Combo');
          const sortOrder = typeof img === 'object' && img.sortOrder !== undefined ? img.sortOrder : i + 1;
          const imgId = `cimg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await query(
            `INSERT INTO combo_images (id, combo_id, url, alt, sort_order, image_type, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true);`,
            [imgId, id, imgUrl, imgAlt, sortOrder, 'gallery']
          );
        }
      }
    }

    if (isPriceChanging) {
      await writeAuditLog({
        adminId: session.id,
        adminUsername: session.username,
        role: session.role,
        action: 'COMBO_PRICE_UPDATE',
        entityType: 'COMBO',
        entityId: id,
        beforeJson: { sale_price: currentCombo.sale_price },
        afterJson: { sale_price },
      });
    }

    if (isCostPriceChanging) {
      await writeAuditLog({
        adminId: session.id,
        adminUsername: session.username,
        role: session.role,
        action: 'COMBO_COST_UPDATE',
        entityType: 'COMBO',
        entityId: id,
        beforeJson: { cost_price: currentCombo.cost_price },
        afterJson: { cost_price: parseInt(body.cost_price, 10) },
      });
    }

    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: 'COMBO_UPDATE',
      entityType: 'COMBO',
      entityId: id,
      beforeJson: currentCombo,
      afterJson: body,
    });

    return NextResponse.json({ success: true, message: 'Cập nhật combo thành công' });
  } catch (error: any) {
    console.error('Error updating admin combo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Xóa combo
export async function DELETE(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập quản trị.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!hasPermission(session, 'combos.manage')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền xóa combo.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID combo' }, { status: 400 });
    }

    const currRes = await query(`SELECT * FROM combos WHERE id = $1;`, [id]);
    if (currRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy combo' }, { status: 404 });
    }
    const comboToDelete = currRes.rows[0];

    await query(`DELETE FROM combo_images WHERE combo_id = $1;`, [id]);
    await query(`DELETE FROM combo_items WHERE combo_id = $1;`, [id]);
    await query(`DELETE FROM combos WHERE id = $1;`, [id]);

    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: 'COMBO_DELETE',
      entityType: 'COMBO',
      entityId: id,
      beforeJson: comboToDelete,
      afterJson: null,
    });

    return NextResponse.json({ success: true, message: 'Đã xóa combo thành công' });
  } catch (error: any) {
    console.error('Error deleting admin combo:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
