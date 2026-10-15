import { resolveJwtSecret } from '@/lib/jwtSecret';
import crypto from 'node:crypto';
import { query } from '@/lib/db';
import { PARTNER_CONFIG } from '@/config/partner';

const getSignSecret = () => resolveJwtSecret();

/**
 * Sinh mã Đối tác ngẫu nhiên duy nhất dạng TSF-CTV-XXXX
 */
export function generatePartnerCode(type: 'CTV' | 'DEALER' = 'CTV'): string {
  const prefix = type === 'DEALER' ? PARTNER_CONFIG.REFERRAL.DEALER_PREFIX : PARTNER_CONFIG.REFERRAL.CODE_PREFIX;
  const randNum = crypto.randomInt(1000, 9999);
  const randHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}${randNum}${randHex}`;
}

/**
 * Ký mã ref thành chuỗi cookie an toàn chống sửa đổi: "CODE.SIGNATURE"
 */
export function signReferralCookie(code: string): string {
  const hmac = crypto.createHmac('sha256', getSignSecret()).update(code).digest('hex').substring(0, 16);
  return `${code}.${hmac}`;
}

/**
 * Xác thực chuỗi cookie: nếu chữ ký hợp lệ trả về mã code, ngược lại null
 */
export function verifyReferralCookie(cookieVal: string | undefined | null): string | null {
  if (!cookieVal || !cookieVal.includes('.')) return null;
  const [code, sig] = cookieVal.split('.');
  if (!code || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', getSignSecret()).update(code).digest('hex').substring(0, 16);
  if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
    return code;
  }
  return null;
}

/**
 * Ghi nhận lượt click giới thiệu vào bảng referral_clicks
 */
export async function trackReferralClick(params: {
  referralCode: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  refererUrl?: string | null;
  landingPage?: string | null;
}): Promise<{ success: boolean; partnerId?: string; partnerCode?: string }> {
  try {
    const cleanCode = params.referralCode.trim();
    // 1. Kiểm tra mã đối tác trong DB
    const res = await query(
      `SELECT id, partner_code, lifecycle_status FROM partner_profiles WHERE UPPER(partner_code) = UPPER($1) LIMIT 1;`,
      [cleanCode]
    );

    if (res.rows.length === 0) {
      return { success: false };
    }

    const partner = res.rows[0];
    const clickId = `clk_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 2. Ghi nhận click (bất đồng bộ)
    await query(
      `INSERT INTO referral_clicks (id, partner_id, referral_code, ip_address, user_agent, referer_url, landing_page)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [
        clickId,
        partner.id,
        partner.partner_code,
        params.ipAddress || null,
        params.userAgent || null,
        params.refererUrl || null,
        params.landingPage || null,
      ]
    );

    return {
      success: true,
      partnerId: partner.id,
      partnerCode: partner.partner_code,
    };
  } catch (error) {
    console.error('[ReferralEngine] Error tracking click:', error);
    return { success: false };
  }
}
