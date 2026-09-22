'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import OrderSuccessModal from '@/components/product/OrderSuccessModal';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartStickySidebar() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getTotalPrice,
  } = useCartStore();

  const [isCheckoutFormOpen, setIsCheckoutFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string;
    customerName: string;
    total: number;
  } | null>(null);

  const totalPrice = getTotalPrice();
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  const freeShippingThreshold = 200000;
  const progress = Math.min((totalPrice / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = freeShippingThreshold - totalPrice;

  const handleQuickCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert('Vui lòng điền đầy đủ thông tin giao hàng!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone,
          shippingAddress: customerAddress,
          items: items.map((i) => ({
            productId: i.productId,
            productName: i.name,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.price * i.quantity,
          })),
          totalAmount: totalPrice,
          shippingFee: totalPrice >= freeShippingThreshold ? 0 : 25000,
          paymentMethod: 'cod',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const orderId = data.orderId || `TSF-${Date.now().toString().slice(-6)}`;
        clearCart();
        setIsCheckoutFormOpen(false);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setCompletedOrder({
          orderId,
          customerName,
          total: totalPrice + (totalPrice >= freeShippingThreshold ? 0 : 25000),
        });
      } else {
        alert(data.error || 'Có lỗi xảy ra khi tạo đơn hàng');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tránh Hydration Mismatch: Render giao diện khởi tạo đồng bộ SSR trước khi đọc localStorage
  if (!isMounted) {
    return (
      <div className="flex flex-col h-full bg-white select-none">
        {/* Header tĩnh */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-ivory/50">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#11241C] font-heading leading-tight">
                Giỏ hàng của bạn
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-800">
                  Cập nhật trực tiếp
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thanh freeship tĩnh */}
        <div className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-100/80">
          <div className="flex items-center justify-between text-xs text-text-dark mb-1.5">
            <span className="font-medium text-text-body">
              Mua thêm <strong className="font-bold text-emerald-800">200.000đ</strong> để được Freeship
            </span>
            <span className="font-bold text-emerald-900 text-[11px]">0%</span>
          </div>
          <div className="w-full h-2 bg-emerald-100/70 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full w-0" />
          </div>
        </div>

        {/* Khung trạng thái giỏ rỗng ban đầu */}
        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-ivory rounded-2xl flex items-center justify-center mb-4 border border-dashed border-gray-300">
            <ShoppingBag className="w-9 h-9 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-text-dark font-heading mb-1">
            Giỏ hàng đang trống
          </h3>
          <p className="text-xs text-text-muted max-w-[240px] leading-relaxed mb-4">
            Hãy chọn những thức uống thơm ngon tự nhiên từ Thái Sơn Foods để bỏ vào giỏ nhé!
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full">
            👈 Bấm &quot;Thêm vào giỏ&quot; bên trái
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. HEADER SIDEBAR: TIÊU ĐỀ & TRẠNG THÁI REALTIME */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-ivory/50">
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-xs">
            <ShoppingBag className="w-5 h-5" />
            {totalQuantity > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sale text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {totalQuantity > 99 ? '99+' : totalQuantity}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#11241C] font-heading leading-tight">
              Giỏ hàng của bạn
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-800">
                {totalQuantity > 0 ? `${totalQuantity} sản phẩm trong giỏ` : 'Cập nhật trực tiếp'}
              </span>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-gray-400 hover:text-sale transition-colors cursor-pointer"
            title="Xóa tất cả món trong giỏ"
          >
            Làm trống
          </button>
        )}
      </div>

      {/* 2. THANH TIẾN TRÌNH FREESHIP */}
      <div className="px-5 py-3 bg-emerald-50/50 border-b border-emerald-100/80">
        <div className="flex items-center justify-between text-xs text-text-dark mb-1.5">
          <span className="font-medium text-text-body">
            {remainingForFreeShipping <= 0 ? (
              <span className="font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Đủ điều kiện MIỄN PHÍ VẬN CHUYỂN!
              </span>
            ) : (
              <>
                Mua thêm{' '}
                <strong className="font-bold text-emerald-800">
                  {formatPrice(remainingForFreeShipping)}đ
                </strong>{' '}
                để được Freeship
              </>
            )}
          </span>
          <span className="font-bold text-emerald-900 text-[11px]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-emerald-100/70 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full bg-emerald-600 rounded-full"
          />
        </div>
      </div>

      {/* 3. DANH SÁCH SẢN PHẨM TRONG GIỎ (CUỘN ĐỘC LẬP) */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 divide-y divide-gray-100">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-ivory rounded-2xl flex items-center justify-center mb-4 border border-dashed border-gray-300">
              <ShoppingBag className="w-9 h-9 text-gray-400" />
            </div>
            <h3 className="text-base font-bold text-text-dark font-heading mb-1">
              Giỏ hàng đang trống
            </h3>
            <p className="text-xs text-text-muted max-w-[240px] leading-relaxed mb-4">
              Hãy chọn những thức uống thơm ngon tự nhiên từ Thái Sơn Foods để bỏ vào giỏ nhé!
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full">
              👈 Bấm &quot;Thêm vào giỏ&quot; bên trái
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variantId || 'default'}`}
                layout
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="pt-3 first:pt-0 flex items-center gap-3 group"
              >
                {/* Thumbnail sản phẩm */}
                <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] shrink-0 border border-gray-100 p-1 flex items-center justify-center">
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    fill
                    className="object-contain p-0.5"
                    sizes="56px"
                  />
                </div>

                {/* Thông tin món */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-[13px] font-bold text-text-dark truncate leading-snug">
                    {item.name}
                  </h4>
                  {item.variantName && (
                    <p className="text-[11px] text-text-muted truncate mt-0.5">
                      {item.variantName}
                    </p>
                  )}
                  <p className="text-xs font-extrabold text-emerald-800 mt-1">
                    {formatPrice(item.price)}đ
                  </p>

                  {/* Nút tăng/giảm số lượng */}
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            Math.max(0, item.quantity - 1),
                            item.variantId
                          )
                        }
                        className="p-1 text-gray-500 hover:text-text-dark hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Giảm số lượng"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-text-dark min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.quantity + 1,
                            item.variantId
                          )
                        }
                        className="p-1 text-gray-500 hover:text-text-dark hover:bg-gray-100 transition-colors cursor-pointer"
                        aria-label="Tăng số lượng"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-text-dark">
                        {formatPrice(item.price * item.quantity)}đ
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-1 text-gray-400 hover:text-sale transition-colors cursor-pointer"
                        aria-label="Xóa sản phẩm"
                        title="Xóa món này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* 4. FOOTER TỔNG KẾT & NÚT ĐẶT HÀNG NHANH */}
      {items.length > 0 && (
        <div className="p-4 border-t border-border-light bg-ivory/40 space-y-3 shrink-0">
          {/* Tạm tính */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted font-medium">Tạm tính:</span>
            <div className="text-right">
              <span className="font-black text-emerald-800 text-lg">
                {formatPrice(totalPrice)}đ
              </span>
              <span className="text-[11px] text-gray-400 block font-normal">
                {remainingForFreeShipping <= 0 ? 'Miễn phí vận chuyển' : '+ Phí ship tính khi thanh toán'}
              </span>
            </div>
          </div>

          {isCheckoutFormOpen ? (
            <form onSubmit={handleQuickCheckout} className="space-y-2.5 pt-1">
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Họ và tên người nhận *"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 shadow-xs"
                />
              </div>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  placeholder="Số điện thoại liên hệ *"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 shadow-xs"
                />
              </div>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Địa chỉ nhận hàng chi tiết *"
                  required
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600 shadow-xs"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCheckoutFormOpen(false)}
                  className="w-1/3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-text-dark hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2 bg-gradient-to-r from-emerald-700 to-[#1B4D3E] text-white rounded-xl text-xs font-bold hover:opacity-95 transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Nút đặt hàng nhanh (COD) */}
              <button
                type="button"
                onClick={() => setIsCheckoutFormOpen(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-[#1B4D3E] text-white font-bold rounded-xl hover:opacity-95 transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
              >
                <span>Đặt hàng nhanh (COD)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Nút xem chi tiết giỏ hàng và thanh toán */}
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/gio-hang"
                  className="py-2 px-2 bg-white border border-gray-200 text-text-dark font-semibold rounded-xl hover:bg-gray-50 transition-all text-xs text-center flex items-center justify-center"
                >
                  Xem giỏ hàng
                </Link>
                <Link
                  href="/thanh-toan"
                  className="py-2 px-2 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-xl hover:bg-emerald-100 transition-all text-xs text-center flex items-center justify-center"
                >
                  Thanh toán
                </Link>
              </div>
            </>
          )}

          <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Giao hàng tận nơi toàn quốc
            </span>
            <span>Thanh toán COD / CK</span>
          </div>
        </div>
      )}

      {/* Modal báo đặt hàng thành công */}
      {completedOrder && (
        <OrderSuccessModal
          orderId={completedOrder.orderId}
          customerName={completedOrder.customerName}
          total={completedOrder.total}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </div>
  );
}
