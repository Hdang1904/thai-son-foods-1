import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { hashPassword, signUserToken, USER_COOKIE_NAME, TOKEN_EXPIRY_DAYS } from '@/lib/auth';
import { verifyOtp } from '@/lib/partner/otp';
import { generatePartnerCode } from '@/lib/partner/referral';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phone, email, password, otpCode } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập họ và tên' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ success: false, error: 'Vui lòng nhập số điện thoại' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/[\s\-\.]/g, '');
    const cleanEmail = (email || '').trim().toLowerCase() || `${cleanPhone}@partner.thaisonfoods.vn`;

    // 1. Xác minh mã OTP
    const otpCheck = verifyOtp(cleanPhone, otpCode || '');
    if (!otpCheck.success) {
      return NextResponse.json({ success: false, error: otpCheck.error || 'Mã OTP không hợp lệ' }, { status: 400 });
    }

    // 2. Kiểm tra xem số điện thoại đã đăng ký Partner chưa
    const existingPartner = await query(
      `SELECT id, partner_code, lifecycle_status FROM partner_profiles WHERE phone = $1 LIMIT 1;`,
      [cleanPhone]
    );

    if (existingPartner.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Số điện thoại này đã được đăng ký làm đối tác trên hệ thống.',
          code: 'PARTNER_EXISTS',
        },
        { status: 409 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN;');

      // 3. Tìm hoặc tạo tài khoản trong bảng users
      let userId: string;
      const userRes = await client.query(
        `SELECT id, full_name, email, phone FROM users WHERE phone = $1 OR email = $2 LIMIT 1;`,
        [cleanPhone, cleanEmail]
      );

      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const pwdHash = await hashPassword(password || `P@ss${cleanPhone.slice(-4)}`);
        await client.query(
          `INSERT INTO users (id, email, password_hash, full_name, phone)
           VALUES ($1, $2, $3, $4, $5);`,
          [userId, cleanEmail, pwdHash, fullName.trim(), cleanPhone]
        );
      }

      // 4. Sinh mã đối tác duy nhất
      let partnerCode = generatePartnerCode('CTV');
      let isCodeUnique = false;
      while (!isCodeUnique) {
        const checkCode = await client.query(`SELECT 1 FROM partner_profiles WHERE partner_code = $1;`, [partnerCode]);
        if (checkCode.rows.length === 0) {
          isCodeUnique = true;
        } else {
          partnerCode = generatePartnerCode('CTV');
        }
      }

      // 5. Tạo hồ sơ Đối tác (Trạng thái khởi đầu: LITE)
      const partnerId = `ptn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      await client.query(
        `INSERT INTO partner_profiles (
          id, user_id, partner_code, partner_type, lifecycle_status, phone, full_name, email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          partnerId,
          userId,
          partnerCode,
          'CTV',
          'LITE',
          cleanPhone,
          fullName.trim(),
          cleanEmail,
        ]
      );

      await client.query('COMMIT;');

      // Ghi audit log
      await writeAuditLog({
        action: 'PARTNER_REGISTER_LITE',
        entityType: 'PARTNER',
        entityId: partnerId,
        afterJson: { partnerCode, phone: cleanPhone, fullName: fullName.trim() },
      });

      // 6. Ký phiên đăng nhập người dùng (Cookie)
      const sessionPayload = {
        id: userId,
        email: cleanEmail,
        fullName: fullName.trim(),
        phone: cleanPhone,
      };
      const token = await signUserToken(sessionPayload);

      const response = NextResponse.json({
        success: true,
        message: 'Đăng ký đối tác thành công! Bạn đã được cấp mã giới thiệu.',
        partner: {
          id: partnerId,
          partnerCode,
          partnerType: 'CTV',
          lifecycleStatus: 'LITE',
          fullName: fullName.trim(),
          phone: cleanPhone,
        },
      });

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
    } catch (txErr) {
      await client.query('ROLLBACK;');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error registering partner:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi khi đăng ký đối tác' }, { status: 500 });
  }
}
