import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { hashPassword, signUserToken, USER_COOKIE_NAME, TOKEN_EXPIRY_DAYS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json();
    const { email, password, fullName, phone, address, province, district, ward } = body;

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập họ và tên của bạn' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = phone ? phone.toString().trim() : null;

    // 2. Check if email already exists
    const existing = await query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1;',
      [cleanEmail]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập!' },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Insert user
    await query(
      `INSERT INTO users (id, email, password_hash, full_name, phone, address, province, district, ward)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);`,
      [
        userId,
        cleanEmail,
        passwordHash,
        cleanName,
        cleanPhone,
        address ? address.toString().trim() : null,
        province ? province.toString().trim() : null,
        district ? district.toString().trim() : null,
        ward ? ward.toString().trim() : null,
      ]
    );

    // 5. Sign JWT & set cookie
    const payload = {
      id: userId,
      email: cleanEmail,
      fullName: cleanName,
      phone: cleanPhone,
    };
    const token = await signUserToken(payload);

    const userProfile = {
      id: userId,
      email: cleanEmail,
      fullName: cleanName,
      phone: cleanPhone,
      address: address ? address.toString().trim() : '',
      province: province ? province.toString().trim() : '',
      district: district ? district.toString().trim() : '',
      ward: ward ? ward.toString().trim() : '',
    };

    const response = NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
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
    console.error('Error registering customer:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể đăng ký: ' + (error.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}
