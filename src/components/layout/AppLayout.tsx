'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingCartWidget from '@/components/cart/FloatingCartWidget';
import CartDrawer from '@/components/cart/CartDrawer';
import { FlyToCartProvider } from '@/context/FlyToCartContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { UserAuthProvider } from '@/context/UserAuthContext';
import AuthModal from '@/components/auth/AuthModal';
import BranchSelectorModal from '@/components/store/BranchSelectorModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Giỏ hàng popup/nổi (FloatingCartWidget) CHỈ hiển thị ngoài giao diện Trang chủ ('/').
  // Các trang chi tiết (/san-pham/*, /combo/*) đã có sẵn CartStickySidebar mở cố định bên phải.
  // Các trang /gio-hang và /thanh-toan là trang chức năng giỏ hàng/thanh toán.
  const showFloatingCart = pathname === '/';

  return (
    <LanguageProvider>
      <UserAuthProvider>
        <FlyToCartProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="min-h-screen flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            {showFloatingCart && <FloatingCartWidget />}
            <AuthModal />
            <BranchSelectorModal />
          </div>
        </FlyToCartProvider>
      </UserAuthProvider>
    </LanguageProvider>
  );
}
