'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Info } from 'lucide-react';
import { products } from '@/data/products';
import { Product } from '@/types';

interface ProductSidebarSponsoredCardProps {
  currentProductId?: string;
  className?: string;
}

/**
 * Trả về tên ngắn gọn, chuẩn nhận diện cho sản phẩm hiển thị trên card
 */
function getCleanProductName(product: Product): string {
  if (product.slug?.includes('sua-bap-nep')) return 'Sữa Bắp Nếp Tươi Thái Sơn';
  if (product.slug?.includes('sua-hat-sen-mekong')) return 'Sữa Hạt Sen Mekong Xanh';
  if (product.slug?.includes('sua-gao-lut-mekong')) return 'Sữa Gạo Lứt Mekong Xanh';
  if (product.slug?.includes('sua-hat-sen-lotus')) return 'Sữa Hạt Sen Lotus Yoo';
  if (product.slug?.includes('nha-dam-mu-trom')) return 'Nha Đam Mủ Trôm Thái Sơn';
  if (product.slug?.includes('tao-do-hat-chia')) return 'Táo Đỏ Hạt Chia Thái Sơn';
  if (product.slug?.includes('sam-la-han')) return 'Sâm La Hán Hoa Cúc Thái Sơn';
  if (product.slug?.includes('tra-sua-truyen-thong')) return 'Trà Sữa Ciao Truyền Thống';
  if (product.slug?.includes('tra-sua-matcha')) return 'Trà Sữa Ciao Matcha';

  const firstPart = product.name.split(',')[0].trim();
  return firstPart.length > 35 ? firstPart.slice(0, 32) + '...' : firstPart;
}

export default function ProductSidebarSponsoredCard({
  currentProductId,
  className = '',
}: ProductSidebarSponsoredCardProps) {
  // Chọn sản phẩm Best Seller hoặc Đang Sale khác với sản phẩm hiện tại
  const candidateProducts = products.filter((p) => p.id !== currentProductId && p.isActive);

  // Ưu tiên sản phẩm Bestseller hoặc có ưu đãi tốt
  const recommendedProduct: Product =
    candidateProducts.find((p) => p.id === 'sua-bap-nep' || p.slug === 'sua-bap-nep-thai-son') ||
    candidateProducts.find((p) => p.id === 'sua-hat-sen-mekong' || p.slug === 'sua-hat-sen-mekong-xanh') ||
    candidateProducts.find((p) => p.isBestSeller) ||
    candidateProducts[0] ||
    products[0];

  if (!recommendedProduct) return null;

  // Lấy giá lốc (nếu có variant) hoặc giá cơ bản
  const defaultPackVariant = recommendedProduct.variants?.find((v) => v.quantity === 7) || recommendedProduct.variants?.[0];
  const price = defaultPackVariant ? defaultPackVariant.price : recommendedProduct.price * 7;
  const originalPrice = recommendedProduct.originalPrice
    ? (defaultPackVariant ? Math.round(recommendedProduct.originalPrice * (defaultPackVariant.quantity || 7)) : Math.round(recommendedProduct.originalPrice * 7))
    : Math.round(price * 1.35);

  const cleanName = getCleanProductName(recommendedProduct);
  const packUnit = defaultPackVariant ? `Lốc ${defaultPackVariant.name} 330ml` : 'Lốc 7 chai 330ml';
  const productLink = `/san-pham/${recommendedProduct.slug}`;
  const thumbnail = recommendedProduct.thumbnail || '/images/products/1200x900-sb1.jpg';

  return (
    <div className={`w-full ${className}`}>
      {/* ── Box quảng cáo gợi ý chuẩn Amazon Sponsored Product Card ── */}
      <div className="relative bg-white rounded-lg border border-gray-200/90 p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_3px_12px_rgba(0,0,0,0.07)] transition-all duration-300">
        <Link href={productLink} className="block group">
          {/* HÀNG TRÊN: Logo thương hiệu bên trái + Mini banner/ảnh sản phẩm bên phải */}
          <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
            {/* Logo Thương Hiệu */}
            <div className="relative w-24 h-9 sm:w-28 sm:h-10 shrink-0">
              <Image
                src="/images/logo-clean-1000.png"
                alt="Thái Sơn Foods"
                fill
                sizes="120px"
                className="object-contain object-left group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Mini Product / Lifestyle Banner bên phải */}
            <div className="relative w-24 sm:w-28 h-14 sm:h-16 rounded-md overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
              <Image
                src={thumbnail}
                alt={cleanName}
                fill
                sizes="120px"
                className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          {/* PHẦN GIỮA: Thông tin sản phẩm chính thức & Thông tin đánh giá */}
          <div className="pt-2">
            {/* Tag định danh Bán chạy nhất */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-tight uppercase">
                Bán chạy nhất
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                100% Tự nhiên
              </span>
            </div>

            {/* Tên sản phẩm chuẩn xác, gọn gàng */}
            <h4
              className="text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-[#1B5E3B] transition-colors leading-snug line-clamp-2"
              title={`${cleanName} (${packUnit})`}
            >
              {cleanName} ({packUnit})
            </h4>

            {/* Hàng Đánh Giá Sao Chuẩn Amazon */}
            <div className="flex items-center gap-1 text-xs mt-1.5 flex-wrap">
              <span className="font-bold text-gray-900 text-xs">4.8</span>
              <div className="flex items-center text-[#FFA41C]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-[#FFA41C] stroke-[#FFA41C]" />
                ))}
              </div>
              <span className="text-[11px] text-[#007185] font-medium ml-0.5">
                548
              </span>
            </div>

            {/* Hàng Giá & Huy hiệu Prime */}
            <div className="flex items-baseline gap-2 flex-wrap mt-1.5">
              <span className="text-sm sm:text-base font-bold text-gray-900 leading-none">
                {price.toLocaleString('vi-VN')}₫
              </span>
              {originalPrice > price && (
                <span className="text-xs text-gray-400 line-through">
                  {originalPrice.toLocaleString('vi-VN')}₫
                </span>
              )}
              {/* Huy hiệu Prime chuẩn Amazon */}
              <span className="inline-flex items-center text-[#007185] font-black text-xs italic tracking-tighter ml-auto">
                <span className="text-[#007185] mr-0.5 font-bold not-italic">✓</span>
                <span className="text-[#007185] font-black not-italic text-[11px] font-sans">prime</span>
              </span>
            </div>

            {/* Huy hiệu Ưu đãi / Subscribe & Save chuẩn Ahorra con Planea y ahorra */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              <span className="bg-[#CC0C39] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xs tracking-tight uppercase">
                Tiết kiệm 15%
              </span>
              <span className="text-[11px] text-gray-700 font-medium">
                khi Đăng ký định kỳ
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Dòng ghi chú Patrocinado / Được tài trợ góc dưới bên phải */}
      <div className="flex items-center justify-end gap-1 mt-1 pr-1 text-[11px] text-gray-400 select-none">
        <span>Được tài trợ</span>
        <Info className="w-3 h-3 text-gray-400" />
      </div>
    </div>
  );
}
