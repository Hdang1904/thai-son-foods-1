'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CheckCircle2, User, Phone, MapPin } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import OrderSuccessModal from '@/components/product/OrderSuccessModal';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
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
          items: items.map(i => ({
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-light">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-green-primary" />
                <h2 className="text-lg font-bold text-text-dark font-heading">
                  Giỏ hàng ({totalQuantity})
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-dark hover:bg-ivory transition-colors cursor-pointer"
                aria-label="Đóng giỏ hàng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress */}
            <div className="p-4 bg-ivory/60 border-b border-border-light">
              <div className="flex items-center justify-between text-xs text-text-dark mb-1.5">
                <span>
                  {remainingForFreeShipping <= 0 ? (
                    <span className="font-semibold text-green-primary">
                      🎉 Bạn được MIỄN PHÍ VẬN CHUYỂN!
                    </span>
                  ) : (
                    <>
                      Mua thêm{' '}
                      <span className="font-bold text-green-primary">
                        {formatPrice(remainingForFreeShipping)}đ
                      </span>{' '}
                      để được freeship
                    </>
                  )}
                </span>
                <span className="font-medium text-text-muted">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full h-2 bg-border-light rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full bg-green-primary rounded-full"
                />
              </div>
            </div>

            {/* Items List */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-ivory rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-10 h-10 text-text-muted" />
                </div>
                <h3 className="text-lg font-bold text-text-dark font-heading mb-1">
                  Giỏ hàng của bạn đang trống
                </h3>
                <p className="text-sm text-text-muted mb-6">
                  Hãy chọn những sản phẩm thơm ngon từ Thái Sơn Foods nhé!
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-primary text-white font-medium rounded-xl hover:bg-green-dark transition-colors text-sm cursor-pointer"
                >
                  Khám phá sản phẩm
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-border-light">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || 'default'}`}
                    className="pt-3 first:pt-0 flex gap-3"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-18 h-18 rounded-lg overflow-hidden bg-ivory shrink-0 border border-border-light">
                      <Image
                        src={item.thumbnail}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-text-dark truncate">
                        {item.name}
                      </h4>
                      {item.variantName && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-sm font-bold text-green-primary mt-1">
                        {formatPrice(item.price)}đ
                      </p>

                      {/* Quantity + Remove */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                Math.max(0, item.quantity - 1),
                                item.variantId
                              )
                            }
                            className="p-1 text-text-muted hover:text-text-dark hover:bg-ivory transition-colors cursor-pointer"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-text-dark min-w-[24px] text-center">
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
                            className="p-1 text-text-muted hover:text-text-dark hover:bg-ivory transition-colors cursor-pointer"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          className="p-1 text-text-muted hover:text-sale transition-colors cursor-pointer"
                          aria-label="Xóa sản phẩm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border-light bg-ivory/30 space-y-3">
                {/* Total */}
                <div className="flex items-center justify-between text-base">
                  <span className="text-text-muted">Tạm tính:</span>
                  <span className="font-bold text-green-primary text-lg">
                    {formatPrice(totalPrice)}đ
                  </span>
                </div>

                {isCheckoutFormOpen ? (
                  <form onSubmit={handleQuickCheckout} className="space-y-3 pt-2">
                    <div className="relative">
                      <User className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Họ và tên của bạn *"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-green-primary"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="Số điện thoại *"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-green-primary"
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Địa chỉ giao hàng chi tiết *"
                        required
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-green-primary"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCheckoutFormOpen(false)}
                        className="w-1/3 py-2.5 border border-border rounded-xl text-xs font-semibold text-text-dark hover:bg-ivory transition-colors"
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 py-2.5 bg-green-primary text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-green-dark transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        {isSubmitting ? 'Đang gửi...' : 'Xác nhận đặt hàng'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCheckoutFormOpen(true)}
                      className="w-full py-3 bg-green-primary text-white font-bold rounded-xl hover:bg-green-dark transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                    >
                      <span>Đặt hàng nhanh (COD)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    
                    <div className="flex gap-2">
                      <Link
                        href="/gio-hang"
                        onClick={closeCart}
                        className="w-full py-2 bg-white border border-border text-text-dark font-medium rounded-xl hover:bg-ivory transition-all text-xs text-center flex items-center justify-center"
                      >
                        Xem chi tiết giỏ hàng
                      </Link>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between text-xs text-text-muted pt-1">
                  <span>Thanh toán khi nhận hàng (COD)</span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-text-muted hover:text-sale transition-colors cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Order Success Modal */}
      {completedOrder && (
        <OrderSuccessModal
          orderId={completedOrder.orderId}
          customerName={completedOrder.customerName}
          total={completedOrder.total}
          onClose={() => setCompletedOrder(null)}
        />
      )}
    </AnimatePresence>
  );
}
