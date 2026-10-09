import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { adminUpdateReview } from '@/lib/reviews/repository';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    const { id } = await props.params;
    const body = await req.json();

    const ok = await adminUpdateReview(id, {
      status: body.status,
      adminReply: body.adminReply,
      adminUsername: session.username || session.fullName || 'Admin',
    });

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đánh giá' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/reviews/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi cập nhật đánh giá' },
      { status: 500 }
    );
  }
}
