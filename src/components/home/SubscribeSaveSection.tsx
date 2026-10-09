'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Star,
  ShieldCheck,
  Truck,
  X,
  Phone,
  Calendar,
  Send,
  Lock,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { useUserAuth } from '@/context/UserAuthContext';
import { MEMBERSHIP_CONFIG } from '@/config/membership';

// Tất cả item dùng CHUNG ĐÚNG 1 ẢNH chuẩn theo yêu cầu của người dùng
const UNIFIED_PRODUCT_IMAGE = '/images/products/1200x900-sb1.jpg';

interface SubscribeItem {
  id: string;
  nameVi: string;
  nameEn: string;
  unitVi: string;
  unitEn: string;
  retailPrice: number;
  discountRate: number; // 15%
  rating: number;
  reviewCount: number;
  badgeText: string;
}

const SUBSCRIBE_ITEMS: SubscribeItem[] = [
  {
    id: 'sub-sb-01',
    nameVi: 'Sữa Bắp Nếp Tươi Thái Sơn (Lốc 7 chai 330ml)',
    nameEn: 'Thai Son Fresh Sticky Corn Milk (Pack of 7)',
    unitVi: 'Lốc 7 chai',
    unitEn: 'Pack of 7',
    retailPrice: 126000,
    discountRate: 15,
    rating: 5.0,
    reviewCount: 932,
    badgeText: '5% | 15%',
  },
  {
    id: 'sub-shs-01',
    nameVi: 'Sữa Hạt Sen Mekong Xanh (Lốc 7 chai 330ml)',
    nameEn: 'Mekong Green Lotus Seed Milk (Pack of 7)',
    unitVi: 'Lốc 7 chai',
    unitEn: 'Pack of 7',
    retailPrice: 126000,
    discountRate: 15,
    rating: 4.9,
    reviewCount: 680,
    badgeText: '5% | 15%',
  },
  {
    id: 'sub-sgl-01',
    nameVi: 'Sữa Gạo Lứt Huyết Rồng (Lốc 7 chai 330ml)',
    nameEn: 'Brown Rice Nutritious Milk (Pack of 7)',
    unitVi: 'Lốc 7 chai',
    unitEn: 'Pack of 7',
    retailPrice: 126000,
    discountRate: 15,
    rating: 4.9,
    reviewCount: 524,
    badgeText: '5% | 15%',
  },
  {
    id: 'sub-sl-01',
    nameVi: 'Sữa Đậu Nành Tươi Lá Dứa (Lốc 7 chai 330ml)',
    nameEn: 'Fresh Soy Milk with Pandan (Pack of 7)',
    unitVi: 'Lốc 7 chai',
    unitEn: 'Pack of 7',
    retailPrice: 126000,
    discountRate: 15,
    rating: 4.8,
    reviewCount: 388,
    badgeText: '5% | 15%',
  },
  {
    id: 'sub-md-01',
    nameVi: 'Sữa Mè Đen Tự Nhiên (Lốc 7 chai 330ml)',
    nameEn: 'Black Sesame Fresh Milk (Pack of 7)',
    unitVi: 'Lốc 7 chai',
    unitEn: 'Pack of 7',
    retailPrice: 126000,
    discountRate: 15,
    rating: 4.9,
    reviewCount: 412,
    badgeText: '5% | 15%',
  },
  {
    id: 'sub-family-01',
    nameVi: 'Combo Năng Lượng Gia Đình 3 Vị (Thùng 15 chai)',
    nameEn: 'Family Healthy Drink Pack (Box of 15)',
    unitVi: 'Thùng 15 chai',
    unitEn: 'Box of 15',
    retailPrice: 270000,
    discountRate: 15,
    rating: 5.0,
    reviewCount: 1045,
    badgeText: '10% | 15%',
  },
  {
    id: 'sub-combo-week',
    nameVi: 'Combo Thanh Lọc 7 Ngày 7 Vị (Combo 7 chai 330ml)',
    nameEn: '7-Day Detox & Vitality Combo (Set of 7)',
    unitVi: 'Combo 7 chai',
    unitEn: 'Set of 7',
    retailPrice: 135000,
    discountRate: 15,
    rating: 5.0,
    reviewCount: 780,
    badgeText: '5% | 15%',
  },
  {
    id: 'sub-office-box',
    nameVi: 'Thùng Tiếp Sức Văn Phòng Trọn Tuần (Thùng 24 chai)',
    nameEn: 'Weekly Office Refreshment Pack (Carton of 24)',
    unitVi: 'Thùng 24 chai',
    unitEn: 'Carton of 24',
    retailPrice: 410000,
    discountRate: 15,
    rating: 4.9,
    reviewCount: 512,
    badgeText: '10% | 15%',
  },
];

