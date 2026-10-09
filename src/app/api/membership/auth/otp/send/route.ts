import { NextRequest, NextResponse } from 'next/server';
import { generateCustomerOtp } from '@/lib/membership/otp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp số điện thoại.' },
        { status: 400 }
      );
    }

    const result = generateCustomerOtp(phone.toString());
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mã xác thực OTP đã được gửi đến số điện thoại của bạn (qua Zalo ZNS / SMS).',
    });
  } catch (error: any) {
    console.error('Error in send customer OTP:', error);
    return NextResponse.json({ success: false, error: 'Lỗi gửi mã OTP. Vui lòng thử lại.' }, { status: 500 });
  }
}
