'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import QuantitySelector from '@/components/product/QuantitySelector';
import { Trash2, ShoppingBag, ArrowLeft, AlertCircle } from 'lucide-react';

const MIN_ORDER_THRESHOLD = 120000;

export default function CartPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    items,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
    clearCart,
  } = useCartStore();

  const totalQuantity = items.reduce((t, i) => t + i.quantity, 0);
  const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
  const shippingFee = subtotal >= 200000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  // Kiểm tra nếu giỏ hàng có combo -> combo tính sau (được phép đặt dù dưới 120k)
  const hasCombo = items.some((i) => i.productId.includes('combo') || i.slug?.includes('combo'));
  const isEligibleToOrder = subtotal >= MIN_ORDER_THRESHOLD || hasCombo;
  const missingForMinOrder = Math.max(0, MIN_ORDER_THRESHOLD - subtotal);

  if (!isMounted) {
    return (
      <div className="section-container py-20 text-center">
        <div className="max-w-md mx-auto animate-pulse">
          <div className="w-24 h-24 bg-ivory-dark rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-text-muted/40" />
          </div>
          <div className="h-7 bg-ivory-dark rounded-md w-48 mx-auto mb-3" />
          <div className="h-4 bg-ivory-dark rounded-md w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section-container py-20 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 bg-ivory-dark rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-text-muted" />
          </div>
          <h1 className="text-2xl font-bold text-text-dark font-heading mb-2">
            Giỏ hàng trống
          </h1>
          <p className="text-text-muted mb-8">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Link
            href="/#san-pham"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container pt-4 pb-8 md:pt-5 md:pb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center gap-1.5 text-sm text-text-muted">
          <li>
            <a href="/" className="hover:text-green-primary transition-colors">Trang chủ</a>
          </li>
          <li>/</li>
          <li className="text-text-dark font-medium">Giỏ hàng</li>
        </ol>
      </nav>

      <h1 className="text-2xl md:text-3xl font-bold text-text-dark font-heading mb-8">
        Giỏ hàng ({totalQuantity} sản phẩm)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-[3fr_1fr_1fr_1fr_auto] gap-4 pb-4 border-b border-border text-sm font-semibold text-text-muted uppercase tracking-wider">
            <span>Sản phẩm</span>
            <span className="text-center">Đơn giá</span>
            <span className="text-center">Số lượng</span>
            <span className="text-right">Thành tiền</span>
            <span className="w-10" />
          </div>

          <div className="divide-y divide-border-light">
            {items.map((item) => (
              <div
                key={item.productId}
                className="py-4 md:py-5 grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 items-center"
              >
                {/* Product */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/san-pham/${item.slug}`}
                    className="relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-ivory-dark shrink-0"
                  >
                    <Image
                      src={item.thumbnail}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      href={`/san-pham/${item.slug}`}
                      className="text-sm md:text-base font-semibold text-text-dark hover:text-green-primary transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-text-muted md:hidden mt-0.5">
                      {formatPrice(item.price)}đ / {item.unit}
                    </p>
                  </div>
                </div>

                {/* Unit Price */}
                <p className="hidden md:block text-center text-sm text-text-body">
                  {formatPrice(item.price)}đ
                </p>

                {/* Quantity */}
                <div className="flex md:justify-center">
                  <QuantitySelector
                    quantity={item.quantity}
                    onIncrease={() => increaseQuantity(item.productId)}
                    onDecrease={() => decreaseQuantity(item.productId)}
                    onChange={(val) => setQuantity(item.productId, val)}
                    size="sm"
                  />
                </div>

                {/* Subtotal */}
                <p className="text-right text-sm md:text-base font-bold text-green-primary">
                  {formatPrice(item.price * item.quantity)}đ
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-sale hover:bg-sale/5 rounded-lg transition-colors"
                  aria-label={`Xóa ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-6">
            <Link
              href="/#san-pham"
              className="flex items-center gap-2 text-sm font-medium text-green-primary hover:text-green-dark transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Tiếp tục mua sắm
            </Link>
            <button
              onClick={clearCart}
              className="text-sm text-text-muted hover:text-sale transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-border-light sticky top-[100px]">
            <h2 className="text-lg font-bold text-text-dark mb-5">Tóm tắt đơn hàng</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-body">Tạm tính</span>
                <span className="font-medium text-text-dark">{formatPrice(subtotal)}đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-body">Phí vận chuyển</span>
                <span className="font-medium text-text-dark">
                  {shippingFee === 0 ? (
                    <span className="text-green-primary">Miễn phí</span>
                  ) : (
                    `${formatPrice(shippingFee)}đ`
                  )}
                </span>
              </div>
              <div className="border-t border-border-light pt-3 flex justify-between">
                <span className="font-bold text-text-dark text-base">Tổng cộng</span>
                <span className="font-bold text-green-primary text-lg">
                  {formatPrice(total)}đ
                </span>
              </div>
            </div>

            {subtotal < 200000 && (
              <p className="mt-4 text-xs text-text-muted text-center">
                Mua thêm{' '}
                <span className="font-semibold text-sale">
                  {formatPrice(200000 - subtotal)}đ
                </span>{' '}
                để được miễn phí ship
              </p>
            )}

            {/* Cảnh báo đơn hàng tối thiểu 120.000đ (combo tính sau) */}
            {!isEligibleToOrder ? (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Đơn hàng tối thiểu 120.000đ</span>
                </div>
                <p className="text-amber-700">
                  Thái Sơn Foods áp dụng mức đặt hàng tối thiểu từ <strong>120.000đ</strong>. Vui lòng chọn thêm <strong className="text-amber-900">{formatPrice(missingForMinOrder)}đ</strong> để có thể thanh toán.
                </p>
              </div>
            ) : hasCombo && subtotal < MIN_ORDER_THRESHOLD ? (
              <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5 font-medium">
                <span>✨</span>
                <span>Đơn hàng có Combo ưu đãi (đủ điều kiện đặt hàng).</span>
              </div>
            ) : null}

            {isEligibleToOrder ? (
              <Link
                href="/thanh-toan"
                className="mt-5 w-full flex items-center justify-center py-3.5 bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors shadow-md active:scale-95"
              >
                Tiến hành thanh toán
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="mt-5 w-full flex items-center justify-center py-3.5 bg-gray-200 text-gray-400 font-semibold rounded-xl cursor-not-allowed text-sm"
              >
                Cần thêm {formatPrice(missingForMinOrder)}đ để đặt hàng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
