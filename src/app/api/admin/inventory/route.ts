import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission, getStoreScope } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

import { ACTIVE_STORES } from '@/data/stores';

// Danh sách các cửa hàng mặc định
const STORE_LIST = ACTIVE_STORES.map((s) => ({
  code: s.code,
  name: s.name,
  address: s.address,
}));

// GET: Lấy tồn kho của cửa hàng
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    const canViewAll = hasPermission(session, 'inventory.view_all');
    const canViewOwn = hasPermission(session, 'inventory.view_own_store');
    const canViewTotal = hasPermission(session, 'inventory.view_total');

    if (!canViewAll && !canViewOwn && !canViewTotal) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền truy cập kho hàng.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Trường hợp MARKETING (chỉ có inventory.view_total, không có view_all hay view_own_store)
    if (canViewTotal && !canViewAll && !canViewOwn) {
      const sqlTotal = `
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          p.sku,
          p.price,
          p.unit,
          p.thumbnail,
          p.is_active,
          c.name AS category_name,
          COALESCE(SUM(si.stock_quantity), 0) AS stock_quantity,
          COALESCE(SUM(si.reserved), 0) AS reserved,
          GREATEST(0, COALESCE(SUM(si.stock_quantity), 0) - COALESCE(SUM(si.reserved), 0) - COALESCE(SUM(si.safety_stock), 0)) AS available_quantity,
          GREATEST(0, COALESCE(SUM(si.stock_quantity), 0) - COALESCE(SUM(si.reserved), 0) - COALESCE(SUM(si.safety_stock), 0)) AS sellable_quantity,
          COALESCE(SUM(si.safety_stock), 0) AS safety_stock
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN store_inventory si ON si.product_id = p.id
        GROUP BY p.id, c.name
        ORDER BY p.id ASC;
      `;
      const resTotal = await query(sqlTotal);
      return NextResponse.json({
        success: true,
        currentStore: 'TOTAL',
        stores: [],
        isSuperAdmin: false,
        isTotalOnly: true,
        data: resTotal.rows,
      });
    }

    const { searchParams } = new URL(req.url);
    let requestedStore = searchParams.get('storeCode');

    // Nếu là STORE_STAFF, chỉ được xem kho của cửa hàng mình
    const storeScope = getStoreScope(session);
    if (storeScope) {
      requestedStore = storeScope;
    } else {
      // Super admin mặc định xem NH (Vườn Lài - Tân Phú) nếu chưa chọn
      if (!requestedStore) {
        requestedStore = 'NH';
      }
    }

    // Đảm bảo mỗi sản phẩm đều có 1 bản ghi tồn kho riêng cho cửa hàng này (không dùng chung)
    await query(
      `INSERT INTO store_inventory (id, store_code, product_id, stock_quantity, updated_by)
       SELECT 'inv_' || $1 || '_' || p.id, $1, p.id, 100, $1
       FROM products p
       ON CONFLICT (store_code, product_id) DO NOTHING;`,
      [requestedStore]
    );

    const sql = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.sku,
        p.price,
        p.unit,
        p.thumbnail,
        p.is_active,
        c.name AS category_name,
        COALESCE(si.stock_quantity, 0) AS stock_quantity,
        COALESCE(si.reserved, 0) AS reserved,
        GREATEST(0, COALESCE(si.stock_quantity, 0) - COALESCE(si.reserved, 0) - COALESCE(si.safety_stock, 0)) AS available_quantity,
        GREATEST(0, COALESCE(si.stock_quantity, 0) - COALESCE(si.reserved, 0) - COALESCE(si.safety_stock, 0)) AS sellable_quantity,
        COALESCE(si.safety_stock, 0) AS safety_stock,
        si.updated_at,
        si.updated_by
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN store_inventory si ON si.product_id = p.id AND si.store_code = $1
      ORDER BY p.id ASC;
    `;

    const res = await query(sql, [requestedStore]);

    const storeQuery = await query(
      `SELECT code, name, address, phone, district, province, map_url FROM stores WHERE is_active = true ORDER BY code ASC;`
    );
    const activeStores = storeQuery.rows.length > 0 ? storeQuery.rows : STORE_LIST;

    return NextResponse.json({
      success: true,
      currentStore: requestedStore,
      stores: activeStores,
      isSuperAdmin: hasPermission(session, 'inventory.view_all'),
      data: res.rows,
    });
  } catch (error: any) {
    console.error('Error fetching store inventory:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật số lượng mặt hàng (1 sản phẩm hoặc nhiều sản phẩm theo mảng)
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    if (!hasPermission(session, 'inventory.update_own_store')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền cập nhật tồn kho.', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const body = await req.json();
    let { storeCode } = body;
    const { productId, stockQuantity, items } = body;

    // Phân quyền cửa hàng: STAFF chỉ được sửa kho của chính mình
    const storeScope = getStoreScope(session);
    if (storeScope) {
      storeCode = storeScope;
    } else {
      if (!storeCode) storeCode = 'NH';
    }

    // 1. Trường hợp cập nhật danh sách hàng loạt (batch update)
    if (Array.isArray(items) && items.length > 0) {
      // Validate toàn bộ danh sách trước: không cho phép bất kỳ món nào giảm dưới số đang giữ chỗ
      const validationErrors: string[] = [];
      const preloadedData: Array<{ pId: string; qty: number; oldStock: number; oldReserved: number }> = [];

      for (const item of items) {
        const pId = item.productId;
        const qty = Math.max(0, parseInt(item.stockQuantity ?? '0', 10));
        const prevBatch = await query(
          `SELECT stock_quantity, reserved FROM store_inventory WHERE store_code = $1 AND product_id = $2;`,
          [storeCode, pId]
        );
        const oldStockBatch = prevBatch.rows.length > 0 ? Number(prevBatch.rows[0].stock_quantity) || 0 : 0;
        const oldReservedBatch = prevBatch.rows.length > 0 ? Number(prevBatch.rows[0].reserved) || 0 : 0;

        if (qty < oldReservedBatch) {
          validationErrors.push(`Mã ${pId}: tồn mới (${qty}) < đang giữ chỗ (${oldReservedBatch} chai)`);
        }
        preloadedData.push({ pId, qty, oldStock: oldStockBatch, oldReserved: oldReservedBatch });
      }

      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Không thể giảm tồn kho xuống dưới số lượng đang giữ chỗ: ${validationErrors.join('; ')}. Vui lòng xử lý đơn giữ chỗ trước khi giảm tồn.`,
          },
          { status: 400 }
        );
      }

      for (const data of preloadedData) {
        const { pId, qty, oldStock: oldStockBatch, oldReserved: oldReservedBatch } = data;
        const invId = `inv_${storeCode}_${pId}`;

        await query(
          `INSERT INTO store_inventory (id, store_code, product_id, stock_quantity, updated_by, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
           ON CONFLICT (store_code, product_id) DO UPDATE
           SET stock_quantity = EXCLUDED.stock_quantity,
               updated_by = EXCLUDED.updated_by,
               updated_at = CURRENT_TIMESTAMP;`,
          [invId, storeCode, pId, qty, session.username]
        );

        // Ghi log cho batch update
        const batchLogId = `invlog_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        await query(
          `INSERT INTO inventory_logs (
            id, store_code, product_id, old_stock, new_stock, old_reserved, new_reserved, change_type, actor, note
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual_update', $8, $9);`,
          [
            batchLogId,
            storeCode,
            pId,
            oldStockBatch,
            qty,
            oldReservedBatch,
            oldReservedBatch,
            session.username,
            `Admin batch update tồn kho từ ${oldStockBatch} -> ${qty} chai`,
          ]
        );

        // Cập nhật tồn kho tổng của sản phẩm = TỔNG TỒN KHO CỦA TẤT CẢ CỬA HÀNG
        await query(
          `UPDATE products 
           SET stock_quantity = (
             SELECT COALESCE(SUM(stock_quantity), 0) 
             FROM store_inventory 
             WHERE product_id = $1
           )
           WHERE id = $1;`,
          [pId]
        );
      }

      await writeAuditLog({
        adminId: session.userId,
        adminUsername: session.username,
        role: session.role,
        action: 'INVENTORY_BATCH_UPDATE',
        entityType: 'INVENTORY',
        storeCode,
        afterJson: { storeCode, itemCount: items.length },
      });

      const { invalidateGatekeeperCache } = await import('@/lib/inventoryGatekeeper');
      invalidateGatekeeperCache(storeCode);

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật tồn kho thành công cho ${items.length} mặt hàng tại ${storeCode}!`,
      });
    }

    // 2. Trường hợp cập nhật lẻ từng sản phẩm
    if (!productId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã sản phẩm (productId)' }, { status: 400 });
    }

    const qty = Math.max(0, parseInt(stockQuantity ?? '0', 10));
    const invId = `inv_${storeCode}_${productId}`;

    // Lấy số lượng tồn cũ để ghi log và kiểm tra
    const prevRes = await query(
      `SELECT stock_quantity, reserved FROM store_inventory WHERE store_code = $1 AND product_id = $2;`,
      [storeCode, productId]
    );
    const oldStock = prevRes.rows.length > 0 ? Number(prevRes.rows[0].stock_quantity) || 0 : 0;
    const oldReserved = prevRes.rows.length > 0 ? Number(prevRes.rows[0].reserved) || 0 : 0;

    // Chặn nghiêm ngặt không cho giảm tồn xuống dưới số lượng đang giữ chỗ
    if (qty < oldReserved) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể giảm tồn kho (${qty} chai) xuống dưới số lượng đang giữ chỗ (${oldReserved} chai). Đang có khách đặt giữ chỗ cho sản phẩm này.`,
          reserved: oldReserved,
        },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO store_inventory (id, store_code, product_id, stock_quantity, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (store_code, product_id) DO UPDATE
       SET stock_quantity = EXCLUDED.stock_quantity,
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP;`,
      [invId, storeCode, productId, qty, session.username]
    );

    // Ghi log biến động kho
    const logId = `invlog_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    await query(
      `INSERT INTO inventory_logs (
        id, store_code, product_id, old_stock, new_stock, old_reserved, new_reserved, change_type, actor, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual_update', $8, $9);`,
      [
        logId,
        storeCode,
        productId,
        oldStock,
        qty,
        oldReserved,
        oldReserved,
        session.username,
        `Admin cập nhật tồn kho thủ công từ ${oldStock} -> ${qty} chai`,
      ]
    );

    // Cập nhật tồn kho tổng của sản phẩm = TỔNG TỒN KHO CỦA TẤT CẢ CÁC CỬA HÀNG
    await query(
      `UPDATE products 
       SET stock_quantity = (
         SELECT COALESCE(SUM(stock_quantity), 0) 
         FROM store_inventory 
         WHERE product_id = $1
       )
       WHERE id = $1;`,
      [productId]
    );

    await writeAuditLog({
      adminId: session.userId,
      adminUsername: session.username,
      role: session.role,
      action: 'INVENTORY_UPDATE',
      entityType: 'INVENTORY',
      entityId: productId,
      storeCode,
      beforeJson: { stock_quantity: oldStock },
      afterJson: { stock_quantity: qty },
    });

    const { invalidateGatekeeperCache } = await import('@/lib/inventoryGatekeeper');
    invalidateGatekeeperCache(storeCode);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật số lượng tồn kho thành ${qty} chai cho cửa hàng ${storeCode}!`,
      data: { storeCode, productId, stockQuantity: qty },
    });
  } catch (error: any) {
    console.error('Error updating store inventory:', error);
    return NextResponse.json({ success: false, error: 'Đã xảy ra lỗi khi cập nhật tồn kho. Vui lòng thử lại sau.' }, { status: 500 });
  }
}
