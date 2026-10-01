import { NextRequest, NextResponse } from 'next/server';
import { getSafeAppOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get('returnUrl') || '/tai-khoan';

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const origin = getSafeAppOrigin(req);
  const redirectUri = `${origin}/api/auth/callback/google`;

  // Nếu chưa cấu hình Client ID thực tế từ Google Cloud Console
  if (!googleClientId || googleClientId.trim() === '' || googleClientId.includes('your_google_client_id')) {
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_OAUTH === 'true') {
      const mockUrl = new URL('/api/auth/mock-oauth', origin);
      mockUrl.searchParams.set('provider', 'google');
      mockUrl.searchParams.set('returnUrl', returnUrl);
      return NextResponse.redirect(mockUrl.toString());
    }
    const errorUrl = new URL('/dang-nhap', origin);
    errorUrl.searchParams.set('error', 'oauth_not_configured');
    return NextResponse.redirect(errorUrl.toString());
  }

  // Luồng OAuth 2.0 Google chính thức
  const state = Buffer.from(JSON.stringify({ returnUrl })).toString('base64');
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', googleClientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}
