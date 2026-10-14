'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import { Product } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { getBottleVolume, getShortProductName, getUnitPrice, getVariantLabel, sortVariants, isSameProduct, getProductImage } from '@/lib/product-detail';

interface ProductCompareTableProps {
  current: Product;
  others: Product[];
}

/**
 * "So sánh với sản phẩm tương tự" — toàn bộ số liệu lấy từ dữ liệu sản phẩm thật
 * (giá quy cách nhỏ nhất, đơn giá/chai, dung tích, các quy cách, thuần chay).
 * Bảng cuộn ngang trong khung riêng trên màn hình hẹp.
 */
export default function ProductCompareTable({ current, others }: ProductCompareTableProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const columns = [current, ...others.filter((p) => !isSameProduct(p, current))].slice(0, 4);
  if (columns.length < 2) return null;

  const rows: { label: string; render: (p: Product) => React.ReactNode }[] = [
    {
      label: isEn ? 'Starting price' : 'Giá từ',
      render: (p) => {
        const v = sortVariants(p.variants)[0];
        return (
          <span className="font-bold text-[#0F1111]">
            {formatPrice(v ? v.price : p.price)}đ
            {v && <span className="block text-xs font-normal text-gray-600">{getVariantLabel(v, language)}</span>}
          </span>
        );
      },
    },
    {
      label: isEn ? 'Price per bottle' : 'Đơn giá / chai',
      render: (p) => {
        const v = sortVariants(p.variants)[0];
        return v ? `${formatPrice(getUnitPrice(v))}đ` : `${formatPrice(p.price)}đ`;
      },
    },
    {
      label: isEn ? 'Bottle volume' : 'Dung tích chai',
      render: (p) => getBottleVolume(p, sortVariants(p.variants)[0]) || '—',
    },
    {
      label: isEn ? 'Pack sizes' : 'Quy cách',
      render: (p) => sortVariants(p.variants).map((v) => getVariantLabel(v, language)).join(', ') || '—',
    },
    {
      label: isEn ? 'Vegan' : 'Thuần chay',
      render: (p) =>
        p.isVegan ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Leaf className="w-3.5 h-3.5" aria-hidden /> {isEn ? 'Yes' : 'Có'}
          </span>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <section className="max-w-[1456px] mx-auto px-4 sm:px-6 py-6 md:py-8" aria-labelledby="compare-title">
      <h2 id="compare-title" className="text-lg md:text-xl font-bold text-[#0F1111] mb-3">
        {isEn ? 'Compare with similar items' : 'So sánh với sản phẩm tương tự'}
      </h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="w-[150px] bg-gray-50" />
              {columns.map((p) => {
                const isCurrent = isSameProduct(p, current);
                return (
                  <th key={p.id} scope="col" className={cn('p-3 align-top font-normal text-left', isCurrent && 'bg-green-primary/[0.04]')}>
                    <Link href={`/san-pham/${p.slug}`} className="group block" aria-current={isCurrent ? 'page' : undefined}>
                      <span className="relative block w-full max-w-[160px] aspect-[4/3] rounded-md overflow-hidden bg-white border border-gray-100">
                        <Image src={getProductImage(p)} alt="" fill sizes="160px" className="object-contain" />
                      </span>
                      <span className="mt-2 block text-[13px] leading-snug text-[#007185] group-hover:text-[#C7511F] group-hover:underline line-clamp-2">
                        {getShortProductName(p, language)}
                      </span>
                      {isCurrent && (
                        <span className="mt-1 inline-block text-[11px] font-semibold text-green-primary">
                          {isEn ? 'This item' : 'Sản phẩm đang xem'}
                        </span>
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100 last:border-0">
                <th scope="row" className="bg-gray-50 p-3 text-left text-[13px] font-semibold text-gray-700 align-top">
                  {row.label}
                </th>
                {columns.map((p) => (
                  <td
                    key={p.id}
                    className={cn('p-3 align-top text-[13px] text-[#0F1111]', isSameProduct(p, current) && 'bg-green-primary/[0.04]')}
                  >
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
