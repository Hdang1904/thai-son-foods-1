'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/#combo', label: 'Combo' },
  { href: '/#kho-si', label: 'Kho / Sỉ' },
  { href: '/#ve-chung-toi', label: 'Về chúng tôi' },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { openCart, getTotalQuantity } = useCartStore();
  const totalQuantity = useCartStore((s) => s.items.reduce((t, i) => t + i.quantity, 0));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs py-2'
          : 'bg-ivory/80 backdrop-blur-md py-3 md:py-4'
      )}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-[80px] md:h-[86px]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0"
            aria-label="Thái Sơn Foods - Trang chủ"
          >
            <div className="relative h-14 w-52 sm:h-16 sm:w-60 md:h-[72px] md:w-[250px]">
              <Image
                src="/images/logo-vien-trang.png"
                alt="Thái Sơn Foods - Món ngon quê Việt"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-[6px]" aria-label="Menu chính">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-[17px] font-medium text-text-body hover:text-green-primary transition-colors rounded-lg hover:bg-ivory-dark/50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <Link
              href="/san-pham"
              className="p-2.5 text-text-body hover:text-green-primary transition-colors rounded-lg hover:bg-ivory-dark/50"
              aria-label="Tìm kiếm sản phẩm"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* User */}
            <button
              className="hidden sm:flex p-2.5 text-text-body hover:text-green-primary transition-colors rounded-lg hover:bg-ivory-dark/50"
              aria-label="Tài khoản"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative p-2.5 text-text-body hover:text-green-primary transition-colors rounded-lg hover:bg-ivory-dark/50"
              aria-label={`Giỏ hàng, ${totalQuantity} sản phẩm`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalQuantity > 0 && (
                <span
                  key={totalQuantity}
                  className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center px-1 text-[11px] font-bold text-white bg-sale rounded-full animate-pulse-badge"
                >
                  {totalQuantity > 99 ? '99+' : totalQuantity}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2.5 text-text-body hover:text-green-primary transition-colors rounded-lg"
              aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300 bg-white border-t border-border-light',
          isMobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <nav className="section-container py-4 flex flex-col gap-1" aria-label="Menu di động">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-base font-medium text-text-body hover:text-green-primary hover:bg-ivory-dark/50 rounded-lg transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
