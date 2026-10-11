import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { updateSubscriptionAddress } from '@/lib/membership/repository';

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
    const body = await req.json();
    const { recipientName, recipientPhone, shippingAddress, province, district, ward, distanceKm } = body;

    if (!recipientName || !recipientPhone || !shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.' },
        { status: 400 }
      );
    }

    const updatedSubscription = await updateSubscriptionAddress(id, session.id, {
      recipientName,
      recipientPhone,
      shippingAddress,
      province,
      district,
      ward,
      distanceKm: distanceKm ? Number(distanceKm) : 5.0,
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật địa chỉ nhận hàng định kỳ thành công!',
      data: updatedSubscription,
    });
  } catch (error: any) {
    console.error('Error updating subscription address:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi cập nhật địa chỉ giao hàng định kỳ.' },
      { status: 400 }
    );
  }
}
