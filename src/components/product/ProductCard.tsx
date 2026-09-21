'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart';

interface ProductCardProps {
  product: Product;
  layout?: 'vertical' | 'horizontal';
}
export default function ProductCard({ product, layout = 'vertical' }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      unit: product.unit,
      thumbnail: product.thumbnail,
    });
  };

  // Xác định ảnh là poster full-bleed (620x930, 800x1200) hay ảnh chai/sản phẩm
  const isPoster =
    product.thumbnail.includes('620x930') ||
    product.thumbnail.includes('800x1200') ||
    product.thumbnail.includes('lifestyle') ||
    product.imageFit === 'cover';

  const isBottle = !isPoster || product.thumbnail.endsWith('.png') || product.imageFit === 'contain';

  // ─── BỐ CỤC NẰM NGANG (Dành cho hàng 2 sản phẩm: 1 bên sản phẩm, 1 bên title & thông tin) ───
  if (layout === 'horizontal') {
    return (
      <article className="group h-full flex flex-col">
        <Link
          href={`/san-pham/${product.slug}`}
          className="flex flex-row h-full bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          {/* 1 BÊN LÀ SẢN PHẨM (Khung ảnh) — Đồng bộ chuẩn tỷ lệ 4:3 (1200x900px) giống hệt hàng 3 sản phẩm */}
          <div
            className={`relative w-[44%] sm:w-[46%] md:w-[48%] aspect-[4/3] shrink-0 overflow-hidden flex items-center justify-center ${isBottle ? 'bg-[#FAF8F5]' : 'bg-gray-100'
              }`}
          >
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className={`${isBottle
                  ? 'object-contain p-3 sm:p-4 md:p-5'
                  : 'object-cover object-center'
                } transition-transform duration-500 group-hover:scale-105`}
              sizes="(max-width: 640px) 50vw, 35vw"
              loading="lazy"
            />

            {/* Huy hiệu Bán chạy / Mới — Tự động sang góc phải nếu là poster có con dấu đỏ bên trái */}
            <div
              className={`absolute top-2.5 ${isPoster ? 'right-2.5' : 'left-2.5'
                } flex flex-col gap-1.5 z-10`}
            >
              {product.isBestSeller && (
                <span className="px-2 py-0.5 text-[10px] md:text-xs font-semibold bg-green-primary text-white rounded-md shadow-xs">
                  Bán chạy
                </span>
              )}
              {product.isNew && (
                <span className="px-2 py-0.5 text-[10px] md:text-xs font-semibold bg-corn text-text-dark rounded-md shadow-xs">
                  Mới
                </span>
              )}
            </div>
          </div>

          {/* 1 BÊN LÀ TITLE & THÔNG TIN */}
          <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3
                title={product.name}
                className="text-sm sm:text-base md:text-lg font-bold text-text-dark line-clamp-2 mb-1.5 leading-snug group-hover:text-green-primary transition-colors"
              >
                {product.name}
              </h3>

              {product.shortDescription && (
                <p className="text-[11px] sm:text-xs md:text-sm text-text-muted line-clamp-2 sm:line-clamp-3 leading-relaxed mb-2">
                  {product.shortDescription}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-auto pt-2 sm:pt-3 border-t border-gray-100">
              <p className="text-sm sm:text-base md:text-lg font-bold text-green-primary">
                {formatPrice(product.price)}đ
                <span className="text-xs md:text-sm font-normal text-text-muted ml-0.5">
                  / {product.unit}
                </span>
              </p>

              <button
                onClick={handleAddToCart}
                className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center bg-green-primary text-white rounded-xl hover:bg-green-dark transition-colors active:scale-95 cursor-pointer shadow-xs"
                aria-label={`Thêm ${product.name} vào giỏ hàng`}
              >
                <ShoppingBag className="w-4 h-4 md:w-[18px] md:h-[18px]" />
              </button>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // ─── BỐ CỤC ĐỨNG MẶC ĐỊNH (Dành cho hàng 3 sản phẩm: Title ở dưới sản phẩm) ───
  return (
    <article className="group h-full flex flex-col">
      <Link
        href={`/san-pham/${product.slug}`}
        className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      >
        {/* Khung thẻ ảnh — Tỷ lệ chuẩn 4:3 khớp hoàn hảo với poster cánh đồng và chai đơn */}
        <div
          className={`relative aspect-[4/3] w-full overflow-hidden flex items-center justify-center ${isBottle ? 'bg-[#FAF8F5]' : 'bg-gray-100'
            }`}
        >
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className={`${isBottle
                ? 'object-contain p-4 sm:p-5 md:p-6'
                : 'object-cover object-top'
              } transition-transform duration-500 group-hover:scale-105`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />

          {/* Huy hiệu Bán chạy / Mới — Tự động sang góc phải nếu là poster có con dấu đỏ bên trái */}
          <div
            className={`absolute top-2.5 ${isPoster ? 'right-2.5' : 'left-2.5'
              } flex flex-col gap-1.5 z-10`}
          >
            {product.isBestSeller && (
              <span className="px-2 py-0.5 text-[10px] md:text-xs font-semibold bg-green-primary text-white rounded-md shadow-xs">
                Bán chạy
              </span>
            )}
            {product.isNew && (
              <span className="px-2 py-0.5 text-[10px] md:text-xs font-semibold bg-corn text-text-dark rounded-md shadow-xs">
                Mới
              </span>
            )}
          </div>
        </div>

        {/* Thông tin sản phẩm — Title ở dưới sản phẩm */}
        <div className="p-3.5 sm:p-4 md:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3
              title={product.name}
              className="text-sm sm:text-base md:text-lg font-bold text-text-dark line-clamp-2 mb-1.5 leading-snug group-hover:text-green-primary transition-colors"
            >
              {product.name}
            </h3>

            {product.shortDescription && (
              <p className="text-[11px] sm:text-xs md:text-sm text-text-muted line-clamp-2 leading-relaxed mb-3">
                {product.shortDescription}
              </p>

            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2 sm:pt-3 border-t border-gray-100">
            <p className="text-sm sm:text-base md:text-lg font-bold text-green-primary">
              {formatPrice(product.price)}đ
              <span className="text-xs md:text-sm font-normal text-text-muted ml-0.5">
                / {product.unit}
              </span>
            </p>

            <button
              onClick={handleAddToCart}
              className="shrink-0 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center bg-green-primary text-white rounded-xl hover:bg-green-dark transition-colors active:scale-95 cursor-pointer shadow-xs"
              aria-label={`Thêm ${product.name} vào giỏ hàng`}
            >

              <ShoppingBag className="w-4 h-4 md:w-[18px] md:h-[18px]" />
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
