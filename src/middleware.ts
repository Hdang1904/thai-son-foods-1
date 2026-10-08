import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const ADMIN_COOKIE_NAME = 'tsf_admin_token';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tsf_super_secret_jwt_key_2026_thai_son_foods'
);

// Allowlist các route ngoại lệ có chủ đích (webhook cổng thanh toán, cronjob có Bearer token)
const CSRF_EXEMPT_ROUTES: readonly string[] = [
  '/api/cron/',
  '/api/payment/webhook',
  '/api/webhooks/',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Chống tấn công CSRF (Cross-Origin Request Forgery) trên các API quản trị thay đổi dữ liệu
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
  if (pathname.startsWith('/api/admin/') && isStateChanging) {
    const isExempt = CSRF_EXEMPT_ROUTES.some((route) => pathname.startsWith(route));

    if (!isExempt) {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      const host = req.headers.get('host');
      const forwardedHost = req.headers.get('x-forwarded-host');
      const allowedHosts = [host, forwardedHost].filter(Boolean) as string[];

      // Fail-closed: Nếu thiếu cả Origin và Referer -> Từ chối 403
      if (!origin && !referer) {
        return NextResponse.json(
          {
            success: false,
            error: 'Yêu cầu bị từ chối do vi phạm chính sách bảo mật CSRF: Thiếu thông tin nguồn gốc (Origin/Referer header required)',
            code: 'CSRF_BLOCKED',
          },
          { status: 403 }
        );
      }

      // Nếu có Origin -> Kiểm tra Origin
      if (origin) {
        try {
          const originUrl = new URL(origin);
          if (!allowedHosts.includes(originUrl.host)) {
            return NextResponse.json(
              {
                success: false,
                error: 'Yêu cầu bị từ chối do vi phạm chính sách bảo mật CSRF (Origin mismatch)',
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
      } else if (referer) {
        // Nếu thiếu Origin nhưng có Referer -> Kiểm tra Referer
        try {
          const refererUrl = new URL(referer);
          if (!allowedHosts.includes(refererUrl.host)) {
            return NextResponse.json(
              {
                success: false,
                error: 'Yêu cầu bị từ chối do vi phạm chính sách bảo mật CSRF (Referer mismatch)',
                code: 'CSRF_BLOCKED',
              },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { success: false, error: 'Header Referer không hợp lệ', code: 'CSRF_BLOCKED' },
            { status: 403 }
          );
        }
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

  // 6. Protected Partner API routes
  // 6. Protected Partner & Dealer API routes
  if (pathname.startsWith('/api/partner/') || pathname.startsWith('/api/dealer/')) {
    const isPublicPartnerRoute =
      pathname.startsWith('/api/partner/register') ||
      pathname.startsWith('/api/partner/otp/') ||
      pathname.startsWith('/api/partner/click');

    if (!isPublicPartnerRoute) {
      let userToken = req.cookies.get('tsf_user_session')?.value;
      if (!userToken) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          userToken = authHeader.substring(7).trim();
        }
      }
      let isUserAuth = false;
      if (userToken) {
        try {
          await jwtVerify(userToken, JWT_SECRET);
          isUserAuth = true;
        } catch {
          isUserAuth = false;
        }
      }
      if (!isUserAuth) {
        return NextResponse.json(
          { success: false, error: 'Yêu cầu đăng nhập tài khoản đối tác / đại lý', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
    }
    return NextResponse.next();
  }

  // 7. Protected Partner Portal Pages (/doi-tac and sub-pages)
  if (pathname.startsWith('/doi-tac')) {
    const userToken = req.cookies.get('tsf_user_session')?.value;
    let isUserAuth = false;
    if (userToken) {
      try {
        await jwtVerify(userToken, JWT_SECRET);
        isUserAuth = true;
      } catch {
        isUserAuth = false;
      }
    }
    if (!isUserAuth) {
      const loginUrl = new URL('/dang-ky-doi-tac', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/doi-tac/:path*', '/api/partner/:path*', '/api/dealer/:path*'],
};
