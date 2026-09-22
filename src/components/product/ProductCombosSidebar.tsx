'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { combos } from '@/data/combos';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { Sparkles, ArrowRight, ShoppingBag, Check, Layers } from 'lucide-react';

export default function ProductCombosSidebar() {
  const [addedId, setAddedId] = useState<string | null>(null);

  const handleQuickAdd = (combo: typeof combos[0]) => {
    useCartStore.getState().addItem({
      productId: combo.id,
      name: combo.name,
      slug: '#combo',
      price: combo.salePrice,
      unit: `${combo.totalItems} chai`,
      thumbnail: combo.image,
    });
    setAddedId(combo.id);
    useCartStore.getState().openCart();
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <aside className="w-full bg-[#FAF9F5] border border-[#EBE4D8] rounded-2xl p-3.5 sm:p-4 shadow-xs">
      {/* Tiêu đề Khối Combo */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E8DFC8]">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
            <Layers className="w-3.5 h-3.5 text-corn" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#11241C] font-heading leading-none">
              Combo tiết kiệm
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">Gói nhiều chai giá ưu đãi</p>
          </div>
        </div>
        <span className="text-[10px] font-bold bg-sale/10 text-sale px-2 py-0.5 rounded-full border border-sale/20">
          Giảm đến 19%
        </span>
      </div>

      {/* Danh sách 4 Combo đầy đủ thông tin */}
      <div className="flex flex-col gap-2.5">
        {combos.map((combo, index) => {
          const isCombo01 = combo.id === 'combo-4-chai';
          const isCombo02 = combo.id === 'combo-van-phong';
          const isCustomizable = isCombo01 || isCombo02;
          const isJustAdded = addedId === combo.id;

          const customLink = isCombo01
            ? '/combo?type=combo-4-chai'
            : '/combo?type=combo-van-phong';

          return (
            <div
              key={combo.id}
              className="group bg-white rounded-xl border border-gray-200/90 hover:border-emerald-600/70 p-2.5 transition-all duration-200 hover:shadow-sm flex flex-col justify-between"
            >
              {/* Hàng trên: Ảnh + Thông tin chi tiết */}
              <div className="flex gap-2.5 items-start">
                {/* Ảnh Combo Thumbnail */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden bg-[#F5F2EB] shrink-0 border border-gray-100">
                  <Image
                    src={combo.image}
                    alt={combo.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="72px"
                  />
                  {/* Badge số chai */}
                  <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                    {combo.totalItems} chai
                  </span>
                </div>

                {/* Thông tin Text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-bold text-emerald-800">
                      0{index + 1}.
                    </span>
                    <h4 className="text-xs font-bold text-text-dark truncate leading-tight group-hover:text-emerald-800 transition-colors">
                      {combo.name}
                    </h4>
                  </div>

                  <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                    {isCombo01 && 'Tự chọn 4 chai bất kỳ'}
                    {isCombo02 && '10 chai theo cặp vị'}
                    {combo.id === 'combo-dung-thu' && 'Thưởng thức đủ vị'}
                    {combo.id === 'combo-sua-hat' && 'Sữa hạt thanh lành'}
                  </p>

                  {/* Giá bán */}
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-800">
                      {formatPrice(combo.salePrice)}đ
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">
                      {formatPrice(combo.originalPrice)}đ
                    </span>
                    <span className="text-[9px] font-bold text-sale bg-red-50 px-1 py-0.2 rounded">
                      -{combo.discount}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Hàng dưới: Nút hành động (Tùy chọn vị / Thêm nhanh) */}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                {isCustomizable ? (
                  <Link
                    href={customLink}
                    className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-700 text-emerald-900 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-corn" />
                    <span>{isCombo01 ? 'Tùy chọn 4 chai' : 'Tùy chọn 10 chai'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(combo)}
                    className={cn(
                      'w-full py-1.5 px-2.5 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition-all active:scale-95 shadow-2xs cursor-pointer',
                      isJustAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-[#FAF8F5] hover:bg-emerald-800 text-gray-800 hover:text-white border border-gray-200/80 hover:border-emerald-800'
                    )}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Đã thêm giỏ!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-3 h-3 text-emerald-700 group-hover:text-white" />
                        <span>Thêm combo vào giỏ</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ghi chú chân sidebar */}
      <div className="mt-3 pt-2.5 border-t border-[#E8DFC8]/70 text-center">
        <Link
          href="/combo"
          className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 hover:underline"
        >
          <span>Xem tất cả ưu đãi Combo</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}
