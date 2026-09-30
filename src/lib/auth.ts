import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tsf_super_secret_jwt_key_2026_thai_son_foods'
);

export const ADMIN_COOKIE_NAME = 'tsf_admin_token';
export const TOKEN_EXPIRY_DAYS = 7;

export interface AdminJWTPayload {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: string;
}

/**
 * Hash a plain text password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain text password with hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token containing admin information
 */
export async function signAdminToken(payload: AdminJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode an admin JWT token
 */
export async function verifyAdminToken(token: string): Promise<AdminJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      username: payload.username as string,
      email: payload.email as string,
      fullName: (payload.fullName as string) || null,
      role: (payload.role as string) || 'ADMIN',
    };
  } catch {
    return null;
  }
}
/**
 * Get current admin session from server components or route handlers
 */
export async function getAdminSession(): Promise<AdminJWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyAdminToken(token);
  } catch {
    return null;
  }
}

export const USER_COOKIE_NAME = 'tsf_user_session';

export interface UserJWTPayload {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  provider?: string | null;
}

/**
 * Sign a JWT token containing customer user information
 */
export async function signUserToken(payload: UserJWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_EXPIRY_DAYS}d`)
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a customer user JWT token
 */
export async function verifyUserToken(token: string): Promise<UserJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      fullName: (payload.fullName as string) || '',
      phone: (payload.phone as string) || null,
      avatarUrl: (payload.avatarUrl as string) || null,
      provider: (payload.provider as string) || 'local',
    };
  } catch {
    return null;
  }
}

/**
 * Get current customer user session from server components or route handlers
 */
export async function getUserSession(): Promise<UserJWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(USER_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyUserToken(token);
  } catch {
    return null;
  }
}

/**
 * Safely resolve application origin for redirects and OAuth callbacks.
 * Strictly prevents 0.0.0.0 internal binding addresses from leaking into browser redirects, which causes ERR_ADDRESS_INVALID.
 */
export function getSafeAppOrigin(req: { headers: { get: (name: string) => string | null }; nextUrl?: { origin?: string } }): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') || 'http';

  if (host && !host.includes('0.0.0.0')) {
    return `${proto}://${host}`;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl && !envUrl.includes('0.0.0.0')) {
    return envUrl.replace(/\/+$/, '');
  }

  const nextOrigin = req.nextUrl?.origin;
  if (nextOrigin && !nextOrigin.includes('0.0.0.0')) {
    return nextOrigin;
  }

  return 'http://localhost:3000';
}


