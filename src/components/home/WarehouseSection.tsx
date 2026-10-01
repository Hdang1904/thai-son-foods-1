'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface TabItem {
  id: string;
  num: string;
  subTitle?: string;
  subTitleEn?: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  image: string;
}

const warehouseTabs: TabItem[] = [
  {
    id: 'ho-tro-khach-hang',
    num: '01',
    title: 'Hỗ Trợ Khách Hàng',
    titleEn: 'Customer Support',
    description:
      'Tiếp nhận và xử lý kịp thời các phản hồi, thắc mắc phát sinh qua các kênh liên hệ, đồng thời hướng dẫn sử dụng và áp dụng phương án xử lý phù hợp cho từng trường hợp cụ thể.',
    descriptionEn:
      'Promptly receive and address customer inquiries, guiding optimal usage and providing tailored support solutions.',
    image: '/images/warehouse/1920x850-6.png',
  },
  {
    id: 'khach-hang-than-thiet',
    num: '02',
    title: 'Xây Dựng Khách Hàng Thân Thiết',
    titleEn: 'Customer Loyalty & Partnerships',
    description:
      'Triển khai các chính sách ưu đãi, chương trình thành viên và giải pháp đặt hàng định kỳ nhằm gia tăng gắn kết cũng như hỗ trợ nhu cầu của khách hàng.',
    descriptionEn:
      'Offering exclusive discounts, membership rewards, and flexible recurring order schedules for wholesale and retail partners.',
    image: '/images/warehouse/1920x850-3.png',
  },
  {
    id: 'thong-tin-minh-bach',
    num: '03',
    title: 'Thông Tin Minh Bạch',
    titleEn: 'Transparent Product Standards',
    description:
      'Cung cấp đầy đủ, rõ ràng các quy định về hạn sử dụng, đặc tính tự nhiên của sản phẩm và các điều khoản liên quan đến chính sách bán hàng',
    descriptionEn:
      'Transparent disclosure of ingredients, natural product shelf life, certifications, and reliable wholesale distribution policies.',
    image: '/images/warehouse/1920x850-2.png',
  },
];

export default function WarehouseSection() {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
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
    <section
      id="kho-si"
      className="relative w-full overflow-hidden select-none bg-neutral-900"
      style={{ minHeight: 'clamp(650px, 58vw, 860px)' }}
    >
      {/* ─── 1. Background Image (Animation chuyển cảnh mượt mà 1.5s) ─── */}
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

        {/* 
          CHỈ DÙNG GRADIENT NHẸ Ở 2 VÙNG CẦN ĐỌC CHỮ:
          - Đáy dưới: để làm nổi bật tiêu đề lớn màu trắng
          - Cạnh phải nhẹ: để các số 01, 02, 03, 04 màu trắng có độ tương phản
          - TUYỆT ĐỐI KHÔNG PHỦ TỐI TOÀN BỘ BỨC ẢNH
        */}
        <div className="absolute bottom-0 left-0 right-0 h-64 sm:h-72 bg-gradient-to-t from-black/95 via-black/60 to-transparent pointer-events-none z-10" />
        <div className="absolute top-0 right-0 bottom-0 w-64 bg-gradient-to-l from-black/35 to-transparent pointer-events-none hidden sm:block z-10" />
      </div>

      {/* ─── 2. Main Content Wrapper ─── */}
      <div className="relative z-10 w-full min-h-[650px] sm:min-h-[720px] lg:min-h-[800px] xl:min-h-[860px] flex flex-col justify-between px-4 sm:px-8 md:px-12 lg:px-16 pt-10 sm:pt-16 lg:pt-20 pb-8 sm:pb-12">
        
        {/* HÀNG TRÊN: Khung thẻ bên trái + Cột số bên phải */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 sm:gap-10 w-full">
          
          {/* ─── THẺ NỔI MÀU NGÀ BÊN TRÁI (The 350F style with Scalloped / Sawtooth Edge) ─── */}
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
                  {currentTab.subTitle && (
                    <h3 className="text-sm font-semibold text-[#1B5E3B] mb-1.5 font-sans">
                      {currentTab.subTitle}
                    </h3>
                  )}

                  <h4 className="text-2xl sm:text-[28px] lg:text-[32px] font-bold text-[#001A36] leading-[1.25] font-serif tracking-tight mb-3">
                    {language === 'en' ? currentTab.titleEn : currentTab.title}
                  </h4>

                  <p className="text-xs sm:text-sm text-[#001A36]/80 leading-relaxed font-sans mb-6">
                    {language === 'en' ? currentTab.descriptionEn : currentTab.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Hotline & Liên hệ trực tiếp */}
              <div className="pt-4 border-t border-[#001A36]/10 flex items-center justify-between gap-3">
                <a
                  href="tel:02862915024"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#1B5E3B] hover:text-[#14482D] transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>{language === 'en' ? 'Wholesale Hotline: 028 6291 5024' : 'Hotline sỉ: 028 6291 5024'}</span>
                </a>

                <Link
                  href="/#san-pham"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#001A36] hover:text-[#1B5E3B] transition-colors"
                >
                  <span>{language === 'en' ? 'Explore products' : 'Xem sản phẩm'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 
                ─── RĂNG CƯA ZICZAC / SCALLOPED BOTTOM EDGE ───
                Đúng chuẩn mép vé cắt / tem đặc trưng của The 350F 
              */}
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

          {/* ─── CỘT SỐ DỌC BÊN PHẢI (01, 02, 03, 04) ─── */}
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

        {/* ─── HÀNG DƯỚI: TIÊU ĐỀ LỚN CHẠY DỌC ĐÁY (The 350F bottom-title) ─── */}
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
              textShadow: '0 2px 12px rgba(0, 0, 0, 0.95), 0 4px 28px rgba(0, 0, 0, 0.9), 0 1px 4px rgba(0, 0, 0, 1)',
            }}
          >
            {language === 'en' ? 'WHY CHOOSE THAI SON FOODS?' : 'VÌ SAO THÁI SƠN FOODS ĐƯỢC TIN CHỌN?'}
          </h2>
        </motion.div>

      </div>
    </section>
  );
}
