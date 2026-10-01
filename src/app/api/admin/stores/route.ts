import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { hasPermission, getStoreScope } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

// GET: Lấy danh sách thông tin cửa hàng cho Admin
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const storeCode = searchParams.get('storeCode');

    let sql = `
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
        s.group_code,
        s.status,
        s.notes,
        s.is_active,
        s.updated_at
      FROM stores s
      WHERE 1=1
    `;
    const params: any[] = [];

    // Nếu là STORE_STAFF thì chỉ xem được cửa hàng của mình
    const storeScope = getStoreScope(session);
    if (storeScope) {
      params.push(storeScope);
      sql += ` AND s.code = $${params.length}`;
    } else if (storeCode) {
      params.push(storeCode);
      sql += ` AND s.code = $${params.length}`;
    }

    sql += ` ORDER BY s.code ASC;`;

    const res = await query(sql, params);

    return NextResponse.json({
      success: true,
      stores: res.rows,
      currentUserStore: storeScope,
      isSuperAdmin: hasPermission(session, 'stores.edit_all'),
    });
  } catch (error: any) {
    console.error('Error fetching admin stores:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật thông tin địa chỉ cửa hàng
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    const body = await req.json();
    let { code, name, address, phone, province, district, ward, map_url, mapUrl, latitude, longitude, region, group_code, status: storeStatus, notes } = body;

    // Quyền: Cửa hàng chỉ được sửa thông tin của chính mình
    const storeScope = getStoreScope(session);
    if (storeScope) {
      code = storeScope;
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'Thiếu mã cửa hàng (code)' }, { status: 400 });
    }

    const finalMapUrl = map_url || mapUrl || (latitude && longitude
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`);

    const isActive = storeStatus === undefined ? true : storeStatus === 1;

    const updateSql = `
      INSERT INTO stores (id, code, name, address, phone, province, district, ward, map_url, latitude, longitude, region, group_code, status, notes, is_active, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO UPDATE
      SET name = COALESCE(EXCLUDED.name, stores.name),
          address = COALESCE(EXCLUDED.address, stores.address),
          phone = COALESCE(EXCLUDED.phone, stores.phone),
          province = COALESCE(EXCLUDED.province, stores.province),
          district = COALESCE(EXCLUDED.district, stores.district),
          ward = COALESCE(EXCLUDED.ward, stores.ward),
          map_url = COALESCE(EXCLUDED.map_url, stores.map_url),
          latitude = COALESCE(EXCLUDED.latitude, stores.latitude),
          longitude = COALESCE(EXCLUDED.longitude, stores.longitude),
          region = COALESCE(EXCLUDED.region, stores.region),
          group_code = COALESCE(EXCLUDED.group_code, stores.group_code),
          status = COALESCE(EXCLUDED.status, stores.status),
          notes = COALESCE(EXCLUDED.notes, stores.notes),
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const storeId = `store_${code}`;
    const res = await query(updateSql, [
      storeId,
      code,
      name || `Cửa hàng ${code}`,
      address || '',
      phone || '',
      province || 'Hồ Chí Minh',
      district || '',
      ward || '',
      finalMapUrl,
      latitude || null,
      longitude || null,
      region || null,
      group_code || null,
      storeStatus ?? 1,
      notes || null,
      isActive,
    ]);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật thông tin địa chỉ cho cửa hàng ${code} thành công!`,
      store: res.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating store info:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
