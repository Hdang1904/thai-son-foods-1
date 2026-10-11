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
    return NextResponse.redirect(`${origin}/?auth=login&error=google_no_code`);
  }

  try {
    await initDatabase();
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${origin}/api/auth/callback/google`;

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.redirect(`${origin}/?auth=login&error=google_missing_credentials`);
    }

    // 1. Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      return NextResponse.redirect(`${origin}/?auth=login&error=google_token_failed`);
    }

    // 2. Fetch user profile from Google
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userinfoRes.json();

    if (!profile.email) {
      return NextResponse.redirect(`${origin}/?auth=login&error=google_no_email`);
    }

    const email = profile.email.toLowerCase().trim();
    const fullName = profile.name || email.split('@')[0];
    const avatarUrl = profile.picture || null;
    const googleSub = profile.sub || null;

    // 3. Upsert into users table
    const existing = await query('SELECT id, full_name, phone, address, province, district, ward FROM users WHERE email = $1 LIMIT 1;', [email]);

    let userId = '';
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await query(
        `UPDATE users 
         SET full_name = COALESCE(NULLIF(full_name, ''), $1),
             avatar_url = COALESCE($2, avatar_url),
             provider = 'google',
             provider_id = COALESCE($3, provider_id),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4;`,
        [fullName, avatarUrl, googleSub, userId]
      );
    } else {
      userId = `usr_gg_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      await query(
        `INSERT INTO users (id, email, password_hash, full_name, avatar_url, provider, provider_id)
         VALUES ($1, $2, $3, $4, $5, 'google', $6);`,
        [userId, email, `oauth_google_${googleSub || Date.now()}`, fullName, avatarUrl, googleSub]
      );
    }

    // 4. Sign user JWT & set cookie
    const token = await signUserToken({
      id: userId,
      email,
      fullName,
      avatarUrl,
      provider: 'google',
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
    console.error('Google callback exception:', error);
    return NextResponse.redirect(`${origin}/?auth=login&error=google_auth_exception`);
  }
}
