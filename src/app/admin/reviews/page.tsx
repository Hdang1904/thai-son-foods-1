'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  MessageCircle,
  ArrowLeft,
  X,
  Send,
  ThumbsUp,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface AdminReviewRow {
  id: string;
  productId: string;
  customerName: string;
  customerPhone?: string;
  variantInfo: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedBuyer: boolean;
  status: 'APPROVED' | 'PENDING' | 'HIDDEN';
  helpfulCount: number;
  adminReply?: string;
  adminRepliedAt?: string;
  createdAt: string;
}

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal phản hồi CSKH
  const [activeReview, setActiveReview] = useState<AdminReviewRow | null>(null);
  const [replyText, setReplyText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (searchQuery.trim()) params.set('productId', searchQuery.trim());

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filterStatus]);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'HIDDEN') => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      } else {
        alert(data.error || 'Cập nhật thất bại');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    }
  };

  const handleOpenReplyModal = (review: AdminReviewRow) => {
    setActiveReview(review);
    setReplyText(review.adminReply || '');
  };

  const handleSendReply = async () => {
    if (!activeReview || !replyText.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${activeReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminReply: replyText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === activeReview.id ? { ...r, adminReply: replyText.trim(), adminRepliedAt: new Date().toISOString() } : r
          )
        );
        setActiveReview(null);
        setReplyText('');
      } else {
        alert(data.error || 'Lỗi gửi phản hồi');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setActionLoading(false);
    }
  };

  // Thống kê nhanh
  const totalCount = reviews.length;
  const verifiedCount = reviews.filter((r) => r.isVerifiedBuyer).length;
  const count5Stars = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-emerald-700 transition font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Bảng điều khiển
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-heading flex items-center gap-2.5">
              <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
              Quản Trị Đánh Giá & Phản Hồi Sản Phẩm
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Kiểm duyệt, theo dõi điểm hài lòng khách hàng và gửi phản hồi CSKH từ thương hiệu.
            </p>
          </div>

          <button
            onClick={fetchReviews}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới dữ liệu
          </button>
        </div>

        {/* 3 Thẻ thống kê nhanh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="text-xs font-semibold text-gray-500 mb-1">Tổng Số Đánh Giá</div>
            <div className="text-3xl font-black text-gray-900">{totalCount}</div>
            <p className="text-[11px] text-gray-400 mt-1">Ghi nhận trên toàn hệ thống</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Đã Mua Hàng (Verified)
            </div>
            <div className="text-3xl font-black text-emerald-700">{verifiedCount}</div>
            <p className="text-[11px] text-gray-400 mt-1">Khách có đơn hàng hoàn tất</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
            <div className="text-xs font-semibold text-amber-600 mb-1 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400" /> Đánh Giá 5 Sao
            </div>
            <div className="text-3xl font-black text-amber-600">{count5Stars}</div>
            <p className="text-[11px] text-gray-400 mt-1">Khách hàng rất hài lòng</p>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'APPROVED', 'HIDDEN'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterStatus === st
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st === 'ALL' && 'Tất cả'}
                {st === 'APPROVED' && 'Đang hiển thị'}
                {st === 'HIDDEN' && 'Đang ẩn'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchReviews()}
              placeholder="Tìm theo mã sản phẩm..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>
        </div>

        {/* Danh sách bảng reviews */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-gray-500">Đang tải danh sách đánh giá...</div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400">Không tìm thấy đánh giá nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-[11px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Khách Hàng</th>
                    <th className="py-3.5 px-4">Sản Phẩm & Phân Loại</th>
                    <th className="py-3.5 px-4">Đánh Giá & Nhận Xét</th>
                    <th className="py-3.5 px-4 text-center">Hữu Ích</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/60 transition">
                      {/* Khách hàng */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-bold text-gray-900">{r.customerName}</div>
                        {r.customerPhone && (
                          <div className="text-[11px] text-gray-400">{r.customerPhone}</div>
                        )}
                        {r.isVerifiedBuyer && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Đã mua hàng
                          </span>
                        )}
                      </td>

                      {/* Sản phẩm */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-gray-800">{r.productId}</div>
                        <div className="text-[11px] text-gray-500">{r.variantInfo}</div>
                      </td>

                      {/* Nội dung */}
                      <td className="py-4 px-4 align-top max-w-md">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= r.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="font-bold text-gray-900 mb-0.5">{r.title}</div>
                        <p className="text-gray-600 line-clamp-3">{r.comment}</p>

                        {/* Phản hồi hiện tại */}
                        {r.adminReply && (
                          <div className="mt-2 bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 text-[11px]">
                            <span className="font-bold text-emerald-800">Thái Sơn Foods: </span>
                            <span className="text-emerald-900">{r.adminReply}</span>
                          </div>
                        )}
                      </td>

                      {/* Hữu ích */}
                      <td className="py-4 px-4 align-top text-center font-bold text-gray-700">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-gray-400" /> {r.helpfulCount}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-4 align-top text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            r.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r.status === 'APPROVED' ? 'Hiển thị' : 'Đang ẩn'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 align-top text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenReplyModal(r)}
                          className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-bold transition cursor-pointer"
                        >
                          Phản hồi
                        </button>

                        {r.status === 'APPROVED' ? (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'HIDDEN')}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition cursor-pointer"
                          >
                            Ẩn
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold transition cursor-pointer"
                          >
                            Hiện
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PHẢN HỒI CSKH */}
      {activeReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveReview(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-gray-900 font-heading mb-1 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-700" />
              Phản Hồi Đánh Giá Khách Hàng
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Khách hàng: <span className="font-bold text-gray-800">{activeReview.customerName}</span> ({activeReview.rating} sao)
            </p>

            <div className="bg-gray-50 p-3 rounded-xl mb-4 text-xs text-gray-600">
              <div className="font-bold text-gray-800 mb-0.5">{activeReview.title}</div>
              <p className="line-clamp-3 italic">&quot;{activeReview.comment}&quot;</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nội dung phản hồi chính thức từ Thái Sơn Foods:
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Dạ Thái Sơn Foods xin cảm ơn quý khách đã tin dùng sản phẩm..."
                className="w-full p-3 text-xs rounded-xl border border-gray-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setActiveReview(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={actionLoading || !replyText.trim()}
                onClick={handleSendReply}
                className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Đang gửi...' : 'Lưu Phản Hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
