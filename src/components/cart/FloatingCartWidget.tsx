'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingBag, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingCartWidget() {
  const {
    items,
    openCart,
    getTotalPrice,
    lastAddedItem,
    clearLastAddedItem,
  } = useCartStore();

  const [toastItem, setToastItem] = useState<typeof lastAddedItem>(null);
  const [bounceKey, setBounceKey] = useState(0);

  const totalPrice = getTotalPrice();
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);

  // Lắng nghe khi có món mới vừa được thêm vào giỏ ("quăng vào giỏ")
  useEffect(() => {
    if (lastAddedItem) {
      setToastItem(lastAddedItem);
      setBounceKey((k) => k + 1); // Kích hoạt hiệu ứng nảy/rung của widget

      // Tự động đóng popup mini sau 3.5 giây
      const timer = setTimeout(() => {
        setToastItem(null);
        clearLastAddedItem();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [lastAddedItem, clearLastAddedItem]);

  return (
    <div className="fixed bottom-6 right-5 sm:bottom-8 sm:right-7 z-50 flex flex-col items-end gap-2.5 pointer-events-none select-none">
      {/* ─────────────────────────────────────────────────────────────
          1. POPUP MINI PREVIEW: HIỆN LÊN KHI MÓN VỪA ĐƯỢC QUĂNG VÀO GIỎ
      ────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastItem && (
          <motion.div
            key={`toast-${toastItem.productId}-${bounceKey}`}
            initial={{ opacity: 0, y: 25, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-emerald-600/30 p-3 sm:p-3.5 max-w-[290px] sm:max-w-xs flex items-center gap-3 ring-4 ring-emerald-500/10 cursor-pointer"
            onClick={() => {
              openCart();
              setToastItem(null);
            }}
          >
            {/* Ảnh món vừa thêm */}
            <div className="relative w-12 h-12 rounded-xl bg-ivory p-1 shrink-0 border border-emerald-100 flex items-center justify-center overflow-hidden">
              <Image
                src={toastItem.thumbnail}
                alt={toastItem.name}
                fill
                className="object-contain"
                sizes="48px"
              />
            </div>

            {/* Thông tin món & lời chúc */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Đã quăng vào giỏ hàng!</span>
              </div>
              <h4 className="text-xs sm:text-[13px] font-extrabold text-[#11241C] truncate leading-tight mt-0.5">
                {toastItem.name}
              </h4>
              <p className="text-xs font-black text-emerald-900 mt-0.5">
                {formatPrice(toastItem.price)}đ
                {toastItem.quantity > 1 ? ` x ${toastItem.quantity}` : ''}
              </p>
            </div>

            {/* Nút đóng nhanh toast */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setToastItem(null);
              }}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. WIDGET GIỎ HÀNG NỔI "BAY BAY KHI LƯỚT" (FLOATING CAPSULE PILL)
      ────────────────────────────────────────────────────────────── */}
      <motion.button
        key={bounceKey}
        type="button"
        onClick={openCart}
        initial={{ scale: 0.95 }}
        animate={
          bounceKey > 0
            ? { scale: [1, 1.22, 0.94, 1.06, 1], rotate: [0, -3, 3, -1, 0] }
            : { scale: 1 }
        }
        transition={{ duration: 0.45, ease: 'easeOut' }}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="pointer-events-auto group relative flex items-center gap-2.5 sm:gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-emerald-800 via-[#1B4D3E] to-emerald-900 text-white shadow-2xl shadow-emerald-950/40 border border-emerald-500/40 hover:border-emerald-300 transition-all cursor-pointer"
        aria-label={`Giỏ hàng nổi: ${totalQuantity} sản phẩm, tổng cộng ${formatPrice(totalPrice)}đ`}
      >
        {/* Vòng hào quang nhẹ (Glow Effect) */}
        <span className="absolute -inset-0.5 rounded-full bg-emerald-400 opacity-20 blur-sm group-hover:opacity-40 transition-opacity" />

        {/* Icon túi hàng + Badge đỏ nổi bật */}
        <div className="relative z-10 w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 border border-white/20">
          <ShoppingBag className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
          {totalQuantity > 0 && (
            <motion.span
              key={`badge-${totalQuantity}`}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-sale text-white text-[11px] font-black flex items-center justify-center shadow-md border-2 border-emerald-900"
            >
              {totalQuantity > 99 ? '99+' : totalQuantity}
            </motion.span>
          )}
        </div>

        {/* Nhãn giỏ hàng & Tạm tính */}
        <div className="relative z-10 text-left min-w-0 pr-1">
          <div className="text-[11px] font-semibold text-emerald-200 leading-tight">
            {totalQuantity > 0 ? 'Giỏ hàng của bạn' : 'Giỏ hàng'}
          </div>
          <div className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5">
            {totalQuantity > 0 ? `${formatPrice(totalPrice)}đ` : '0 món'}
          </div>
        </div>

        {/* Mũi tên trượt */}
        <div className="relative z-10 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-emerald-200 group-hover:text-white group-hover:translate-x-0.5 transition-all">
          <ChevronRight className="w-4 h-4" />
        </div>
      </motion.button>
    </div>
  );
}
