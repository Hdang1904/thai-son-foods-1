/**
 * Type & Interface cho Phân hệ Đánh giá & Phản hồi Khách hàng (Product Reviews)
 */

export interface ReviewItem {
  id: string;
  productId: string;
  userId?: string | null;
  orderId?: string | null;
  customerName: string;
  variantInfo: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerifiedBuyer: boolean;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN';
  helpfulCount: number;
  adminReply?: string | null;
  adminRepliedAt?: string | null;
  createdAt: string;
}

export interface RatingBreakdownItem {
  stars: number;
  count: number;
  percentage: number;
}

export interface ProductReviewSummary {
  averageRating: number;       // Ví dụ: 4.8
  totalReviews: number;        // Ví dụ: 402
  verifiedReviewsCount: number; // Ví dụ: 390
  breakdown: RatingBreakdownItem[]; // 5 sao (85%), 4 sao (10%)...
  hasUserReviewed?: boolean;
}

export interface CreateReviewInput {
  productId: string;
  customerName: string;
  customerPhone?: string;
  variantInfo?: string;
  rating: number;
  title: string;
  comment: string;
  images?: string[];
  orderId?: string;
}

export interface ReviewFilterOptions {
  rating?: number;             // Lọc theo số sao: 5, 4, 3, 2, 1
  verifiedOnly?: boolean;      // Chỉ lấy đánh giá Đã mua hàng
  hasImagesOnly?: boolean;     // Chỉ lấy đánh giá có ảnh
  sort?: 'newest' | 'helpful'; // Sắp xếp: Mới nhất hoặc Hữu ích nhất
  page?: number;
  limit?: number;
}
