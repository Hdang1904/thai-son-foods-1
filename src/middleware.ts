import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_COOKIE_NAME = 'tsf_admin_token';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tsf_super_secret_jwt_key_2026_thai_son_foods'
);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Whitelist auth API routes
  if (pathname.startsWith('/api/admin/auth/')) {
    return NextResponse.next();
  }

  // 2. Check token from cookie
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // 3. Login & Register pages
  if (pathname === '/admin/login' || pathname === '/admin/register') {
    if (isAuthenticated) {
      // Already logged in, redirect to admin dashboard
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // 4. Protected Admin API routes
  if (pathname.startsWith('/api/admin/')) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập quản trị viên' },
        { status: 401 }
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
