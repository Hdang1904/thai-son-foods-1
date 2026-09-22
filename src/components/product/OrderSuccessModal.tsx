'use client';

import { CheckCircle2, Copy, Check, ArrowRight, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { motion } from 'framer-motion';

interface OrderSuccessModalProps {
  orderId: string;
  customerName: string;
  total: number;
  onClose: () => void;
}

export default function OrderSuccessModal({
  orderId,
  customerName,
  total,
  onClose,
}: OrderSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center border border-border-light"
      >
        <div className="w-16 h-16 bg-green-primary/10 text-green-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-primary" />
        </div>

        <h3 className="text-2xl font-bold text-text-dark font-heading mb-2">
          Đặt hàng thành công!
        </h3>

        <p className="text-sm text-text-muted mb-6">
          Cảm ơn <span className="font-semibold text-text-dark">{customerName}</span> đã tin tưởng và sử dụng sản phẩm của Thái Sơn Foods. Mình sẽ liên hệ xác nhận đơn hàng cho bạn sớm nhất.
        </p>

        <div className="bg-ivory rounded-xl p-4 mb-6 text-left space-y-3 border border-border-light">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Mã đơn hàng</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-bold text-green-primary">{orderId}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-text-muted hover:text-text-dark transition-colors"
                title="Sao chép"
              >
                {copied ? <Check className="w-4 h-4 text-green-primary" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border-light pt-2">
            <span className="text-xs text-text-muted">Phương thức thanh toán</span>
            <span className="text-sm font-medium text-text-dark">Thanh toán khi nhận hàng (COD)</span>
          </div>

          <div className="flex items-center justify-between border-t border-border-light pt-2">
            <span className="text-xs text-text-muted">Tổng thanh toán</span>
            <span className="text-base font-bold text-green-primary">{formatPrice(total)}đ</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 border border-border rounded-xl text-sm font-semibold text-text-dark hover:bg-ivory-dark transition-colors"
          >
            Đóng
          </button>
          <Link
            href="/san-pham"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-green-primary text-white rounded-xl text-sm font-semibold hover:bg-green-dark transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Tiếp tục mua sắm
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
