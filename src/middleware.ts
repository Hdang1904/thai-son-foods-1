import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_COOKIE_NAME = 'tsf_admin_token';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tsf_super_secret_jwt_key_2026_thai_son_foods'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Chống tấn công CSRF (Cross-Origin Request Forgery) trên các API quản trị thay đổi dữ liệu
  if (pathname.startsWith('/api/admin/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.get('origin');
    const host = req.headers.get('host');

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        // Kiểm tra host hoặc x-forwarded-host
        const forwardedHost = req.headers.get('x-forwarded-host');
        const allowedHosts = [host, forwardedHost].filter(Boolean);

        if (!allowedHosts.includes(originUrl.host)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Yêu cầu bị từ chối do vi phạm chính sách bảo mật CSRF (Cross-Origin Request Forbidden)',
              code: 'CSRF_BLOCKED',
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Header Origin không hợp lệ', code: 'CSRF_BLOCKED' },
          { status: 403 }
        );
      }
    }
  }

  // 2. Whitelist auth API routes
  if (pathname.startsWith('/api/admin/auth/')) {
    return NextResponse.next();
  }

  // 3. Check token from cookie
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  let isAuthenticated = false;
  let mustChangePassword = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
      mustChangePassword = Boolean(payload.mustChangePassword);
    } catch {
      isAuthenticated = false;
    }
  }

  // 4. Login & Register pages
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    if (isAuthenticated) {
      // Already logged in, redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // 5. Protected Admin API routes
  if (pathname.startsWith('/api/admin/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập quản trị viên', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    if (mustChangePassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tài khoản bắt buộc phải đổi mật khẩu lần đầu trước khi tiếp tục thao tác.',
          code: 'MUST_CHANGE_PASSWORD',
        },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // 5. Protected Admin Pages (/admin and sub-pages)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/admin/login', req.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('from', pathname);
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
