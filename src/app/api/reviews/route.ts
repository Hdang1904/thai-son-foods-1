import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import {
  getProductReviews,
  createProductReview,
} from '@/lib/reviews/repository';
import { CreateReviewInput } from '@/types/reviews';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const ratingParam = searchParams.get('rating');
    const rating = ratingParam ? parseInt(ratingParam, 10) : undefined;
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true';
    const hasImagesOnly = searchParams.get('hasImagesOnly') === 'true';
    const sort = (searchParams.get('sort') as 'newest' | 'helpful') || 'helpful';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const data = await getProductReviews(productId, {
      rating,
      verifiedOnly,
      hasImagesOnly,
      sort,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: data.reviews,
      total: data.total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Error in GET /api/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi tải danh sách đánh giá: ' + (error?.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    const body = await req.json();

    const {
      productId,
      customerName,
      customerPhone,
      variantInfo,
      rating,
      title,
      comment,
      images,
      orderId,
    } = body;

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Mã sản phẩm không hợp lệ' },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn số sao đánh giá từ 1 đến 5' },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập tiêu đề đánh giá' },
        { status: 400 }
      );
    }

    if (!comment || !comment.trim()) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập nội dung đánh giá' },
        { status: 400 }
      );
    }

    const input: CreateReviewInput = {
      productId,
      customerName: customerName || session?.fullName || 'Khách hàng Thái Sơn',
      customerPhone: customerPhone || session?.phone || undefined,
      variantInfo,
      rating: Number(rating),
      title: title.trim(),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      orderId,
    };

    const result = await createProductReview(input, session?.id);

    return NextResponse.json({
      success: true,
      message: result.isVerified
        ? 'Cảm ơn bạn! Đánh giá đã được ghi nhận với huy hiệu Đã mua hàng.'
        : 'Cảm ơn bạn đã gửi đánh giá cho sản phẩm!',
      data: result.review,
      isVerifiedBuyer: result.isVerified,
    });
  } catch (error: any) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi gửi đánh giá: ' + (error?.message || 'Lỗi hệ thống') },
      { status: 500 }
    );
  }
}
