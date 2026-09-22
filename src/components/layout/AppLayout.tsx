'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import CartStickySidebar from '@/components/cart/CartStickySidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Trang thanh toán (/thanh-toan) và trang admin (/admin) không hiển thị Cart Sidebar
  const isExcluded = pathname?.startsWith('/thanh-toan') || pathname?.startsWith('/admin');

  if (isExcluded) {
    if (pathname?.startsWith('/admin')) {
      return <>{children}</>;
    }

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="pt-[76px] min-h-screen flex-1">{children}</main>
        <Footer />
        {/* Vẫn giữ CartDrawer cho trường hợp người dùng trên mobile */}
        <CartDrawer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-row">
      {/* ─────────────────────────────────────────────────────────────
          VÙNG NỘI DUNG CHÍNH (BÊN TRÁI): Header, main page, Footer
      ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="pt-[76px] min-h-screen flex-1">{children}</main>
        <Footer />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VÙNG GIỎ HÀNG CỐ ĐỊNH (BÊN PHẢI): Sticky Sidebar
          Chỉ kích hoạt trên màn hình desktop lớn >= 1440px
      ────────────────────────────────────────────────────────────── */}
      <aside
        aria-label="Giỏ hàng cố định"
        className="hidden min-[1440px]:flex flex-col w-[380px] shrink-0 sticky top-0 h-screen border-l border-border-light bg-white shadow-xl z-40 overflow-hidden"
      >
        <CartStickySidebar />
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          CART DRAWER TRƯỢT TỪ CẠNH PHẢI:
          Chỉ dành riêng cho màn hình < 1440px (Laptop nhỏ, Tablet, Mobile)
      ────────────────────────────────────────────────────────────── */}
      <div className="min-[1440px]:hidden">
        <CartDrawer />
      </div>
    </div>
  );
}
