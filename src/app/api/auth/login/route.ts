import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { verifyPassword, signUserToken, USER_COOKIE_NAME, TOKEN_EXPIRY_DAYS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập email đăng nhập' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mật khẩu' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user by email
    const res = await query(
      `SELECT id, email, password_hash, full_name, phone, address, province, district, ward
       FROM users
       WHERE email = $1
       LIMIT 1;`,
      [cleanEmail]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // 2. Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // 3. Sign JWT
    const payload = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
    };
    const token = await signUserToken(payload);

    const userProfile = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone || '',
      address: user.address || '',
      province: user.province || '',
      district: user.district || '',
      ward: user.ward || '',
    };

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: userProfile,
    });

    const maxAgeSeconds = TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
    response.cookies.set({
      name: USER_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error: any) {
    console.error('Error logging in customer:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi đăng nhập: ' + (error.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}
