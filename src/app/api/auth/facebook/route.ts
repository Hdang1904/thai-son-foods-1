import { NextRequest, NextResponse } from 'next/server';
import { getSafeAppOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get('returnUrl') || '/tai-khoan';

  const fbClientId = process.env.FACEBOOK_CLIENT_ID;
  const origin = getSafeAppOrigin(req);
  const redirectUri = `${origin}/api/auth/callback/facebook`;

  // Nếu chưa cấu hình App ID từ Meta Developer
  if (!fbClientId || fbClientId.trim() === '' || fbClientId.includes('your_facebook_client_id')) {
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_OAUTH === 'true') {
      const mockUrl = new URL('/api/auth/mock-oauth', origin);
      mockUrl.searchParams.set('provider', 'facebook');
      mockUrl.searchParams.set('returnUrl', returnUrl);
      return NextResponse.redirect(mockUrl.toString());
    }
    const errorUrl = new URL('/?auth=login', origin);
    errorUrl.searchParams.set('error', 'oauth_not_configured');
    return NextResponse.redirect(errorUrl.toString());
  }

  // Luồng OAuth Facebook chính thức
  const state = Buffer.from(JSON.stringify({ returnUrl })).toString('base64');
  const fbAuthUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  fbAuthUrl.searchParams.set('client_id', fbClientId);
  fbAuthUrl.searchParams.set('redirect_uri', redirectUri);
  fbAuthUrl.searchParams.set('state', state);
  fbAuthUrl.searchParams.set('scope', 'email,public_profile');

  return NextResponse.redirect(fbAuthUrl.toString());
}
