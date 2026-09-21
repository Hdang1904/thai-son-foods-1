'use client';

import { useCartStore } from '@/store/cart';
import { X, ShoppingBag, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import QuantitySelector from '@/components/product/QuantitySelector';

const FREE_SHIPPING_THRESHOLD = 200000;
const MIN_ORDER_THRESHOLD = 120000; // Đơn hàng tối thiểu 120.000đ

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
  } = useCartStore();

  const totalQuantity = items.reduce((t, i) => t + i.quantity, 0);
  const subtotal = items.reduce((t, i) => t + i.price * i.quantity, 0);
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - subtotal;

  // Kiểm tra nếu giỏ hàng có combo -> combo tính sau (được phép đặt dù dưới 120k)
  const hasCombo = items.some((i) => i.productId.includes('combo') || i.slug?.includes('combo'));
  const isEligibleToOrder = subtotal >= MIN_ORDER_THRESHOLD || hasCombo;
  const missingForMinOrder = Math.max(0, MIN_ORDER_THRESHOLD - subtotal);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/45 z-[60] transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 bottom-0 z-[70] w-full sm:w-[440px] bg-white flex flex-col transition-transform duration-350 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Giỏ hàng"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-primary" />
            <h2 className="text-lg font-bold text-text-dark">Giỏ hàng</h2>
            {totalQuantity > 0 && (
              <span className="text-sm text-text-muted">({totalQuantity})</span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 text-text-muted hover:text-text-dark hover:bg-ivory-dark rounded-lg transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 bg-ivory-dark rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-body font-medium mb-1">Giỏ hàng trống</p>
            <p className="text-sm text-text-muted mb-6">
              Hãy thêm sản phẩm yêu thích vào giỏ hàng
            </p>
            <button
              onClick={closeCart}
              className="px-6 py-2.5 bg-green-primary text-white rounded-xl font-medium hover:bg-green-dark transition-colors text-sm"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex gap-3 p-3 bg-ivory/50 rounded-xl"
              >
                {/* Image */}
                <Link
                  href={`/san-pham/${item.slug}`}
                  onClick={closeCart}
                  className="relative w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden bg-ivory-dark"
                >
                  <Image
                    src={item.thumbnail}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/san-pham/${item.slug}`}
                    onClick={closeCart}
                    className="text-sm font-semibold text-text-dark line-clamp-1 hover:text-green-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatPrice(item.price)}đ / {item.unit}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <QuantitySelector
                      quantity={item.quantity}
                      onIncrease={() => increaseQuantity(item.productId)}
                      onDecrease={() => decreaseQuantity(item.productId)}
                      onChange={(val) => setQuantity(item.productId, val)}
                      size="sm"
                    />
                    <p className="text-sm font-bold text-green-primary">
                      {formatPrice(item.price * item.quantity)}đ
                    </p>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="self-start p-1 text-text-muted hover:text-sale transition-colors"
                  aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border-light px-5 py-4 space-y-3">
            {/* Free shipping progress */}
            {remainingForFreeShipping > 0 ? (
              <div className="text-xs text-text-muted text-center">
                Bạn còn{' '}
                <span className="font-semibold text-sale">
                  {formatPrice(remainingForFreeShipping)}đ
                </span>{' '}
                để được miễn phí vận chuyển
              </div>
            ) : (
              <div className="text-xs text-green-primary font-medium text-center">
                🎉 Bạn đã được miễn phí vận chuyển!
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
              <div
                className="h-full bg-green-primary rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%`,
                }}
              />
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-text-body">
                {totalQuantity} sản phẩm
              </span>
              <span className="text-lg font-bold text-text-dark">
                {formatPrice(subtotal)}đ
              </span>
            </div>

            {/* Cảnh báo đơn hàng tối thiểu 120.000đ (combo tính sau) */}
            {!isEligibleToOrder ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Đơn hàng tối thiểu 120.000đ</span>
                </div>
                <p className="text-amber-700">
                  Bạn cần mua thêm <strong className="text-amber-900">{formatPrice(missingForMinOrder)}đ</strong> để có thể thanh toán.
                </p>
              </div>
            ) : hasCombo && subtotal < MIN_ORDER_THRESHOLD ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
                <span>✨</span>
                <span>Đơn hàng có Combo ưu đãi (đủ điều kiện đặt hàng).</span>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/gio-hang"
                onClick={closeCart}
                className="w-full py-2.5 text-center bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                Xem giỏ hàng
              </Link>

              {isEligibleToOrder ? (
                <Link
                  href="/thanh-toan"
                  onClick={closeCart}
                  className="w-full py-3 text-center bg-green-primary text-white font-semibold rounded-xl hover:bg-green-dark transition-colors text-sm shadow-sm active:scale-95"
                >
                  Thanh toán ({formatPrice(subtotal)}đ)
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full py-3 text-center bg-gray-200 text-gray-400 font-semibold rounded-xl text-sm cursor-not-allowed"
                >
                  Cần thêm {formatPrice(missingForMinOrder)}đ để đặt
                </button>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
