import { NextRequest, NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { adminUpdateReview, adminDeleteReview } from '@/lib/reviews/repository';
import { writeAuditLog } from '@/lib/audit';

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

    // Kiểm tra đầu vào: trạng thái thuộc danh sách hợp lệ, phản hồi là chuỗi có giới hạn độ dài
    if (body.status !== undefined && !['APPROVED', 'PENDING', 'HIDDEN'].includes(body.status)) {
      return NextResponse.json({ success: false, error: 'Trạng thái đánh giá không hợp lệ (APPROVED / PENDING / HIDDEN).' }, { status: 400 });
    }
    if (body.adminReply !== undefined) {
      if (typeof body.adminReply !== 'string' || body.adminReply.length > 2000) {
        return NextResponse.json({ success: false, error: 'Nội dung phản hồi phải là văn bản tối đa 2.000 ký tự.' }, { status: 400 });
      }
      body.adminReply = body.adminReply.trim();
    }
    if (body.status === undefined && body.adminReply === undefined) {
      return NextResponse.json({ success: false, error: 'Không có thay đổi nào để cập nhật.' }, { status: 400 });
    }

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
    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: body.status !== undefined ? 'REVIEW_MODERATE' : 'REVIEW_REPLY',
      entityType: 'REVIEW',
      entityId: id,
      afterJson: { status: body.status, replied: body.adminReply !== undefined },
    });

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
    await writeAuditLog({
      adminId: session.id,
      adminUsername: session.username,
      role: session.role,
      action: 'REVIEW_DELETE',
      entityType: 'REVIEW',
      entityId: id,
    });

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