const FREQUENCY_OPTIONS = [
  { value: 'weekly', labelVi: 'Giao mỗi tuần (Sáng T2)', labelEn: 'Weekly (Every Mon)' },
  { value: 'biweekly', labelVi: 'Giao 2 tuần / lần', labelEn: 'Every 2 weeks' },
  { value: 'twice-weekly', labelVi: 'Giao 2 lần/tuần (T2 & T5)', labelEn: '2 times / week (Mon & Thu)' },
  { value: 'monthly', labelVi: 'Giao mỗi tháng', labelEn: 'Monthly' },
];

interface SubscribeSaveSectionProps {
  title?: string;
  subtitle?: string;
  className?: string;
  badgeText?: string;
}

export default function SubscribeSaveSection({
  title,
  subtitle,
  className = '',
  badgeText,
}: SubscribeSaveSectionProps) {
  const { language } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Lưu tần suất giao hàng theo từng item trong số 8 sản phẩm/combo
  const [selectedFreq, setSelectedFreq] = useState<Record<string, string>>({
    'sub-sb-01': 'weekly',
    'sub-shs-01': 'weekly',
    'sub-sgl-01': 'weekly',
    'sub-sl-01': 'weekly',
    'sub-md-01': 'weekly',
    'sub-family-01': 'weekly',
    'sub-combo-week': 'weekly',
    'sub-office-box': 'weekly',
  });

  const { user, refreshUser } = useUserAuth();

  // Modal demo & Checkout State
  const [activeModalItem, setActiveModalItem] = useState<{
    item: SubscribeItem;
    freqLabel: string;
    freqKey: string;
    subPrice: number;
  } | null>(null);

  // Form states cho OTP và Đăng ký
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [fullNameInput, setFullNameInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'cod'>('vietqr');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSub, setCreatedSub] = useState<any>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Đồng bộ thông tin khi đã có user
  useEffect(() => {
    if (user) {
      if (user.fullName) setFullNameInput(user.fullName);
      if (user.phone) setPhoneInput(user.phone);
      if (user.address) setAddressInput(user.address);
    }
  }, [user]);

  // Cờ tính năng Subscribe & Save: Mặc định tắt, chỉ render khi bật flag
  if (!MEMBERSHIP_CONFIG.ENABLE_SUBSCRIBE_SAVE) {
    return null;
  }

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleSubscribeClick = (item: SubscribeItem) => {
    const freqKey = selectedFreq[item.id] || 'weekly';
    const opt = FREQUENCY_OPTIONS.find((o) => o.value === freqKey);
    const freqLabel = language === 'en' ? opt?.labelEn || 'Weekly' : opt?.labelVi || 'Giao mỗi tuần';
    const subPrice = Math.round(item.retailPrice * (1 - item.discountRate / 100));

    setCreatedSub(null);
    setFormError(null);
    setOtpSent(false);
    setOtpMessage(null);

    setActiveModalItem({
      item,
      freqLabel,
      freqKey,
      subPrice,
    });
  };

  const handleSendOtp = async () => {
    if (!phoneInput) {
      setFormError('Vui lòng nhập số điện thoại');
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/membership/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const json = await res.json();
      if (json.success) {
        setOtpSent(true);
        setOtpMessage('Mã OTP (123456) đã được gửi qua Zalo ZNS / SMS!');
      } else {
        setFormError(json.error || 'Lỗi gửi mã OTP');
      }
    } catch {
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput) {
      setFormError('Vui lòng nhập mã OTP');
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      const res = await fetch('/api/membership/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, otpCode: otpInput, fullName: fullNameInput }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshUser();
        setOtpSent(false);
        setOtpMessage(null);
      } else {
        setFormError(json.error || 'Mã OTP không hợp lệ');
      }
    } catch {
      setFormError('Lỗi xác thực');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubscription = async () => {
    if (!activeModalItem) return;
    if (!addressInput.trim()) {
      setFormError('Vui lòng nhập địa chỉ nhận hàng (Ví dụ: 123 Nguyễn Thị Thập, P. Tân Phú, Q.7).');
      return;
    }
    try {
      setIsSubmitting(true);
      setFormError(null);
      const freqCode =
        activeModalItem.freqKey === 'biweekly'
          ? '2_WEEKS'
          : activeModalItem.freqKey === 'monthly'
          ? '4_WEEKS'
          : '1_WEEK';

      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientName: fullNameInput || user?.fullName || 'Khách hàng',
          recipientPhone: phoneInput || user?.phone || '0901234567',
          shippingAddress: addressInput,
          deliveryFrequency: freqCode,
          preferredDayOfWeek: 2,
          paymentMethod,
          distanceKm: 5.0,
          items: [
            {
              productId: activeModalItem.item.id,
              name: activeModalItem.item.nameVi,
              unit: activeModalItem.item.unitVi,
              retailPrice: activeModalItem.item.retailPrice,
              quantity: 1,
            },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCreatedSub(json.data);
      } else {
        setFormError(json.error || 'Lỗi tạo hợp đồng');
      }
    } catch {
      setFormError('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`py-7 sm:py-10 bg-linear-to-b from-white via-amber-50/20 to-white relative overflow-hidden border-t border-b border-amber-100/60 ${className}`}>
      <div className="section-container">
        {/* Header Section phong cách Amazon Subscribe & Save kết hợp bản sắc Thái Sơn Foods */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{badgeText || 'Subscribe & Save • Tiết kiệm 15%'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight font-heading">
              {title || (language === 'en' ? 'Subscribe & Save Favourites' : 'Đăng Ký Giao Định Kỳ — 8 Sản Phẩm & Combo Tiết Kiệm')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
              {subtitle || (language === 'en'
                ? 'Never run out of wholesome fresh beverages. Automatic scheduled delivery to your door. Free shipping on every order, cancel or skip anytime.'
                : 'Thức uống tươi ngon nấu mới mỗi ngày với 8 sản phẩm & combo tuyển chọn. Miễn phí vận chuyển 100%, linh hoạt đổi vị và tạm dừng bất kỳ lúc nào.')}
            </p>
          </div>

          {/* Nút điều hướng Carousel (< >) trên màn hình cuộn */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <button
              onClick={() => handleScroll('left')}
              aria-label="Previous items"
              className="w-9 h-9 rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:scale-95 shadow-xs flex items-center justify-center text-gray-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll('right')}
              aria-label="Next items"
              className="w-9 h-9 rounded-full border border-gray-300 bg-white hover:bg-gray-50 active:scale-95 shadow-xs flex items-center justify-center text-gray-700 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1 DÒNG 8 SẢN PHẨM / 8 COMBO (Xếp đều 8 cột trên màn hình Desktop lớn, cuộn ngang mượt mà trên Mobile/Tablet) */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {SUBSCRIBE_ITEMS.map((item) => {
            const subPrice = Math.round(item.retailPrice * (1 - item.discountRate / 100));
            const savingAmount = item.retailPrice - subPrice;
            const currentFreq = selectedFreq[item.id] || 'weekly';

            return (
              <div
                key={item.id}
                className="w-[170px] sm:w-[185px] lg:w-[calc((100%-7*10px)/8)] lg:min-w-[136px] shrink-0 bg-white rounded-xl border border-gray-200/90 shadow-xs hover:shadow-md hover:border-amber-400 transition-all duration-200 p-2.5 sm:p-3 flex flex-col justify-between snap-start relative group"
              >
                {/* Huy hiệu chiết khấu đặc trưng kiểu Amazon (5% | 15%) */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="px-1.5 py-0.5 bg-orange-600 text-white font-bold text-[10px] rounded shadow-xs">
                    {item.badgeText}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                    Freeship
                  </span>
                </div>

                {/* Ảnh sản phẩm dùng CHUNG ĐÚNG 1 ẢNH chuẩn cho toàn bộ 8 item */}
                <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                  <Image
                    src={UNIFIED_PRODUCT_IMAGE}
                    alt={language === 'en' ? item.nameEn : item.nameVi}
                    fill
                    sizes="(max-width: 768px) 170px, 150px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Tên sản phẩm */}
                <h3 className="text-[11px] sm:text-xs font-bold text-gray-900 line-clamp-2 min-h-[32px] leading-snug">
                  {language === 'en' ? item.nameEn : item.nameVi}
                </h3>

                {/* Đánh giá sao */}
                <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-500">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">({item.reviewCount})</span>
                </div>

                {/* Khung Giá bán */}
                <div className="mt-2 pt-1.5 border-t border-gray-100">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm sm:text-base font-black text-[#B12704]">
                      {formatPrice(subPrice)} ₫
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">
                      {formatPrice(item.retailPrice)} ₫
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 truncate">
                    {language === 'en'
                      ? `Save ${formatPrice(savingAmount)} ₫`
                      : `Giảm ${formatPrice(savingAmount)} ₫`}
                  </div>
                </div>

                {/* Dropdown chọn tần suất giao hàng */}
                <div className="mt-2">
                  <label className="block text-[10px] font-semibold text-gray-600 mb-0.5 truncate">
                    {language === 'en' ? 'Deliver every:' : 'Chu kỳ nhận:'}
                  </label>
                  <select
                    value={currentFreq}
                    onChange={(e) =>
                      setSelectedFreq((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    className="w-full text-[10px] font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer transition-colors"
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {language === 'en' ? opt.labelEn : opt.labelVi}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nút màu vàng đặc trưng của Amazon: "Subscribe now" */}
                <button
                  onClick={() => handleSubscribeClick(item)}
                  type="button"
                  className="w-full mt-2.5 py-2 px-2 bg-[#FFD814] hover:bg-[#F7CA00] active:scale-[0.98] text-gray-900 font-bold text-[11px] rounded-lg border border-[#FCD200] shadow-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-gray-800" />
                  <span>{language === 'en' ? 'Subscribe' : 'Đăng ký ngay'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL FULLSTACK ĐĂNG KÝ HỢP ĐỒNG ĐỊNH KỲ ── */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-amber-200 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveModalItem(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* MÀN HÌNH HOÀN TẤT THÀNH CÔNG */}
            {createdSub ? (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 font-heading">
                  Đăng Ký Thành Công!
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Hợp đồng định kỳ <span className="font-bold text-emerald-800">#{createdSub.subscriptionCode}</span> đã được kích hoạt.
                </p>

                <div className="my-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left text-xs text-emerald-950 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kỳ giao đầu tiên:</span>
                    <span className="font-bold">
                      {new Date(createdSub.nextDeliveryDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chu kỳ:</span>
                    <span className="font-bold">{activeModalItem.freqLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Địa chỉ giao:</span>
                    <span className="font-bold line-clamp-1">{createdSub.shippingAddress}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Link
                    href="/tai-khoan/dinh-ky"
                    onClick={() => setActiveModalItem(null)}
                    className="block w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow transition"
                  >
                    Xem & Quản Lý Lịch Giao Tại Trang Cá Nhân
                  </Link>
                  <button
                    onClick={() => setActiveModalItem(null)}
                    className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200 transition"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-5">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-2 text-amber-700">
                    <RefreshCw className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 font-heading">
                    Ký Hợp Đồng Giao Định Kỳ
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Tiết kiệm 15% trọn đời và miễn phí 100% phí giao hàng lạnh tận nhà
                  </p>
                </div>

                {/* Tóm tắt mặt hàng & giá */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs text-gray-700 mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Sản phẩm:</span>
                    <span className="font-bold text-gray-900 text-right line-clamp-1 max-w-[220px]">
                      {activeModalItem.item.nameVi}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Chu kỳ:</span>
                    <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      {activeModalItem.freqLabel}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Giá mỗi kỳ (-15%):</span>
                    <span className="font-extrabold text-sm text-emerald-900">
                      {formatPrice(activeModalItem.subPrice)} ₫
                    </span>
                  </div>
                </div>

                {/* Thông báo lỗi nếu có */}
                {formError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    {formError}
                  </div>
                )}

                {/* BƯỚC XÁC THỰC SĐT NẾU CHƯA ĐĂNG NHẬP */}
                {!user ? (
                  <div className="space-y-3.5 p-4 rounded-2xl bg-gray-50 border border-gray-200 mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      Xác thực số điện thoại để đăng ký hợp đồng
                    </div>

                    {!otpSent ? (
                      <div className="space-y-2">
                        <label className="text-xs text-gray-600 block">Số điện thoại của bạn:</label>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="VD: 0901234567"
                            className="flex-1 p-2.5 rounded-xl border border-gray-300 text-sm font-semibold"
                          />
                          <button
                            disabled={isSubmitting}
                            onClick={handleSendOtp}
                            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition"
                          >
                            {isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {otpMessage && (
                          <div className="text-xs text-emerald-700 bg-emerald-100 p-2 rounded-lg">
                            {otpMessage}
                          </div>
                        )}
                        <label className="text-xs text-gray-600 block">Nhập mã OTP 6 số (Mã test: 123456):</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            placeholder="Nhập 123456"
                            className="flex-1 p-2.5 rounded-xl border border-gray-300 text-sm font-mono tracking-widest text-center font-bold"
                          />
                          <button
                            disabled={isSubmitting}
                            onClick={handleVerifyOtp}
                            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 transition"
                          >
                            {isSubmitting ? 'Đang duyệt...' : 'Xác thực'}
                          </button>
                        </div>
                        <button
                          onClick={() => setOtpSent(false)}
                          className="text-xs text-gray-500 hover:text-emerald-700 underline"
                        >
                          Đổi số điện thoại khác
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* BƯỚC NHẬP ĐỊA CHỈ & PHƯƠNG THỨC THANH TOÁN (KHI ĐÃ ĐĂNG NHẬP) */
                  <div className="space-y-3 mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Họ và tên:</label>
                        <input
                          type="text"
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="Họ tên người nhận"
                          className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">Số điện thoại:</label>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="Số điện thoại nhận sữa"
                          className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">
                        Địa chỉ nhận hàng:
                      </label>
                      <input
                        type="text"
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="Số nhà, tên đường, Phường, Quận (TP.HCM)"
                        className="w-full p-2.5 rounded-xl border border-gray-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Phương thức thanh toán:</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                            paymentMethod === 'vietqr' ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="pay_method"
                            checked={paymentMethod === 'vietqr'}
                            onChange={() => setPaymentMethod('vietqr')}
                            className="text-emerald-600"
                          />
                          <span>VietQR từng kỳ</span>
                        </label>

                        <label
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                            paymentMethod === 'cod' ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold' : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="pay_method"
                            checked={paymentMethod === 'cod'}
                            onChange={() => setPaymentMethod('cod')}
                            className="text-emerald-600"
                          />
                          <span>Trả tiền khi nhận (COD)</span>
                        </label>
                      </div>
                    </div>

                    <button
                      disabled={isSubmitting}
                      onClick={handleCreateSubscription}
                      className="w-full mt-4 py-3 rounded-xl bg-[#1B5E3B] hover:bg-[#14482D] text-white font-bold text-sm shadow-md transition cursor-pointer"
                    >
                      {isSubmitting ? 'Đang tạo hợp đồng...' : 'Xác Nhận Ký Hợp Đồng Giao Định Kỳ'}
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bỏ qua kỳ hoặc hủy hợp đồng dễ dàng trong 1 chạm tại trang cá nhân.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
