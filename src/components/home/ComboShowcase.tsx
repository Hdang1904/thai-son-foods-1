'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ShoppingBag, Sparkles } from 'lucide-react';
import { combos } from '@/data/combos';
import { formatPrice, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';

export default function ComboShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCombo = combos[activeIndex] || combos[0];
  const isCombo01 = activeCombo.id === 'combo-4-chai';
  const isCombo02 = activeCombo.id === 'combo-van-phong';

  return (
    <section id="combo" className="section-container py-10 md:py-16">
      {/* ─── 1. BẢN MOBILE: Hiển thị dạng Card Accordion chuẩn theo mẫu the 350F ─── */}
      <div className="lg:hidden bg-[#FFF9F2] border border-[#EFE8DC] rounded-[26px] sm:rounded-[30px] p-4 sm:p-6 shadow-xs">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0F2A1F] font-serif mb-4 px-1">
          Combo tiết kiệm
        </h2>

        <div className="flex flex-col gap-1.5">
          {combos.map((combo, index) => {
            const isSelected = activeIndex === index;
            const isThisCombo01 = combo.id === 'combo-4-chai';
            const isThisCombo02 = combo.id === 'combo-van-phong';

            if (isSelected) {
              return (
                <motion.div
                  key={combo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="w-full overflow-hidden rounded-2xl shadow-sm border border-emerald-950/10 mb-2 bg-white"
                >
                  {/* Thanh tiêu đề tối màu đặc trưng */}
                  {isThisCombo01 || isThisCombo02 ? (
                    <Link
                      href={isThisCombo01 ? '/combo?type=combo-4-chai' : '/combo?type=combo-van-phong'}
                      className="bg-[#0B1E16] text-white px-4 py-3 flex items-center justify-between transition-colors hover:bg-[#143D28]"
                    >
                      <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                        <span className="text-corn">{String(index + 1).padStart(2, '0')}.</span>
                        <span>{combo.name}</span>
                        <span className="text-[10px] bg-corn text-text-dark px-2 py-0.5 rounded-full font-bold ml-1">
                          {isThisCombo01 ? 'Tự chọn 4 vị' : 'Tự chọn 10 chai'}
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-corn">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </Link>
                  ) : (
                    <div className="bg-[#0B1E16] text-white px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                        <span className="text-corn">{String(index + 1).padStart(2, '0')}.</span>
                        <span>{combo.name}</span>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/80">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* Ảnh Combo đang mở rộng */}
                  <div className="relative aspect-[4/3] w-full bg-ivory overflow-hidden">
                    <Image
                      src={combo.image}
                      alt={combo.name}
                      fill
                      className="object-cover object-top"
                      sizes="100vw"
                      priority
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

                    <div className="absolute bottom-0 left-0 right-0 p-3.5">
                      <p className="text-white/85 text-xs line-clamp-1 mb-2 drop-shadow-xs">
                        {combo.description}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg font-bold text-corn drop-shadow-xs">
                            {formatPrice(combo.salePrice)}đ
                          </span>
                          <span className="text-xs text-white/60 line-through">
                            {formatPrice(combo.originalPrice)}đ
                          </span>
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-sale text-white rounded">
                            -{combo.discount}%
                          </span>
                        </div>

                        {isThisCombo01 || isThisCombo02 ? (
                          <Link
                            href={isThisCombo01 ? '/combo?type=combo-4-chai' : '/combo?type=combo-van-phong'}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-corn text-text-dark font-bold rounded-lg text-xs active:scale-95 shadow-xs"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{isThisCombo01 ? 'Tùy chọn 4 chai' : 'Tùy chọn 10 chai'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              useCartStore.getState().addItem({
                                productId: combo.id,
                                name: combo.name,
                                slug: '#combo',
                                price: combo.salePrice,
                                unit: `${combo.totalItems} chai`,
                                thumbnail: combo.image,
                              });
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-green-primary font-bold rounded-lg text-xs active:scale-95 shadow-xs"
                          >
                            <ShoppingBag className="w-3 h-3" />
                            <span>Thêm vào giỏ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Dòng thu gọn (Collapsed Item)
            return (
              <button
                key={combo.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="w-full text-left py-3 px-3 rounded-xl hover:bg-black/5 transition-colors border-t border-[#EDE4D6] flex items-center justify-between text-sm sm:text-base font-medium text-[#2C4035]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#8C9B92] font-semibold text-xs sm:text-sm">
                    {String(index + 1).padStart(2, '0')}.
                  </span>
                  <span>{combo.name}</span>
                </div>
                <span className="text-xs text-[#8C9B92]">
                  {formatPrice(combo.salePrice)}đ
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. BẢN DESKTOP: Giữ nguyên 100% giao diện 2 cột đã hoàn thiện ─── */}
      <div className="hidden lg:block">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-dark font-heading mb-8 md:mb-10"
        >
          Combo tiết kiệm
        </motion.h2>

        <div className="grid grid-cols-2 gap-10">
          {/* Cột trái — Danh sách Combo */}
          <div className="flex flex-col gap-2">
            {combos.map((combo, index) => {
              const isSelected = activeIndex === index;
              const isThisCombo01 = combo.id === 'combo-4-chai';
              const isThisCombo02 = combo.id === 'combo-van-phong';

              const innerContent = (
                <>
                  <div className="flex items-center gap-4 min-w-0">
                    <span
                      className={cn(
                        'text-sm font-bold min-w-[28px]',
                        isSelected ? 'text-corn' : 'text-text-muted'
                      )}
                    >
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base md:text-lg font-semibold truncate">
                          {combo.name}
                        </h3>
                        {isThisCombo01 && (
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                              isSelected
                                ? 'bg-corn text-text-dark font-bold'
                                : 'bg-green-primary/10 text-green-primary'
                            )}
                          >
                            <Sparkles className="w-3 h-3" />
                            Tự chọn 4 vị
                          </span>
                        )}
                        {isThisCombo02 && (
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                              isSelected
                                ? 'bg-corn text-text-dark font-bold'
                                : 'bg-green-primary/10 text-green-primary'
                            )}
                          >
                            <Sparkles className="w-3 h-3" />
                            Tự chọn 10 chai
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          'text-sm mt-0.5',
                          isSelected ? 'text-white/70' : 'text-text-muted'
                        )}
                      >
                        {combo.totalItems} chai · {formatPrice(combo.salePrice)}đ
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    className={cn(
                      'w-5 h-5 transition-all duration-300 shrink-0',
                      isSelected
                        ? 'opacity-100 translate-x-0 text-corn'
                        : 'opacity-0 -translate-x-2'
                    )}
                  />
                </>
              );

              const commonClassName = cn(
                'group w-full flex items-center justify-between p-4 md:p-5 rounded-xl text-left transition-all duration-300 cursor-pointer',
                isSelected
                  ? 'bg-green-primary text-white shadow-lg shadow-green-primary/20'
                  : 'bg-white text-text-dark hover:bg-ivory-dark border border-border-light'
              );

              if (isThisCombo01 || isThisCombo02) {
                return (
                  <Link
                    key={combo.id}
                    href={isThisCombo01 ? '/combo?type=combo-4-chai' : '/combo?type=combo-van-phong'}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={commonClassName}
                  >
                    {innerContent}
                  </Link>
                );
              }

              return (
                <button
                  key={combo.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={commonClassName}
                >
                  {innerContent}
                </button>
              );
            })}
          </div>

          {/* Cột phải — Ảnh Combo hiển thị lớn */}
          <div className="relative bg-white rounded-2xl overflow-hidden aspect-[4/3] w-full shadow-sm border border-gray-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCombo.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="absolute inset-0"
              >
                <Image
                  src={activeCombo.image}
                  alt={activeCombo.name}
                  fill
                  className="object-cover object-top"
                  sizes="50vw"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-52 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 p-4 md:px-6 md:pb-4 md:pt-1">
                  {isCombo01 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-corn text-text-dark mb-1 shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      Đặc quyền tự chọn 4 vị
                    </span>
                  )}
                  {isCombo02 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-corn text-text-dark mb-1 shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      Đặc quyền tự chọn 10 chai theo nhánh
                    </span>
                  )}
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-white font-heading mb-0.5 drop-shadow-xs">
                    {activeCombo.name}
                  </h3>
                  <p className="text-white/85 text-xs sm:text-sm mb-2 line-clamp-1 drop-shadow-xs max-w-[95%]">
                    {activeCombo.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg md:text-xl font-bold text-corn drop-shadow-xs">
                        {formatPrice(activeCombo.salePrice)}đ
                      </span>
                      <span className="text-xs sm:text-sm text-white/60 line-through">
                        {formatPrice(activeCombo.originalPrice)}đ
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-sale text-white rounded">
                        -{activeCombo.discount}%
                      </span>
                    </div>

                    {isCombo01 || isCombo02 ? (
                      <Link
                        href={isCombo01 ? '/combo?type=combo-4-chai' : '/combo?type=combo-van-phong'}
                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-corn text-text-dark font-bold rounded-lg hover:bg-yellow-400 hover:shadow-md transition-all text-xs sm:text-sm active:scale-95 cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isCombo01 ? 'Tùy chọn 4 chai' : 'Tùy chọn 10 chai'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          useCartStore.getState().addItem({
                            productId: activeCombo.id,
                            name: activeCombo.name,
                            slug: '#combo',
                            price: activeCombo.salePrice,
                            unit: `${activeCombo.totalItems} chai`,
                            thumbnail: activeCombo.image,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-white text-green-primary font-semibold rounded-lg hover:bg-ivory hover:shadow-md transition-all text-xs sm:text-sm active:scale-95 cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Thêm combo vào giỏ</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
