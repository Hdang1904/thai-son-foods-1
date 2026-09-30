import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAdminSession, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Danh sách tất cả tài khoản admin (chỉ dành cho SUPER_ADMIN)
export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền xem danh sách tài khoản' },
        { status: 403 }
      );
    }

    const res = await query(
      `SELECT id, username, email, full_name, role, is_active, created_at, updated_at
       FROM admin_users
       ORDER BY created_at ASC;`
    );

    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Tạo mới tài khoản admin (chỉ dành cho SUPER_ADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền tạo tài khoản quản trị' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { username, email, fullName, password, role } = body;

    // 1. Validation
    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
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

    const assignedRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';

    // 2. Check duplicate username or email
    const existing = await query(
      'SELECT id, username, email FROM admin_users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2) LIMIT 1;',
      [cleanUsername, cleanEmail]
    );

    if (existing.rows.length > 0) {
      const match = existing.rows[0];
      if (match.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return NextResponse.json(
          { success: false, error: `Tên đăng nhập "${cleanUsername}" đã tồn tại trên hệ thống` },
          { status: 409 }
        );
      }
      if (match.email.toLowerCase() === cleanEmail) {
        return NextResponse.json(
          { success: false, error: `Email "${cleanEmail}" đã được sử dụng bởi tài khoản khác` },
          { status: 409 }
        );
      }
    }

    // 3. Hash password and insert
    const hashedPassword = await hashPassword(password);
    const userId = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const insertRes = await query(
      `INSERT INTO admin_users (id, username, email, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, username, email, full_name, role, is_active, created_at;`,
      [userId, cleanUsername, cleanEmail, hashedPassword, fullName?.trim() || cleanUsername, assignedRole]
    );

    return NextResponse.json({
      success: true,
      message: `Đã tạo tài khoản quản trị viên "${cleanUsername}" thành công!`,
      data: insertRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Cập nhật thông tin/trạng thái/mật khẩu tài khoản admin
export async function PUT(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền chỉnh sửa tài khoản' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, fullName, email, role, isActive, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID tài khoản cần chỉnh sửa' }, { status: 400 });
    }

    // Không cho phép tự khóa tài khoản của chính mình
    if (session.id === id && isActive === false) {
      return NextResponse.json(
        { success: false, error: 'Bạn không thể tự khóa tài khoản Super Admin của chính mình' },
        { status: 400 }
      );
    }

    let sql = 'UPDATE admin_users SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [id];

    if (fullName !== undefined) {
      params.push(fullName.trim());
      sql += `, full_name = $${params.length}`;
    }

    if (email !== undefined && email.includes('@')) {
      params.push(email.trim().toLowerCase());
      sql += `, email = $${params.length}`;
    }

    if (role !== undefined) {
      const targetRole = role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
      params.push(targetRole);
      sql += `, role = $${params.length}`;
    }

    if (isActive !== undefined) {
      params.push(Boolean(isActive));
      sql += `, is_active = $${params.length}`;
    }

    if (password && typeof password === 'string' && password.trim().length >= 6) {
      const hashedPassword = await hashPassword(password.trim());
      params.push(hashedPassword);
      sql += `, password_hash = $${params.length}`;
    }

    sql += ' WHERE id = $1 RETURNING id, username, email, full_name, role, is_active, updated_at;';

    const updateRes = await query(sql, params);
    if (updateRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản quản trị viên' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tài khoản quản trị viên thành công!',
      data: updateRes.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Xóa tài khoản admin
export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền xóa tài khoản' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('id');

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Thiếu ID tài khoản' }, { status: 400 });
    }

    // Không cho phép tự xóa tài khoản của chính mình
    if (session.id === targetId) {
      return NextResponse.json(
        { success: false, error: 'Bạn không thể tự xóa tài khoản đang đăng nhập' },
        { status: 400 }
      );
    }

    const delRes = await query('DELETE FROM admin_users WHERE id = $1 RETURNING username;', [targetId]);
    if (delRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản để xóa' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản "${delRes.rows[0].username}" thành công!`,
    });
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
