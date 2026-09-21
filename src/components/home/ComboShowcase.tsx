'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react';
import { combos } from '@/data/combos';
import { formatPrice, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart';

export default function ComboShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeCombo = combos[activeIndex] || combos[0];
  const isCombo01 = activeCombo.id === 'combo-4-chai';

  return (
    <section id="combo" className="section-container py-10 md:py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-dark font-heading mb-8 md:mb-10"
      >
        Combo tiết kiệm
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        {/* Left — Combo List */}
        <div className="flex flex-col gap-2">
          {combos.map((combo, index) => {
            const isSelected = activeIndex === index;
            const isThisCombo01 = combo.id === 'combo-4-chai';

            const innerContent = (
              <>
                <div className="flex items-center gap-3 md:gap-4 min-w-0">
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
                            'text-[10px] md:text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0',
                            isSelected
                              ? 'bg-corn text-text-dark font-bold'
                              : 'bg-green-primary/10 text-green-primary'
                          )}
                        >
                          <Sparkles className="w-3 h-3" />
                          Tự chọn 4 vị
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

            if (isThisCombo01) {
              return (
                <Link
                  key={combo.id}
                  href="/combo"
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

        {/* Right — Combo Image */}
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
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                {isCombo01 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-corn text-text-dark mb-2 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    Đặc quyền tự chọn 4 vị
                  </span>
                )}
                <h3 className="text-xl md:text-2xl font-bold text-white font-heading mb-1">
                  {activeCombo.name}
                </h3>
                <p className="text-white/80 text-sm mb-3 line-clamp-2">
                  {activeCombo.description}
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg font-bold text-corn">
                    {formatPrice(activeCombo.salePrice)}đ
                  </span>
                  <span className="text-sm text-white/50 line-through">
                    {formatPrice(activeCombo.originalPrice)}đ
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold bg-sale text-white rounded-md">
                    -{activeCombo.discount}%
                  </span>
                </div>

                {isCombo01 ? (
                  /* COMBO 01: Nhảy sang trang /combo để chọn vị */
                  <Link
                    href="/combo"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-corn text-text-dark font-bold rounded-xl hover:bg-yellow-400 hover:shadow-lg transition-all text-sm active:scale-95 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    Tùy chọn 4 chai ngay ({formatPrice(activeCombo.salePrice)}đ)
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </Link>
                ) : (
                  /* CÁC COMBO KHÁC: Thêm trực tiếp vào giỏ trên trang chủ */
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
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-green-primary font-semibold rounded-xl hover:bg-ivory hover:shadow-lg transition-all text-sm active:scale-95 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Thêm combo vào giỏ ({formatPrice(activeCombo.salePrice)}đ)
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
