import { NextRequest, NextResponse } from 'next/server';
import { recommendStore } from '@/lib/storeRecommender';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, mode = 'delivery', cartItems = [], previousStoreCode, scheduledAt } = body;

    // Kiểm tra tính hợp lệ của tọa độ GPS
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tọa độ GPS không hợp lệ. Vui lòng cung cấp vĩ độ (lat) và kinh độ (lng).',
        },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tọa độ GPS nằm ngoài phạm vi địa lý hợp lệ.',
        },
        { status: 400 }
      );
    }

    const result = await recommendStore({
      lat,
      lng,
      mode,
      cartItems: Array.isArray(cartItems) ? cartItems : [],
      previousStoreCode,
      scheduledAt,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[API /api/stores/recommend] Lỗi đề xuất cửa hàng:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Đã xảy ra lỗi khi tìm kiếm cửa hàng gần nhất. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
