import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const province = searchParams.get('province');
    const district = searchParams.get('district');

    let sql = '';
    let params: any[] = [];

    if (productId) {
      let dbProductId = productId;
      const findProd = await query(
        `SELECT id FROM products 
         WHERE id = $1 
            OR slug = $1 
            OR sku = $1 
            OR slug LIKE $1 || '%' 
            OR $1 LIKE slug || '%' 
            OR slug LIKE '%' || $1 || '%'
         LIMIT 1;`,
        [productId]
      );
      if (findProd.rows.length > 0) {
        dbProductId = findProd.rows[0].id;
      }

      sql = `
        SELECT 
          s.id,
          s.code,
          s.name,
          s.address,
          s.phone,
          s.province,
          s.district,
          s.ward,
          s.map_url,
          s.latitude,
          s.longitude,
          s.region,
          s.status,
          COALESCE(si.stock_quantity, 0) AS stock_quantity,
          COALESCE(si.reserved, 0) AS reserved,
          COALESCE(si.safety_stock, 0) AS safety_stock
        FROM stores s
        LEFT JOIN store_inventory si ON si.store_code = s.code AND si.product_id = $1
        WHERE s.is_active = true
      `;
      params.push(dbProductId);

      if (province && province !== 'ALL') {
        params.push(province);
        sql += ` AND s.province = $${params.length}`;
      }

      if (district && district !== 'ALL') {
        params.push(district);
        sql += ` AND s.district = $${params.length}`;
      }

      sql += ` ORDER BY s.code ASC;`;
    } else {
      sql = `
        SELECT 
          s.id,
          s.code,
          s.name,
          s.address,
          s.phone,
          s.province,
          s.district,
          s.ward,
          s.map_url,
          s.latitude,
          s.longitude,
          s.region,
          s.status
        FROM stores s
        WHERE s.is_active = true
      `;

      if (province && province !== 'ALL') {
        params.push(province);
        sql += ` AND s.province = $${params.length}`;
      }

      if (district && district !== 'ALL') {
        params.push(district);
        sql += ` AND s.district = $${params.length}`;
      }

      sql += ` ORDER BY s.code ASC;`;
    }

    const res = await query(sql, params);
    const { INVENTORY_CONFIG } = await import('@/config/inventory');

    const stores = res.rows.map((row) => {
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | undefined = undefined;

      if (productId) {
        const available = Math.max(
          0,
          (Number(row.stock_quantity) || 0) -
            (Number(row.reserved) || 0) -
            (Number(row.safety_stock) || 0)
        );

        if (available <= 0) {
          stockStatus = 'out_of_stock';
        } else if (available <= INVENTORY_CONFIG.LOW_STOCK_THRESHOLD) {
          stockStatus = 'low_stock';
        } else {
          stockStatus = 'in_stock';
        }
      }

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        address: row.address,
        phone: row.phone || '02871000472',
        province: row.province || 'Hồ Chí Minh',
        district: row.district || '',
        ward: row.ward || '',
        mapUrl:
          row.map_url ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.address)}`,
        latitude: row.latitude ? Number(row.latitude) : null,
        longitude: row.longitude ? Number(row.longitude) : null,
        region: row.region || null,
        status: row.status ?? 1,
        // Bảo mật: chỉ trả trạng thái còn hàng/sắp hết/hết hàng, TUYỆT ĐỐI không trả số lượng tồn chính xác cho khách
        stockStatus,
      };
    });

    const hasStock = productId ? stores.some((s) => s.stockStatus !== 'out_of_stock') : undefined;

    return NextResponse.json({
      success: true,
      stores,
      hasStock,
      count: stores.length,
    });
  } catch (error: any) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải danh sách cửa hàng' },
      { status: 500 }
    );
  }
}
