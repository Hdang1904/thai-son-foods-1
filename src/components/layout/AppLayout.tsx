'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import FloatingCartWidget from '@/components/cart/FloatingCartWidget';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Trang admin (/admin) và trang thanh toán (/thanh-toan) không hiển thị giỏ hàng nổi
  const isAdmin = pathname?.startsWith('/admin');
  const isCheckout = pathname?.startsWith('/thanh-toan');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Header chính của website */}
      <Header />

      {/* Nội dung chính: 100% chiều rộng tự nhiên, không bị co ép layout */}
      <main className="pt-[76px] min-h-screen flex-1">{children}</main>

      {/* Chân trang */}
      <Footer />

      {/* Drawer giỏ hàng trượt đầy đủ */}
      <CartDrawer />

      {/* Widget giỏ hàng nổi "bay bay khi lướt" kèm hiệu ứng quăng đồ vào giỏ (ẩn ở trang thanh toán) */}
      {!isCheckout && <FloatingCartWidget />}
    </div>
  );
}
