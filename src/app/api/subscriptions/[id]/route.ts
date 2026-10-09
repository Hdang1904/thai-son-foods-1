import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { getSubscriptionById, cancelSubscription } from '@/lib/membership/repository';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;
    const subscription = await getSubscriptionById(id, session.id);
    if (!subscription) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hợp đồng giao định kỳ.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: subscription,
    });
  } catch (error: any) {
    console.error('Error in GET /api/subscriptions/[id]:', error);
    return NextResponse.json({ success: false, error: 'Lỗi tải thông tin hợp đồng.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Khách hủy hợp đồng';

    const ok = await cancelSubscription(id, session.id, reason);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy hợp đồng hoặc đã bị hủy.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Hủy hợp đồng giao định kỳ thành công.',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/subscriptions/[id]:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hủy hợp đồng giao định kỳ.' }, { status: 500 });
  }
}
