import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { subscribeUserMembership, addLoyaltyPoints } from '@/lib/membership/repository';
import { MembershipTierCode } from '@/types/membership';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để đăng ký gói hội viên.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { tierCode, isTrial } = body;

    if (!tierCode || !['FREE', 'PRIME_MONTHLY', 'PRIME_YEARLY'].includes(tierCode)) {
      return NextResponse.json(
        { success: false, error: 'Mã gói hội viên không hợp lệ.' },
        { status: 400 }
      );
    }

    const newMembership = await subscribeUserMembership(
      session.id,
      tierCode as MembershipTierCode,
      Boolean(isTrial)
    );

    // Thưởng 50 điểm chào mừng khi kích hoạt gói Prime
    if (tierCode !== 'FREE') {
      try {
        await addLoyaltyPoints(
          session.id,
          50,
          'SIGNUP_BONUS',
          'Thưởng 50 điểm chào mừng gia nhập Hội viên Thái Sơn Prime!'
        );
      } catch (lErr) {
        console.warn('Could not add signup bonus points:', lErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: isTrial
        ? 'Kích hoạt 30 ngày dùng thử Thái Sơn Prime thành công!'
        : 'Đăng ký gói hội viên thành công!',
      data: newMembership,
    });
  } catch (error: any) {
    console.error('Error in POST /api/membership/subscribe:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi đăng ký gói hội viên.' }, { status: 500 });
  }
}
