import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    const session = await getUserSession();

    if (!session || !session.id) {
      return NextResponse.json({ user: null });
    }

    const res = await query(
      `SELECT id, email, full_name, phone, address, province, district, ward, avatar_url, provider, created_at
       FROM users
       WHERE id = $1
       LIMIT 1;`,
      [session.id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ user: null });
    }

    const row = res.rows[0];
    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        phone: row.phone || '',
        address: row.address || '',
        province: row.province || '',
        district: row.district || '',
        ward: row.ward || '',
        avatarUrl: row.avatar_url || null,
        provider: row.provider || 'local',
        createdAt: row.created_at,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/auth/me GET:', error);
    return NextResponse.json({ user: null });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase();
    const session = await getUserSession();

    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: 'Chưa đăng nhập' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fullName, phone, address, province, district, ward } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp họ và tên' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE users
       SET full_name = $1, phone = $2, address = $3, province = $4, district = $5, ward = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7;`,
      [
        fullName.trim(),
        phone ? phone.toString().trim() : null,
        address ? address.toString().trim() : null,
        province ? province.toString().trim() : null,
        district ? district.toString().trim() : null,
        ward ? ward.toString().trim() : null,
        session.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Cập nhật thông tin thành công!',
      user: {
        id: session.id,
        email: session.email,
        fullName: fullName.trim(),
        phone: phone ? phone.toString().trim() : '',
        address: address ? address.toString().trim() : '',
        province: province ? province.toString().trim() : '',
        district: district ? district.toString().trim() : '',
        ward: ward ? ward.toString().trim() : '',
      },
    });
  } catch (error: any) {
    console.error('Error updating customer profile:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi cập nhật: ' + (error.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}
