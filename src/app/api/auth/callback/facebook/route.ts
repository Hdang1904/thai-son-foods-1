import { NextRequest, NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { signUserToken, USER_COOKIE_NAME, TOKEN_EXPIRY_DAYS, getSafeAppOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = getSafeAppOrigin(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  let returnUrl = '/tai-khoan';
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
      if (parsed.returnUrl) returnUrl = parsed.returnUrl;
    } catch {
      // ignore
    }
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=login&error=facebook_no_code`);
  }

  try {
    await initDatabase();
    const fbClientId = process.env.FACEBOOK_CLIENT_ID;
    const fbClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/callback/facebook`;

    if (!fbClientId || !fbClientSecret) {
      return NextResponse.redirect(`${origin}/?auth=login&error=facebook_missing_credentials`);
    }

    // 1. Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', fbClientId);
    tokenUrl.searchParams.set('client_secret', fbClientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Facebook token exchange error:', tokenData);
      return NextResponse.redirect(`${origin}/?auth=login&error=facebook_token_failed`);
    }

    // 2. Fetch user profile from Facebook Graph API
    const userUrl = new URL('https://graph.facebook.com/me');
    userUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');
    userUrl.searchParams.set('access_token', tokenData.access_token);

    const userRes = await fetch(userUrl.toString());
    const profile = await userRes.json();

    const fbId = profile.id;
    const email = profile.email
      ? profile.email.toLowerCase().trim()
      : `fb_${fbId}@facebook.user`;
    const fullName = profile.name || `Facebook User ${fbId.slice(-4)}`;
    const avatarUrl = profile.picture?.data?.url || null;

    // 3. Upsert into users table
    const existing = await query(
      'SELECT id, full_name FROM users WHERE email = $1 OR (provider = $2 AND provider_id = $3) LIMIT 1;',
      [email, 'facebook', fbId]
    );

    let userId = '';
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await query(
        `UPDATE users
         SET full_name = COALESCE(NULLIF(full_name, ''), $1),
             avatar_url = COALESCE($2, avatar_url),
             provider = 'facebook',
             provider_id = COALESCE($3, provider_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4;`,
        [fullName, avatarUrl, fbId, userId]
      );
    } else {
      userId = `usr_fb_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, avatar_url, provider, provider_id)
         VALUES ($1, $2, $3, $4, $5, 'facebook', $6);`,
        [userId, email, `oauth_facebook_${fbId}`, fullName, avatarUrl, fbId]
      );
    }

    // 4. Sign JWT & set cookie
    const token = await signUserToken({
      id: userId,
      email,
      fullName,
      avatarUrl,
      provider: 'facebook',
    });

    const redirectTarget = new URL(returnUrl.startsWith('/') ? returnUrl : `/${returnUrl}`, origin);
    const response = NextResponse.redirect(redirectTarget.toString());

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
    console.error('Facebook callback exception:', error);
    return NextResponse.redirect(`${origin}/?auth=login&error=facebook_auth_exception`);
  }
}
