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
  averageRating: number;       // Điểm trung bình làm tròn 1 chữ số, 0 nếu chưa có đánh giá
  totalReviews: number;        // Tổng số đánh giá hợp lệ (APPROVED), 0 nếu chưa có
  verifiedReviewsCount: number; // Số đánh giá từ người mua đã xác thực
  breakdown: RatingBreakdownItem[]; // Thống kê 1-5 sao từ dữ liệu thật
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
