import { NextRequest, NextResponse } from 'next/server';
import { getProductReviewSummary } from '@/lib/reviews/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || searchParams.get('slug') || '';

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã sản phẩm (productId)' },
        { status: 400 }
      );
    }

    const summary = await getProductReviewSummary(productId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error('Error in GET /api/reviews/summary:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi tải tóm tắt đánh giá: ' + (error?.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}
