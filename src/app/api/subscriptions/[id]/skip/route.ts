import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { skipSubscriptionNextDelivery } from '@/lib/membership/repository';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json({ success: false, error: 'Chưa đăng nhập.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Khách hàng bấm bỏ qua kỳ này';

    const result = await skipSubscriptionNextDelivery(id, session.id, reason);

    const formattedDate = new Date(result.newNextDeliveryDate).toLocaleDateString('vi-VN');

    return NextResponse.json({
      success: true,
      message: `Đã bỏ qua kỳ giao hàng thành công! Kỳ giao tiếp theo của bạn sẽ là ngày ${formattedDate}.`,
      newNextDeliveryDate: result.newNextDeliveryDate,
    });
  } catch (error: any) {
    console.error('Error in skip subscription:', error);
    return NextResponse.json({ success: false, error: error.message || 'Lỗi thao tác bỏ qua kỳ giao.' }, { status: 400 });
  }
}
