'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  SkipForward,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { useUserAuth } from '@/context/UserAuthContext';
import { formatPrice } from '@/lib/utils';
import { Subscription } from '@/types/membership';

export default function SubscriptionsManagementPage() {
  const router = useRouter();
  const { user, openAuthModal } = useUserAuth();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal đổi tần suất
  const [freqModalSub, setFreqModalSub] = useState<Subscription | null>(null);
  const [selectedFreq, setSelectedFreq] = useState<'1_WEEK' | '2_WEEKS' | '4_WEEKS'>('1_WEEK');
  const [selectedDay, setSelectedDay] = useState<number>(2);

  // Modal hủy hợp đồng
  const [cancelModalSub, setCancelModalSub] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('Không có nhu cầu dùng tiếp');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/subscriptions');
      const json = await res.json();
      if (json.success) {
        setSubscriptions(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const handleSkip = async (subId: string) => {
    try {
      setIsSubmitting(true);
      setActionMessage(null);
      const res = await fetch(`/api/subscriptions/${subId}/skip`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Khách hàng bấm bỏ qua kỳ này' }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMessage({ type: 'success', text: json.message });
        await fetchSubscriptions();
      } else {
        setActionMessage({ type: 'error', text: json.error || 'Lỗi bỏ qua kỳ giao.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Lỗi kết nối máy chủ.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFrequency = async () => {
    if (!freqModalSub) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/subscriptions/${freqModalSub.id}/frequency`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequency: selectedFreq,
          preferredDayOfWeek: selectedDay,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFreqModalSub(null);
        setActionMessage({ type: 'success', text: json.message });
        await fetchSubscriptions();
      } else {
        setActionMessage({ type: 'error', text: json.error || 'Lỗi cập nhật tần suất.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Lỗi kết nối.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSub = async () => {
    if (!cancelModalSub) return;
    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/subscriptions/${cancelModalSub.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const json = await res.json();
      if (json.success) {
        setCancelModalSub(null);
        setActionMessage({ type: 'success', text: 'Đã hủy hợp đồng giao định kỳ thành công.' });
        await fetchSubscriptions();
      } else {
        setActionMessage({ type: 'error', text: json.error || 'Lỗi hủy hợp đồng.' });
      }
    } catch {
      setActionMessage({ type: 'error', text: 'Lỗi kết nối.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-gray-200">
          <Calendar className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 font-heading">Quản Lý Giao Định Kỳ</h2>
          <p className="text-sm text-gray-600 mt-2 mb-6">
            Vui lòng đăng nhập hoặc xác thực số điện thoại để xem và điều chỉnh các hợp đồng giao sữa tươi định kỳ.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
          >
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              <RefreshCw className="w-3.5 h-3.5" />
              Subscribe & Save Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-heading mt-1">
              Lịch Giao Hàng Định Kỳ Của Bạn
            </h1>
          </div>
          <Link
            href="/member"
            className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold hover:bg-emerald-200 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Đặc quyền Thái Sơn Prime
          </Link>
        </div>

        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm ${
              actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Đang tải danh sách hợp đồng định kỳ...</div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-200 shadow-sm">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 font-heading">Chưa Có Hợp Đồng Giao Định Kỳ</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              Bạn chưa đăng ký sản phẩm định kỳ nào. Hãy khám phá 8 sản phẩm & combo sữa tươi giảm 15% giao tận nhà mỗi tuần!
            </p>
            <Link
              href="/#subscribe-save"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition"
            >
              Khám Phá Sản Phẩm Subscribe & Save <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {subscriptions.map((sub) => {
              const deliveryDate = new Date(sub.nextDeliveryDate);
              const dateStr = deliveryDate.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              });

              let totalCost = 0;
              sub.items.forEach((it) => {
                totalCost += it.finalPrice * it.quantity;
              });

              const isCancelled = sub.status === 'CANCELLED';

              return (
                <div
                  key={sub.id}
                  className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
                    isCancelled ? 'border-gray-200 opacity-60' : 'border-emerald-200 hover:shadow-md'
                  }`}
                >
                  {/* Header thẻ hợp đồng */}
                  <div className="bg-gray-50/80 p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-gray-200 text-gray-800">
                        #{sub.subscriptionCode}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isCancelled ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isCancelled ? 'ĐÃ HỦY' : 'ĐANG HOẠT ĐỘNG'}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Chu kỳ:{' '}
                      <span className="font-semibold text-gray-800">
                        {sub.deliveryFrequency === '1_WEEK'
                          ? 'Mỗi tuần'
                          : sub.deliveryFrequency === '2_WEEKS'
                          ? '2 tuần/lần'
                          : '4 tuần/lần'}{' '}
                        (Thứ {sub.preferredDayOfWeek === 8 ? 'CN' : sub.preferredDayOfWeek})
                      </span>
                    </div>
                  </div>

                  {/* Thân thẻ hợp đồng */}
                  <div className="p-6">
                    {!isCancelled && (
                      <div className="mb-6 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                            Kỳ giao tiếp theo dự kiến
                          </div>
                          <div className="text-lg font-bold text-emerald-950 mt-0.5 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            {dateStr} ({sub.preferredTimeSlot})
                          </div>
                        </div>

                        {/* Thao tác Bỏ qua kỳ này (1 chạm) */}
                        <button
                          disabled={isSubmitting}
                          onClick={() => handleSkip(sub.id)}
                          className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <SkipForward className="w-3.5 h-3.5" />
                          Bỏ Qua Kỳ Này (Skip)
                        </button>
                      </div>
                    )}

                    {/* Danh sách sản phẩm trong hợp đồng */}
                    <div className="space-y-3 mb-6">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Danh sách sản phẩm định kỳ:
                      </div>
                      {sub.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <span className="font-semibold text-gray-900">{it.name}</span>
                            <span className="text-xs text-gray-500 ml-2">({it.unit})</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-emerald-700">{formatPrice(it.finalPrice)}</span>
                            <span className="text-xs text-gray-500 line-through ml-2">
                              {formatPrice(it.priceSnapshot)}
                            </span>
                            <span className="text-xs font-semibold text-gray-700 ml-2">x {it.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Thông tin nhận hàng */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600 bg-gray-50 p-4 rounded-xl">
                      <div>
                        <div className="text-gray-400 font-medium">Người nhận:</div>
                        <div className="font-semibold text-gray-900 mt-0.5">
                          {sub.recipientName} — {sub.recipientPhone}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 font-medium">Địa chỉ giao xe lạnh:</div>
                        <div className="font-semibold text-gray-900 mt-0.5 line-clamp-1">
                          {sub.shippingAddress}, {sub.ward}, {sub.district}
                        </div>
                      </div>
                    </div>

                    {/* Tổng tiền & Các nút hành động */}
                    <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Tổng thanh toán mỗi kỳ:</span>
                        <div className="text-xl font-black text-gray-900">
                          {formatPrice(totalCost)}{' '}
                          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Miễn phí ship 100%
                          </span>
                        </div>
                      </div>

                      {!isCancelled && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedFreq(sub.deliveryFrequency);
                              setSelectedDay(sub.preferredDayOfWeek);
                              setFreqModalSub(sub);
                            }}
                            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Đổi tần suất
                          </button>

                          <button
                            onClick={() => setCancelModalSub(sub)}
                            className="px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition"
                          >
                            Hủy hợp đồng
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL ĐỔI TẦN SUẤT ── */}
      {freqModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setFreqModalSub(null)} className="absolute right-4 top-4 text-gray-400">✕</button>
            <h3 className="text-lg font-bold text-gray-900 font-heading">Đổi Tần Suất & Ngày Giao Hàng</h3>
            <p className="text-xs text-gray-500 mt-1">Hợp đồng #{freqModalSub.subscriptionCode}</p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tần suất giao:</label>
                <select
                  value={selectedFreq}
                  onChange={(e) => setSelectedFreq(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800"
                >
                  <option value="1_WEEK">Mỗi tuần (1 tuần / lần)</option>
                  <option value="2_WEEKS">2 tuần / lần</option>
                  <option value="4_WEEKS">Mỗi tháng (4 tuần / lần)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Ngày giao trong tuần:</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-800"
                >
                  <option value={2}>Thứ Hai (Sáng 08:00 - 12:00)</option>
                  <option value={3}>Thứ Ba</option>
                  <option value={4}>Thứ Tư</option>
                  <option value={5}>Thứ Năm</option>
                  <option value={6}>Thứ Sáu</option>
                  <option value={7}>Thứ Bảy</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setFreqModalSub(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold">
                Hủy
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleUpdateFrequency}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HỦY HỢP ĐỒNG ── */}
      {cancelModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button onClick={() => setCancelModalSub(null)} className="absolute right-4 top-4 text-gray-400">✕</button>
            <h3 className="text-lg font-bold text-gray-900 font-heading">Xác Nhận Hủy Hợp Đồng Giao Định Kỳ</h3>
            <p className="text-xs text-gray-500 mt-1">Hợp đồng #{cancelModalSub.subscriptionCode}</p>

            <p className="text-sm text-gray-600 mt-4">
              Bạn có chắc chắn muốn hủy đăng ký nhận sữa định kỳ? Bạn hoàn toàn có thể chọn <span className="font-bold text-emerald-700">Bỏ qua kỳ này</span> hoặc <span className="font-bold text-emerald-700">Đổi sang 2 tuần/lần</span> thay vì hủy.
            </p>

            <div className="mt-4">
              <label className="text-xs font-bold text-gray-700 block mb-1">Lý do hủy (Tùy chọn):</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="VD: Nhà còn nhiều sữa, sắp đi công tác..."
                className="w-full p-2.5 rounded-xl border border-gray-300 text-sm"
              />
            </div>

            <div className="mt-6 flex justify-between gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setCancelModalSub(null)} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold">
                Giữ lại hợp đồng
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleCancelSub}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition"
              >
                {isSubmitting ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
