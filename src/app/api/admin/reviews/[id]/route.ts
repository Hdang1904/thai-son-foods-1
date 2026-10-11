import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { adminUpdateReview, adminDeleteReview } from '@/lib/reviews/repository';

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

    // Kiểm tra quyền đổi trạng thái
    if (body.status !== undefined && !hasPermission(session, 'reviews.moderate')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền kiểm duyệt đánh giá (yêu cầu reviews.moderate)' },
        { status: 403 }
      );
    }

    // Kiểm tra quyền phản hồi CSKH
    if (body.adminReply !== undefined && !hasPermission(session, 'reviews.reply')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền phản hồi đánh giá (yêu cầu reviews.reply)' },
        { status: 403 }
      );
    }

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

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập quản trị' }, { status: 401 });
    }

    if (!hasPermission(session, 'reviews.moderate')) {
      return NextResponse.json(
        { success: false, error: 'Không có quyền xóa đánh giá (yêu cầu reviews.moderate)' },
        { status: 403 }
      );
    }

    const { id } = await props.params;
    const ok = await adminDeleteReview(id);

    if (!ok) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đánh giá để xóa' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã xóa đánh giá thành công',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/reviews/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi xóa đánh giá' },
      { status: 500 }
    );
  }
}
