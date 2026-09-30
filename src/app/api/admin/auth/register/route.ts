import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, email, password, fullName, registerKey } = body;

    // 1. Validation
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { success: false, error: 'Tên đăng nhập chỉ chứa chữ cái, số, dấu gạch ngang hoặc gạch dưới' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email không hợp lệ' },
        { status: 400 }
      );
    }
    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // 2. Check total admins in database
    const countRes = await query('SELECT COUNT(*) AS total FROM admin_users;');
    const totalAdmins = parseInt(countRes.rows[0]?.total || '0', 10);

    const configuredSecret = process.env.ADMIN_REGISTER_KEY || 'tsf@admin2026';
    let assignedRole = 'ADMIN';

    if (totalAdmins === 0) {
      // First account gets SUPER_ADMIN automatically without requiring registerKey
      assignedRole = 'SUPER_ADMIN';
    } else {
      // Subsequent accounts require the admin registration secret key
      if (!registerKey || registerKey.trim() !== configuredSecret) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã bảo mật đăng ký không chính xác. Vui lòng liên hệ Quản trị viên cấp cao.',
          },
          { status: 403 }
        );
      }
    }

    // 3. Check for existing username or email
    const existing = await query(
      'SELECT id, username, email FROM admin_users WHERE username = $1 OR email = $2 LIMIT 1;',
      [cleanUsername, cleanEmail]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.username === cleanUsername) {
        return NextResponse.json(
          { success: false, error: 'Tên đăng nhập này đã được sử dụng' },
          { status: 409 }
        );
      }
      if (match.email === cleanEmail) {
        return NextResponse.json(
          { success: false, error: 'Email này đã được đăng ký' },
          { status: 409 }
        );
      }
    }

    // 4. Hash password and save
    const hashedPassword = await hashPassword(password);
    const userId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await query(
      `INSERT INTO admin_users (id, username, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [
        userId,
        cleanUsername,
        cleanEmail,
        hashedPassword,
        fullName ? fullName.trim() : null,
        assignedRole,
        true,
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        totalAdmins === 0
          ? 'Đã khởi tạo tài khoản Quản trị viên cấp cao (Super Admin) thành công!'
          : 'Đăng ký tài khoản Quản trị viên thành công!',
      role: assignedRole,
    });
  } catch (error: any) {
    console.error('Error in admin register API:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi máy chủ khi đăng ký: ' + (error.message || 'Lỗi không xác định') },
      { status: 500 }
    );
  }
}
