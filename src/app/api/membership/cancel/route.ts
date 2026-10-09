import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { cancelUserMembership, getUserMembership } from '@/lib/membership/repository';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để thao tác.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Hủy gia hạn qua giao diện người dùng';

    const membershipBefore = await getUserMembership(session.id);
    if (!membershipBefore) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy gói hội viên đang hoạt động.' },
        { status: 400 }
      );
    }

    const ok = await cancelUserMembership(session.id, reason);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Gói hội viên đã ở trạng thái hủy hoặc hết hạn.' },
        { status: 400 }
      );
    }

    const expiresDateStr = new Date(membershipBefore.expiresAt).toLocaleDateString('vi-VN');

    return NextResponse.json({
      success: true,
      message: `Đã hủy gia hạn thành công. Bạn không bị trừ tiền ở kỳ tới và vẫn được hưởng trọn vẹn đặc quyền Prime đến hết ngày ${expiresDateStr}.`,
      expiresAt: membershipBefore.expiresAt,
    });
  } catch (error: any) {
    console.error('Error in POST /api/membership/cancel:', error);
    return NextResponse.json({ success: false, error: 'Lỗi xử lý hủy gói hội viên.' }, { status: 500 });
  }
}
