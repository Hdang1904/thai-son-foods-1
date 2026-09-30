import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, signAdminToken, ADMIN_COOKIE_NAME, TOKEN_EXPIRY_DAYS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập tên đăng nhập hoặc email' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập mật khẩu' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Search by username or email
    const res = await query(
      `SELECT id, username, email, password_hash, full_name, role, is_active
       FROM admin_users
       WHERE LOWER(username) = $1 OR LOWER(email) = $1
       LIMIT 1;`,
      [cleanIdentifier]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    const user = res.rows[0];

    // 2. Check if active
    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      );
    }

    // 3. Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    // 4. Sign JWT
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    };
    const token = await signAdminToken(payload);

    // 5. Response with HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: payload,
    });

    const maxAgeSeconds = TOKEN_EXPIRY_DAYS * 24 * 60 * 60;

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    });

    return response;
  } catch (error: any) {
    console.error('Error in admin login API:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi đăng nhập: ' + (error.message || 'Lỗi không xác định') },
      { status: 500 }
    );
  }
}
