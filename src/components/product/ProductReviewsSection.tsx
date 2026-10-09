'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  ShieldCheck,
  Edit3,
  X,
  Send,
  MessageCircle,
} from 'lucide-react';
import { ReviewItem, ProductReviewSummary } from '@/types/reviews';
import { useUserAuth } from '@/context/UserAuthContext';

interface ProductReviewsSectionProps {
  productId: string;
  productName?: string;
  className?: string;
}

// Bảng màu avatar ngẫu nhiên theo tên
const AVATAR_COLORS = [
  'bg-emerald-600 text-white',
  'bg-blue-600 text-white',
  'bg-amber-600 text-white',
  'bg-purple-600 text-white',
  'bg-teal-600 text-white',
  'bg-rose-600 text-white',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  } catch {
    return 'Gần đây';
  }
}

export default function ProductReviewsSection({
  productId,
  productName = 'Sản phẩm',
  className = '',
}: ProductReviewsSectionProps) {
  const { user } = useUserAuth();

  // State dữ liệu
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ProductReviewSummary>({
    averageRating: 4.8,
    totalReviews: 402,
    verifiedReviewsCount: 390,
    breakdown: [
      { stars: 5, count: 342, percentage: 85 },
      { stars: 4, count: 40, percentage: 10 },
      { stars: 3, count: 12, percentage: 3 },
      { stars: 2, count: 4, percentage: 1 },
      { stars: 1, count: 4, percentage: 1 },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  // Modal viết đánh giá
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formVariant, setFormVariant] = useState('Lốc 7 chai (330ml)');
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Tải tóm tắt đánh giá
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/summary?productId=${encodeURIComponent(productId)}`);
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data);
      }
    } catch (err) {
      console.warn('Error fetching review summary:', err);
    }
  }, [productId]);

  // Tải danh sách đánh giá
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        productId,
        sort: 'helpful',
        limit: '50',
      });
      if (selectedRating !== null) {
        params.set('rating', selectedRating.toString());
      }
      if (verifiedOnly) {
        params.set('verifiedOnly', 'true');
      }

      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setReviews(data.data);
      }
    } catch (err) {
      console.warn('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, selectedRating, verifiedOnly]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Bấm hữu ích
  const handleVoteHelpful = async (reviewId: string) => {
    if (votedMap[reviewId]) return;

    // Optimistic update
    setVotedMap((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );

    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, { method: 'POST' });
      const data = await res.json();
      if (data.success && typeof data.helpfulCount === 'number') {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r))
        );
      }
    } catch (err) {
      console.warn('Error voting helpful:', err);
    }
  };

  // Mở modal
  const handleOpenModal = () => {
    if (user) {
      setFormName(user.fullName || '');
      setFormPhone(user.phone || '');
    }
    setSubmitMessage(null);
    setIsModalOpen(true);
  };

  // Gửi đánh giá
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setSubmitMessage({ text: 'Vui lòng nhập tiêu đề tóm tắt đánh giá.', isError: true });
      return;
    }
    if (!formComment.trim()) {
      setSubmitMessage({ text: 'Vui lòng nhập nội dung nhận xét chi tiết.', isError: true });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: formName.trim() || 'Khách hàng Thái Sơn',
          customerPhone: formPhone.trim() || undefined,
          variantInfo: formVariant,
          rating: formRating,
          title: formTitle.trim(),
          comment: formComment.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitMessage({ text: data.message || 'Gửi đánh giá thành công! Cảm ơn bạn.' });
        // Tải lại danh sách
        fetchSummary();
        fetchReviews();
        // Reset form và tự đóng sau 1.5s
        setTimeout(() => {
          setIsModalOpen(false);
          setFormTitle('');
          setFormComment('');
          setSubmitMessage(null);
        }, 1500);
      } else {
        setSubmitMessage({ text: data.error || 'Có lỗi xảy ra, vui lòng thử lại.', isError: true });
      }
    } catch {
      setSubmitMessage({ text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tính số lượng cho filter pill
  const count5 = useMemo(() => summary.breakdown.find((b) => b.stars === 5)?.count || 0, [summary]);
  const count4 = useMemo(() => summary.breakdown.find((b) => b.stars === 4)?.count || 0, [summary]);

  return (
    <section className={`w-full py-12 lg:py-16 bg-white ${className}`} id="danh-gia-khach-hang">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── HEADER PHÂN ĐOẠN (Khớp 100% mẫu) ── */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            ĐÁNH GIÁ TỪ KHÁCH HÀNG
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 font-heading tracking-tight">
            Khách Hàng Nói Gì Về Sản Phẩm?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
            100% đánh giá thực tế từ khách hàng đã mua và trải nghiệm tại Thái Sơn Foods.
          </p>
        </div>

        {/* ── NỘI DUNG 2 CỘT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── CỘT TRÁI: ĐÁNH GIÁ CHUNG (Rating Summary Card) ── */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-7 sticky lg:top-24">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Đánh giá chung
            </h3>

            {/* Điểm số to bản & sao */}
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-4xl sm:text-5xl font-black text-gray-900 font-heading">
                {summary.averageRating.toFixed(1)}
              </span>
              <span className="text-lg text-gray-400 font-normal">/ 5.0</span>
              <div className="flex items-center gap-1 ml-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-5 h-5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-6">
              Dựa trên <span className="font-semibold text-gray-700">{summary.totalReviews}</span> lượt đánh giá từ khách hàng
            </p>

            {/* Biểu đồ 5 thanh phân bổ sao */}
            <div className="space-y-2.5 mb-7">
              {summary.breakdown.map((item) => (
                <div key={item.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-gray-600 font-medium shrink-0">
                    {item.stars} sao
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-gray-400 font-semibold shrink-0">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>

            {/* Nút bấm Viết đánh giá của bạn (Xanh đậm bo góc tròn) */}
            <button
              type="button"
              onClick={handleOpenModal}
              className="w-full py-3.5 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Edit3 className="w-4 h-4 transition-transform group-hover:scale-110" />
              Viết đánh giá của bạn
            </button>
          </div>

          {/* ── CỘT PHẢI: BỘ LỌC & DANH SÁCH REVIEW (Review List) ── */}
          <div className="lg:col-span-8">
            {/* Thanh nút lọc nhanh (Filter Pills) */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedRating(null);
                  setVerifiedOnly(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedRating === null && !verifiedOnly
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả ({summary.totalReviews})
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRating(5);
                  setVerifiedOnly(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedRating === 5 && !verifiedOnly
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                5 sao ({count5})
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRating(4);
                  setVerifiedOnly(false);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedRating === 4 && !verifiedOnly
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                4 sao ({count4})
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerifiedOnly((prev) => !prev);
                  setSelectedRating(null);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  verifiedOnly
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã mua hàng ({summary.verifiedReviewsCount})
              </button>
            </div>

            {/* Danh sách các thẻ đánh giá */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200" />
                      <div className="space-y-1.5 flex-1">
                        <div className="w-32 h-4 bg-gray-200 rounded" />
                        <div className="w-24 h-3 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <div className="w-3/4 h-4 bg-gray-200 rounded mb-2" />
                    <div className="w-full h-12 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-10 text-center text-gray-500">
                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">Chưa có đánh giá nào phù hợp với bộ lọc</p>
                <p className="text-xs text-gray-400 mt-1">Hãy là người đầu tiên để lại đánh giá cho sản phẩm này!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Hàng đầu: Avatar, Tên, Badge Đã mua hàng, Thời gian, Số sao */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar chữ cái */}
                        <div
                          className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shrink-0 shadow-sm ${getAvatarColor(
                            rev.customerName
                          )}`}
                        >
                          {rev.customerName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900">
                              {rev.customerName}
                            </h4>

                            {rev.isVerifiedBuyer && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/60">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Đã mua hàng
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-400 mt-0.5">
                            {rev.variantInfo} • {formatRelativeTime(rev.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* 5 sao vàng */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-gray-200 text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Tiêu đề in đậm (Khớp ảnh mẫu) */}
                    {rev.title && (
                      <h5 className="text-sm sm:text-base font-bold text-gray-900 mb-2 font-heading leading-snug">
                        {rev.title}
                      </h5>
                    )}

                    {/* Nội dung nhận xét chi tiết */}
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                      {rev.comment}
                    </p>

                    {/* Phản hồi từ CSKH Thái Sơn Foods (nếu có) */}
                    {rev.adminReply && (
                      <div className="bg-gray-50 border-l-4 border-emerald-600 p-3.5 rounded-r-xl mb-4 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Phản hồi từ Thái Sơn Foods
                        </div>
                        <p className="text-gray-600 leading-relaxed">{rev.adminReply}</p>
                      </div>
                    )}

                    {/* Hàng chân: Nút Hữu ích & Tem bảo chứng */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 text-xs">
                      <button
                        type="button"
                        onClick={() => handleVoteHelpful(rev.id)}
                        disabled={votedMap[rev.id]}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          votedMap[rev.id]
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${votedMap[rev.id] ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span>Hữu ích ({rev.helpfulCount})</span>
                      </button>

                      <div className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Thái Sơn Foods bảo chứng</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL VIẾT ĐÁNH GIÁ CỦA BẠN ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Nút đóng */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                <Edit3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-heading">
                Viết Đánh Giá Của Bạn
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Chia sẻ trải nghiệm thưởng thức {productName} cùng Thái Sơn Foods
              </p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Chọn số sao */}
              <div className="text-center pb-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  Chất lượng sản phẩm
                </label>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseEnter={() => setFormHoverRating(s)}
                      onMouseLeave={() => setFormHoverRating(0)}
                      onClick={() => setFormRating(s)}
                      className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-hidden cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= (formHoverRating || formRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-gray-200 text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-600 mt-1">
                  {formRating === 5 && 'Tuyệt vời — Rất hài lòng!'}
                  {formRating === 4 && 'Hài lòng — Vị ngon vừa vặn'}
                  {formRating === 3 && 'Bình thường — Cần cải thiện'}
                  {formRating === 2 && 'Chưa hài lòng'}
                  {formRating === 1 && 'Rất tệ'}
                </p>
              </div>

              {/* Họ tên & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Số điện thoại (Nhận huy hiệu Đã mua)
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Phân loại quy cách */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Quy cách đã trải nghiệm
                </label>
                <select
                  value={formVariant}
                  onChange={(e) => setFormVariant(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Lốc 7 chai (330ml)">Lốc 7 chai (330ml)</option>
                  <option value="Lốc 10 chai (330ml)">Lốc 10 chai (330ml)</option>
                  <option value="Thùng 24 chai (330ml)">Thùng 24 chai (330ml)</option>
                  <option value="Chai lẻ uống thử">Chai lẻ uống thử (330ml)</option>
                </select>
              </div>

              {/* Tiêu đề đánh giá */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tiêu đề đánh giá <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ví dụ: Vị bắp nếp béo thơm tự nhiên, cả nhà ai cũng mê"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Nội dung nhận xét */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nội dung nhận xét chi tiết <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Chia sẻ cảm nhận chân thực về độ ngọt, mùi thơm, nhiệt độ giao lạnh và sự tiện lợi..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Thông báo kết quả */}
              {submitMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    submitMessage.isError
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {submitMessage.text}
                </div>
              )}

              {/* Nút gửi */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá Của Bạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
