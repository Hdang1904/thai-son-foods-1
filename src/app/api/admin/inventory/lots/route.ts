import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { createOrUpdateInventoryLot } from '@/lib/partner/fefo';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const storeCode = searchParams.get('storeCode');
    const productId = searchParams.get('productId');

    let sql = `
      SELECT 
        il.*,
        p.name AS product_name,
        p.thumbnail AS product_thumbnail,
        (il.stock_quantity - il.reserved_quantity) AS available_quantity,
        (il.expiry_date - CURRENT_DATE) AS days_remaining
      FROM inventory_lots il
      JOIN products p ON il.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (storeCode && storeCode !== 'ALL') {
      params.push(storeCode);
      sql += ` AND il.store_code = $${params.length}`;
    }

    if (productId) {
      params.push(productId);
      sql += ` AND il.product_id = $${params.length}`;
    }

    sql += ` ORDER BY il.expiry_date ASC, il.manufacturing_date ASC;`;

    const res = await query(sql, params);

    const lots = res.rows.map(lot => {
      const daysRemaining = Number(lot.days_remaining) || 0;
      let expiryStatus = 'NORMAL';
      if (daysRemaining < 0) {
        expiryStatus = 'EXPIRED';
      } else if (daysRemaining <= 2) {
        expiryStatus = 'CRITICAL';
      } else if (daysRemaining <= 5) {
        expiryStatus = 'NEAR_EXPIRY';
      }

      return {
        ...lot,
        daysRemaining,
        expiryStatus,
      };
    });

    return NextResponse.json({ success: true, lots });
  } catch (error: any) {
    console.error('[AdminLots] Error fetching lots:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị', code: 'UNAUTHORIZED' }, { status: 401 });
    }

    if (!hasPermission(session, 'inventory.update_own_store') && !hasPermission(session, 'dealer.manage')) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền nhập lô hàng mới', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const { storeCode, productId, lotCode, manufacturingDate, expiryDate, quantity } = body;

    if (!storeCode || !productId || !lotCode || !manufacturingDate || !expiryDate || !quantity) {
      return NextResponse.json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin lô hàng.' }, { status: 400 });
    }

    const result = await createOrUpdateInventoryLot({
      storeCode,
      productId,
      lotCode,
      manufacturingDate,
      expiryDate,
      quantity: Math.max(1, Math.round(Number(quantity) || 1)),
    });

    return NextResponse.json({
      success: true,
      message: `Đã nhập lô hàng ${result.lotCode} thành công!`,
      lot: result,
    });
  } catch (error: any) {
    console.error('[AdminLots] Error creating lot:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi hệ thống' }, { status: 500 });
  }
}
