'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CheckCircle, ArrowLeft, Banknote, QrCode, ShieldCheck, AlertCircle } from 'lucide-react';

const MIN_ORDER_THRESHOLD = 120000;

export default function CheckoutPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { items, clearCart } = useCartStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'banking'>('cod');
  const [orderCode, setOrderCode] = useState('');
  const [completedOrder, setCompletedOrder] = useState<{
    fullName: string;
    phone: string;
    address: string;
    total: number;
    paymentMethod: string;
  } | null>(null);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    address: '',
    note: '',
  });

  const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
  const shippingFee = subtotal >= 200000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  // Kiểm tra nếu giỏ hàng có combo -> combo tính sau (được phép đặt dù dưới 120k)
  const hasCombo = items.some((i) => i.productId.includes('combo') || i.slug?.includes('combo'));
  const isEligibleToOrder = subtotal >= MIN_ORDER_THRESHOLD || hasCombo;
  const missingForMinOrder = Math.max(0, MIN_ORDER_THRESHOLD - subtotal);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!form.phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0|\+84)\d{9,10}$/.test(form.phone.replace(/\s/g, '')))
      newErrors.phone = 'Số điện thoại không hợp lệ';
    if (!form.province.trim()) newErrors.province = 'Vui lòng nhập tỉnh/thành phố';
    if (!form.district.trim()) newErrors.district = 'Vui lòng nhập quận/huyện';
    if (!form.ward.trim()) newErrors.ward = 'Vui lòng nhập phường/xã';
    if (!form.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEligibleToOrder) {
      alert(`Đơn hàng tối thiểu từ 120.000đ mới có thể tiến hành đặt hàng.`);
      return;
    }
    if (!validate()) return;
    const generatedCode = `TSF-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderCode(generatedCode);

    // Persist order to PostgreSQL database via API
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderCode: generatedCode,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        province: form.province,
        district: form.district,
        ward: form.ward,
        address: form.address,
        note: form.note,
        paymentMethod,
        shippingFee,
        subtotal,
        total,
        items,
      }),
    }).catch((err) => console.warn('Order sync notice:', err));

    setCompletedOrder({
      fullName: form.fullName,
      phone: form.phone,
      address: `${form.address}, ${form.ward}, ${form.district}, ${form.province}`,
      total: total,
      paymentMethod: paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản qua ngân hàng',
    });
    setIsSubmitted(true);
    clearCart();
  };

  if (isSubmitted && completedOrder) {
    return (
      <div className="section-container py-12 md:py-20">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-border-light text-center">
          <div className="w-20 h-20 bg-green-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-primary" />
          </div>
          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-primary bg-green-primary/10 rounded-full mb-3">
            Đơn hàng #{orderCode}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-text-dark font-heading mb-3">
            Đặt hàng thành công!
          </h1>
          <p className="text-text-muted text-sm md:text-base mb-8">
            Cảm ơn bạn đã tin tưởng chọn <span className="font-semibold text-green-primary">Thái Sơn Foods</span>. Đơn hàng của bạn đang được tiếp nhận và xử lý nhanh chóng.
          </p>

          {/* Order Details Card */}
          <div className="bg-ivory/60 rounded-2xl p-5 text-left text-sm space-y-3 mb-8 border border-border-light">
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">Người nhận:</span>
              <span className="font-semibold text-text-dark">{completedOrder.fullName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">Số điện thoại:</span>
              <span className="font-semibold text-text-dark">{completedOrder.phone}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">Địa chỉ giao:</span>
              <span className="font-semibold text-text-dark text-right max-w-[280px]">{completedOrder.address}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-border-light">
              <span className="text-text-muted">Phương thức:</span>
              <span className="font-semibold text-green-primary">{completedOrder.paymentMethod}</span>
            </div>
            <div className="flex justify-between pt-1 text-base">
              <span className="font-bold text-text-dark">Tổng thanh toán:</span>
              <span className="font-bold text-green-primary text-lg">{formatPrice(completedOrder.total)}đ</span>
            </div>
          </div>

          {paymentMethod === 'banking' && (
            <div className="mb-8 p-5 bg-corn/15 border border-corn/40 rounded-2xl text-left text-sm">
              <p className="font-bold text-text-dark mb-2 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-green-primary" />
                Thông tin chuyển khoản Thái Sơn Foods:
              </p>
              <ul className="space-y-1 text-text-body text-xs md:text-sm">
                <li>• Ngân hàng: <strong>Vietcombank (Chi nhánh Tân Bình)</strong></li>
                <li>• Số tài khoản: <strong>0071001234567</strong></li>
                <li>• Chủ tài khoản: <strong>CONG TY TNHH THUC PHAM THAI SON</strong></li>
                <li>• Nội dung CK: <strong>{orderCode} - {completedOrder.phone}</strong></li>
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors text-sm"
            >
              Về trang chủ
            </Link>
            <Link
              href="/#san-pham"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border border-border text-text-dark font-semibold rounded-xl hover:bg-ivory transition-colors text-sm"
            >
              Mua thêm thức uống
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="section-container py-20 text-center">
        <div className="max-w-md mx-auto animate-pulse">
          <div className="w-16 h-16 bg-ivory-dark rounded-full mx-auto mb-4" />
          <div className="h-6 bg-ivory-dark rounded w-48 mx-auto mb-2" />
          <div className="h-4 bg-ivory-dark rounded w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section-container py-20 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-text-dark font-heading mb-2">
            Không có sản phẩm
          </h1>
          <p className="text-text-muted mb-8">
            Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.
          </p>
          <Link
            href="/#san-pham"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Mua sắm ngay
          </Link>
        </div>
      </div>
    );
  }

  // Chặn thanh toán nếu đơn hàng chưa đạt mức tối thiểu 120.000đ (ngoại trừ combo)
  if (!isEligibleToOrder) {
    return (
      <div className="section-container py-16 md:py-24 text-center">
        <div className="max-w-md mx-auto bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-text-dark font-heading mb-2">
            Đơn hàng chưa đạt mức tối thiểu
          </h1>
          <p className="text-text-muted text-sm mb-3">
            Thái Sơn Foods áp dụng mức đặt hàng tối thiểu từ <strong>{formatPrice(MIN_ORDER_THRESHOLD)}đ</strong>.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 mb-6 font-medium text-left space-y-1">
            <p>• Giá trị giỏ hàng hiện tại: <strong className="text-text-dark">{formatPrice(subtotal)}đ</strong></p>
            <p>• Cần chọn thêm ít nhất: <strong className="text-amber-900 font-bold">{formatPrice(missingForMinOrder)}đ</strong></p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/#san-pham"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Mua thêm sản phẩm
            </Link>
            <Link
              href="/gio-hang"
              className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Xem lại giỏ hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container py-6 md:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-text-muted">
          <li>
            <a href="/" className="hover:text-green-primary transition-colors">Trang chủ</a>
          </li>
          <li>/</li>
          <li>
            <a href="/gio-hang" className="hover:text-green-primary transition-colors">Giỏ hàng</a>
          </li>
          <li>/</li>
          <li className="text-text-dark font-medium">Thanh toán</li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-text-dark font-heading mb-8">
        Thanh toán
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-lg font-bold text-text-dark">Thông tin giao hàng</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label htmlFor="fullName" className="block text-sm font-medium text-text-dark mb-1.5">
                  Họ và tên <span className="text-sale">*</span>
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.fullName ? 'border-sale' : 'border-border'
                  )}
                  placeholder="Nguyễn Văn A"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-sale">{errors.fullName}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-text-dark mb-1.5">
                  Số điện thoại <span className="text-sale">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.phone ? 'border-sale' : 'border-border'
                  )}
                  placeholder="0912 345 678"
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-sale">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-dark mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors"
                  placeholder="email@example.com"
                />
              </div>

              {/* Province */}
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-text-dark mb-1.5">
                  Tỉnh / Thành phố <span className="text-sale">*</span>
                </label>
                <input
                  id="province"
                  name="province"
                  type="text"
                  value={form.province}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.province ? 'border-sale' : 'border-border'
                  )}
                  placeholder="TP. Hồ Chí Minh"
                />
                {errors.province && (
                  <p className="mt-1 text-xs text-sale">{errors.province}</p>
                )}
              </div>

              {/* District */}
              <div>
                <label htmlFor="district" className="block text-sm font-medium text-text-dark mb-1.5">
                  Quận / Huyện <span className="text-sale">*</span>
                </label>
                <input
                  id="district"
                  name="district"
                  type="text"
                  value={form.district}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.district ? 'border-sale' : 'border-border'
                  )}
                  placeholder="Quận Tân Bình"
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-sale">{errors.district}</p>
                )}
              </div>

              {/* Ward */}
              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-text-dark mb-1.5">
                  Phường / Xã <span className="text-sale">*</span>
                </label>
                <input
                  id="ward"
                  name="ward"
                  type="text"
                  value={form.ward}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.ward ? 'border-sale' : 'border-border'
                  )}
                  placeholder="Phường Tân Sơn Hòa"
                />
                {errors.ward && (
                  <p className="mt-1 text-xs text-sale">{errors.ward}</p>
                )}
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-text-dark mb-1.5">
                  Địa chỉ <span className="text-sale">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors',
                    errors.address ? 'border-sale' : 'border-border'
                  )}
                  placeholder="Số nhà, tên đường..."
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-sale">{errors.address}</p>
                )}
              </div>

              {/* Note */}
              <div className="sm:col-span-2">
                <label htmlFor="note" className="block text-sm font-medium text-text-dark mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors resize-none"
                  placeholder="Ghi chú thêm cho đơn hàng..."
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-4 border-t border-border-light">
              <h2 className="text-lg font-bold text-text-dark mb-4">Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'cod'
                      ? 'border-green-primary bg-green-primary/5'
                      : 'border-border-light bg-white hover:border-green-primary/40'
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mt-1 text-green-primary focus:ring-green-primary"
                  />
                  <div>
                    <span className="block font-semibold text-sm text-text-dark">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <span className="block text-xs text-text-muted mt-0.5">
                      Kiểm tra hàng và thanh toán tiền mặt trực tiếp cho shipper
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod('banking')}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all',
                    paymentMethod === 'banking'
                      ? 'border-green-primary bg-green-primary/5'
                      : 'border-border-light bg-white hover:border-green-primary/40'
                  )}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="banking"
                    checked={paymentMethod === 'banking'}
                    onChange={() => setPaymentMethod('banking')}
                    className="mt-1 text-green-primary focus:ring-green-primary"
                  />
                  <div>
                    <span className="block font-semibold text-sm text-text-dark">
                      Chuyển khoản VietQR
                    </span>
                    <span className="block text-xs text-text-muted mt-0.5">
                      Quét mã QR qua ứng dụng ngân hàng hoặc ví điện tử
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-border-light sticky top-[100px]">
              <h2 className="text-lg font-bold text-text-dark mb-5">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-ivory-dark shrink-0">
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-dark line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-text-muted">
                        x{item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-text-dark whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}đ
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-light pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-body">Tạm tính</span>
                  <span className="font-medium">{formatPrice(subtotal)}đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-body">Phí vận chuyển</span>
                  <span className="font-medium">
                    {shippingFee === 0 ? (
                      <span className="text-green-primary">Miễn phí</span>
                    ) : (
                      `${formatPrice(shippingFee)}đ`
                    )}
                  </span>
                </div>
                <div className="border-t border-border-light pt-3 flex justify-between">
                  <span className="font-bold text-text-dark text-base">Tổng cộng</span>
                  <span className="font-bold text-green-primary text-xl">
                    {formatPrice(total)}đ
                  </span>
                </div>
              </div>

              <button
                type="submit"
                onClick={handleSubmit}
                className="mt-5 w-full py-4 bg-green-primary text-white font-bold rounded-xl hover:bg-green-dark transition-colors text-base active:scale-[0.98]"
              >
                Đặt hàng
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
