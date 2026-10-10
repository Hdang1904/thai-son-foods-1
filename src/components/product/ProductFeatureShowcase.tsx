'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';

interface ProductFeatureShowcaseProps {
  productName?: string;
  productThumbnail?: string;
  className?: string;
}

export default function ProductFeatureShowcase({
  productName = 'Sữa Bắp Nếp Tươi',
  productThumbnail,
  className = '',
}: ProductFeatureShowcaseProps) {
  return (
    <section className={`bg-[#FAF9F5] py-12 md:py-16 border-t border-gray-200 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* 1. HEADER TRUNG TÂM */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1B5E3B] text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ĐẶC TÍNH & NGUỒN GỐC THUẦN TỰ NHIÊN</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            Trải Nghiệm Trọn Vẹn Tinh Túy Bắp Nếp Tươi
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Thức uống thuần chay dinh dưỡng, vị ngon thanh mát từ thiên nhiên dành riêng cho bạn.
          </p>
        </div>

        {/* 2. CARD CHỨA 2 BANNER XẾP CHỒNG (STACKED CARD) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
          {/* Banner 1 (Phía trên): Hình ảnh thiết kế hoàn chỉnh */}
          <div className="relative w-full aspect-[1024/453] bg-[#FAF8F5] overflow-hidden group">
            <Image
              src="/images/banners/banner-feature-bap-01.jpg"
              alt="Thành phần từ bắp tươi - Uống một bữa ăn ngon lành - Sản phẩm thuần chay thành phần từ thiên nhiên"
              fill
              priority
              className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>

          {/* Đường kẻ phân cách */}
          <div className="w-full h-px bg-gray-100" />

          {/* Banner 2 (Phía dưới): Hình ảnh thiết kế hoàn chỉnh 4 nhánh Infographic */}
          <div className="relative w-full aspect-[1024/453] bg-[#FAF8F5] overflow-hidden group">
            <Image
              src="/images/banners/banner-feature-bap-02.jpg"
              alt="Đặc tính sản phẩm Sữa Bắp Nếp Thái Sơn - Nguyên liệu tươi, Đóng chai tiện lợi, Vị ngọt tự nhiên, Bảo quản lạnh"
              fill
              className="object-cover object-center group-hover:scale-[1.01] transition-transform duration-500"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
