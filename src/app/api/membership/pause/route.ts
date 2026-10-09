import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { pauseUserMembership } from '@/lib/membership/repository';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để tạm dừng gói hội viên.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const months = Math.min(3, Math.max(1, Number(body.months) || 1));

    const ok = await pauseUserMembership(session.id, months);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy gói hội viên đang hoạt động để tạm dừng.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã tạm dừng gói hội viên trong ${months} tháng. Quyền lợi và điểm tích lũy được bảo lưu nguyên vẹn.`,
    });
  } catch (error: any) {
    console.error('Error in POST /api/membership/pause:', error);
    return NextResponse.json({ success: false, error: 'Lỗi tạm dừng gói hội viên.' }, { status: 500 });
  }
}
