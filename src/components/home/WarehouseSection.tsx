'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Phone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface TabItem {
  id: string;
  num: string;
  subTitle: string;
  title: string;
  image: string;
}

const warehouseTabs: TabItem[] = [
  {
    id: 'diem-ban',
    num: '01',
    subTitle: 'Liên tục',
    title: 'Độ phủ rộng khắp',
    image: '/images/warehouse/1920x850-6.png',
  },
  {
    id: 'kho-lanh',
    num: '02',
    subTitle: 'Bảo quản',
    title: 'Kho tổng & Xe lạnh',
    image: '/images/warehouse/1920x850-3.png',
  },
  {
    id: 'chinh-sach-si',
    num: '03',
    subTitle: 'Đồng hành',
    title: 'Chính sách sỉ hấp dẫn',
    image: '/images/warehouse/1920x850-2.png',
  },
  {
    id: 'phap-ly',
    num: '04',
    subTitle: 'Pháp lý & Chất lượng',
    title: 'Chứng nhận Quốc tế HACCP',
    image: '/images/warehouse/1920x850-4.png',
  },
];

export default function WarehouseSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [frameMode, setFrameMode] = useState<'landscape' | 'square'>('landscape');
  const currentTab = warehouseTabs[activeIndex];
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-slide every 7s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % warehouseTabs.length);
    }, 7000);
    return () => {
      clearInterval(timer);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const handleTabHover = (index: number) => {
    if (index === activeIndex) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    // Độ trễ nhẹ khi hover để chuyển cảnh chậm rãi, êm ái
    hoverTimerRef.current = setTimeout(() => {
      setActiveIndex(index);
    }, 180);
  };

  const handleTabClick = (index: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setActiveIndex(index);
  };

  return (
    <section id="kho-si" className="relative w-full overflow-hidden select-none">
      {/* ═══════════════════════════════════════════════════════════════════
          1. GIAO DIỆN MOBILE (< lg): Khung ảnh Ngang / Vuông chuẩn tỉ lệ
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden w-full bg-[#0A1A13] text-white py-8 px-4 sm:px-6">
        {/* Tiêu đề phân đoạn & Nút chuyển đổi Frame Ngang / Vuông */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-corn font-semibold mb-1 block">
              Năng lực & Hệ thống
            </span>
            <h2
              className="text-xl sm:text-2xl font-bold uppercase tracking-tight font-serif leading-snug"
              style={{ color: '#FFFFFF' }}
            >
              VÌ SAO THÁI SƠN FOODS ĐƯỢC TIN CHỌN?
            </h2>
          </div>

          {/* Toggle chọn Khung Ngang (16:9) hoặc Khung Vuông (4:3) theo sở thích */}
          <div className="self-start sm:self-auto flex items-center gap-1 bg-white/10 p-1 rounded-lg border border-white/15 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setFrameMode('landscape')}
              className={cn(
                'px-2.5 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1.5',
                frameMode === 'landscape'
                  ? 'bg-corn text-[#0B1E16] font-bold shadow-xs'
                  : 'text-white/70 hover:text-white'
              )}
            >
              <span className="w-3.5 h-2 rounded-[2px] border border-current inline-block" />
              <span>Frame ngang</span>
            </button>
            <button
              type="button"
              onClick={() => setFrameMode('square')}
              className={cn(
                'px-2.5 py-1 text-xs rounded font-medium transition-colors flex items-center gap-1.5',
                frameMode === 'square'
                  ? 'bg-corn text-[#0B1E16] font-bold shadow-xs'
                  : 'text-white/70 hover:text-white'
              )}
            >
              <span className="w-2.5 h-2.5 rounded-[2px] border border-current inline-block" />
              <span>Frame vuông</span>
            </button>
          </div>
        </div>

        {/* ─── KHUNG ẢNH CHÍNH (Landscape hoặc Square, không bị che khuất) ─── */}
        <div
          className={cn(
            'relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900 transition-all duration-500 ease-in-out',
            frameMode === 'landscape' ? 'aspect-[16/9]' : 'aspect-[4/3]'
          )}
        >
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentTab.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={currentTab.image}
                alt={currentTab.title}
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 1920px"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient nhẹ ở viền trên để badge nổi bật */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Huy hiệu số thứ tự ở góc trên ảnh */}
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-corn text-[11px] font-bold border border-white/15">
              {currentTab.num} / 04 • {currentTab.subTitle}
            </span>
          </div>
        </div>

        {/* ─── THANH ĐIỀU HƯỚNG 4 TABS (01, 02, 03, 04) ─── */}
        <div className="grid grid-cols-4 gap-2 my-3">
          {warehouseTabs.map((tab, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(index)}
                className={cn(
                  'py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-300 text-center border',
                  isActive
                    ? 'bg-corn text-[#0B1E16] border-corn font-bold shadow-md scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
                )}
              >
                <span className="text-base font-bold font-serif leading-none">{tab.num}</span>
                <span className="text-[10px] truncate max-w-full opacity-80 mt-0.5 leading-tight">
                  {tab.subTitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── THẺ NỔI MÀU NGÀ BÊN DƯỚI (Chuẩn The 350F Scalloped Ticket Card) ─── */}
        <div className="w-full relative">
          <div className="bg-[#FFF8EE] p-5 sm:p-6 shadow-xl relative rounded-t-xl overflow-hidden text-[#001A36]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <span className="inline-block text-xs font-bold text-[#1B5E3B] uppercase tracking-wider mb-1">
                  {currentTab.num} • {currentTab.subTitle}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-serif leading-tight mb-4">
                  {currentTab.title}
                </h3>
              </motion.div>
            </AnimatePresence>

            <div className="pt-3.5 border-t border-[#001A36]/10 flex items-center justify-between gap-3">
              <a
                href="tel:19006725"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B5E3B] hover:text-[#14482D] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Hotline sỉ: 1900 6725</span>
              </a>

              <a
                href="/san-pham"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#001A36] hover:text-[#1B5E3B] transition-colors"
              >
                <span>Xem sản phẩm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Mép răng cưa ziczac signature */}
            <div className="absolute -bottom-[9px] left-0 right-0 h-[10px] overflow-hidden leading-none pointer-events-none">
              <svg
                viewBox="0 0 1200 24"
                className="w-full h-[10px] fill-[#FFF8EE]"
                preserveAspectRatio="none"
              >
                <path d="M0,0 L15,24 L30,0 L45,24 L60,0 L75,24 L90,0 L105,24 L120,0 L135,24 L150,0 L165,24 L180,0 L195,24 L210,0 L225,24 L240,0 L255,24 L270,0 L285,24 L300,0 L315,24 L330,0 L345,24 L360,0 L375,24 L390,0 L405,24 L420,0 L435,24 L450,0 L465,24 L480,0 L495,24 L510,0 L525,24 L540,0 L555,24 L570,0 L585,24 L600,0 L615,24 L630,0 L645,24 L660,0 L675,24 L690,0 L705,24 L720,0 L735,24 L750,0 L765,24 L780,0 L795,24 L810,0 L825,24 L840,0 L855,24 L870,0 L885,24 L900,0 L915,24 L930,0 L945,24 L960,0 L975,24 L990,0 L1005,24 L1020,0 L1035,24 L1050,0 L1065,24 L1080,0 L1095,24 L1110,0 L1125,24 L1140,0 L1155,24 L1170,0 L1185,24 L1200,0 Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. GIAO DIỆN DESKTOP (>= lg): Giữ nguyên 100% không đổi
          ═══════════════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:block relative w-full overflow-hidden bg-neutral-900"
        style={{ minHeight: 'clamp(650px, 58vw, 860px)' }}
      >
        {/* Background Image (Animation chuyển cảnh mượt mà 1.5s) */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentTab.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{
                duration: 1.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0"
            >
              <Image
                src={currentTab.image}
                alt={currentTab.title}
                fill
                className="object-cover object-center"
                sizes="100vw"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient nhẹ ở 2 vùng cần đọc chữ */}
          <div className="absolute bottom-0 left-0 right-0 h-64 sm:h-72 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />
          <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-black/35 to-transparent pointer-events-none z-10" />
        </div>

        {/* Main Content Wrapper */}
        <div className="relative z-10 w-full min-h-[650px] sm:min-h-[720px] lg:min-h-[800px] xl:min-h-[860px] flex flex-col justify-between px-4 sm:px-8 md:px-12 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-8 sm:pb-12">
          {/* HÀNG TRÊN: Khung thẻ bên trái + Cột số bên phải */}
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 sm:gap-10 w-full">
            {/* THẺ NỔI MÀU NGÀ BÊN TRÁI (The 350F style with Scalloped / Sawtooth Edge) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="w-full max-w-[420px] sm:max-w-[460px] relative"
            >
              <div className="bg-[#FFF8EE] p-6 sm:p-8 md:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative">
                {/* Sub-block title & Main title */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTab.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  >
                    <h3 className="text-sm md:text-base font-semibold text-[#001A36] mb-1.5 font-sans">
                      {currentTab.subTitle}
                    </h3>

                    <h4 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#001A36] leading-[1.2] font-serif tracking-tight mb-6">
                      {currentTab.title}
                    </h4>
                  </motion.div>
                </AnimatePresence>

                {/* Hotline & Liên hệ trực tiếp */}
                <div className="pt-4 border-t border-[#001A36]/10 flex items-center justify-between gap-3">
                  <a
                    href="tel:19006725"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B5E3B] hover:text-[#14482D] transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Hotline sỉ: 1900 6725</span>
                  </a>

                  <a
                    href="/san-pham"
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#001A36] hover:text-[#1B5E3B] transition-colors"
                  >
                    <span>Xem sản phẩm</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* RĂNG CƯA ZICZAC / SCALLOPED BOTTOM EDGE */}
                <div className="absolute -bottom-[9px] left-0 right-0 h-[10px] overflow-hidden leading-none pointer-events-none">
                  <svg
                    viewBox="0 0 1200 24"
                    className="w-full h-[10px] fill-[#FFF8EE]"
                    preserveAspectRatio="none"
                  >
                    <path d="M0,0 L15,24 L30,0 L45,24 L60,0 L75,24 L90,0 L105,24 L120,0 L135,24 L150,0 L165,24 L180,0 L195,24 L210,0 L225,24 L240,0 L255,24 L270,0 L285,24 L300,0 L315,24 L330,0 L345,24 L360,0 L375,24 L390,0 L405,24 L420,0 L435,24 L450,0 L465,24 L480,0 L495,24 L510,0 L525,24 L540,0 L555,24 L570,0 L585,24 L600,0 L615,24 L630,0 L645,24 L660,0 L675,24 L690,0 L705,24 L720,0 L735,24 L750,0 L765,24 L780,0 L795,24 L810,0 L825,24 L840,0 L855,24 L870,0 L885,24 L900,0 L915,24 L930,0 L945,24 L960,0 L975,24 L990,0 L1005,24 L1020,0 L1035,24 L1050,0 L1065,24 L1080,0 L1095,24 L1110,0 L1125,24 L1140,0 L1155,24 L1170,0 L1185,24 L1200,0 Z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            {/* CỘT SỐ DỌC BÊN PHẢI (01, 02, 03, 04) */}
            <motion.nav
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
              className="w-full lg:w-auto flex justify-center lg:justify-end mt-4 lg:mt-8"
            >
              <ul className="flex flex-row lg:flex-col items-center gap-5 sm:gap-7 lg:gap-8">
                {warehouseTabs.map((tab, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <li
                      key={tab.id}
                      onClick={() => handleTabClick(index)}
                      onMouseEnter={() => handleTabHover(index)}
                      className="cursor-pointer group py-1"
                    >
                      <div className="flex items-center gap-3 sm:gap-5 transition-all duration-300">
                        {/* Số 01, 02, 03, 04 */}
                        <span
                          className={cn(
                            'text-2xl sm:text-3xl lg:text-5xl font-bold font-serif transition-all duration-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]',
                            isActive
                              ? 'text-white scale-110'
                              : 'text-white/40 group-hover:text-white/80'
                          )}
                        >
                          {tab.num}
                        </span>

                        {/* Đường line ngang kéo dài */}
                        <span
                          className={cn(
                            'h-[1px] transition-all duration-300 hidden sm:block',
                            isActive
                              ? 'w-12 sm:w-16 lg:w-20 bg-white drop-shadow-[0_0_6px_white]'
                              : 'w-6 sm:w-10 bg-white/30 group-hover:bg-white/60'
                          )}
                        />

                        {/* Chấm tròn chỉ thị */}
                        <span
                          className={cn(
                            'w-3.5 h-3.5 rounded-full border transition-all duration-300 hidden sm:flex items-center justify-center',
                            isActive
                              ? 'border-white bg-white/20'
                              : 'border-white/30 group-hover:border-white/60'
                          )}
                        >
                          <span
                            className={cn(
                              'w-1.5 h-1.5 rounded-full transition-all',
                              isActive ? 'bg-white' : 'bg-transparent'
                            )}
                          />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.nav>
          </div>

          {/* HÀNG DƯỚI: TIÊU ĐỀ LỚN CHẠY DỌC ĐÁY (The 350F bottom-title) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            className="w-full pt-8 sm:pt-14 pb-1"
          >
            <h2
              className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-bold uppercase tracking-tight font-serif text-left leading-none"
              style={{
                color: '#FFFFFF',
                textShadow:
                  '0 2px 12px rgba(0, 0, 0, 0.95), 0 4px 28px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
              }}
            >
              VÌ SAO THÁI SƠN FOODS ĐƯỢC TIN CHỌN?
            </h2>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
