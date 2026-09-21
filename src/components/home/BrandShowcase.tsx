'use client';

import Image from 'next/image';
import { ArrowRight, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import BrandBadge from './BrandBadge';

export default function BrandShowcase() {
  return (
    <section id="ve-chung-toi" className="w-full bg-[#FAF7F0] py-10 lg:py-16">
      {/* 
        Independent wrapper:
        - Avoids global .section-container limits
        - Ensures card reaches exact 1282.438px on desktop without altering other pages
      */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex justify-center">
        {/* 
          Main Card Outer Relative Wrapper:
          - Holds the animated BrandBadge on the top-left corner
          - Allows the badge to overlap the card border naturally without being clipped
        */}
        <div
          className="relative w-full"
          style={{
            maxWidth: '1282.438px',
          }}
        >
          {/* Animated Brand Stamp Badge */}
          <BrandBadge />

          {/* 
            Main Card:
            - Exact dimensions: 1282.438px width x 612.063px height
            - Background: #FFF9F1
            - Border radius: 24px
          */}
          <div
            className="relative overflow-hidden bg-[#FFF9F1] rounded-[24px] shadow-sm flex flex-col lg:flex-row w-full"
            style={{
              minHeight: '612.063px',
            }}
          >
          {/* ─── LEFT COLUMN: Text Content (Exact 792.782px on desktop) ─── */}
          <div
            className="w-full lg:flex-1 flex flex-col justify-between"
            style={{
              padding: 'clamp(36px, 4vw, 56px) clamp(28px, 3.5vw, 52px) clamp(36px, 4vw, 52px) clamp(32px, 4.5vw, 64px)',
              minHeight: '612.063px',
            }}
          >
            <div>
              {/* HACCP Certification Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: false, amount: 0.25 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1B5E3B]/10 border border-[#1B5E3B]/20 text-[#1B5E3B] text-xs sm:text-sm font-semibold mb-4"
              >
                <Award className="w-4 h-4 text-[#1B5E3B] shrink-0" />
                <span>Chứng nhận Quốc tế HACCP</span>
              </motion.div>

              {/* Title with Left-to-Right Scroll Animation (luôn luôn kích hoạt mỗi lần lướt tới) */}
              <h2
                className="text-balance overflow-hidden"
                style={{
                  fontFamily: 'var(--font-fira-sans), sans-serif',
                  fontSize: 'clamp(30px, 2.8vw, 44px)',
                  fontWeight: 700,
                  lineHeight: '1.26',
                  letterSpacing: '-0.02em',
                  color: '#001A36',
                  marginBottom: '28px',
                  textWrap: 'balance',
                }}
              >
                <motion.span
                  initial={{ opacity: 0, x: -80 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.25 }}
                  transition={{
                    duration: 1.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.25,
                  }}
                  className="inline-block"
                >
                  Khởi nguồn với niềm đam mê
                </motion.span>
                <br />
                <motion.span
                  initial={{ opacity: 0, x: -100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.25 }}
                  transition={{
                    duration: 1.6,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.5,
                  }}
                  className="inline-block"
                >
                  và tình yêu dành cho hương vị Việt
                </motion.span>
              </h2>

              {/* 
                Paragraphs block:
                - Left gold border (#FFCF83)
                - Text justified on both sides (căn đều hai bên mép)
                - Clean line height and gap
              */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.25 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.85 }}
                style={{
                  borderLeft: '2.5px solid #FFCF83',
                  paddingLeft: '26px',
                  textAlign: 'justify',
                  color: '#001A36',
                  fontSize: 'clamp(16px, 1.2vw, 18.5px)',
                  lineHeight: '1.75',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <p>
                  Từ những sản phẩm quen thuộc, Thái Sơn mang đến đa dạng lựa chọn với dòng sữa hạt
                  dinh dưỡng, nước mát giải khát và dòng sản phẩm xu hướng, phù hợp với nhiều nhu cầu
                  và khẩu vị. Thái Sơn Foods chú trọng giữ lại nét gần gũi của nguyên liệu Việt, đồng
                  thời đầu tư vào chất lượng và sự tiện lợi trong từng sản phẩm.
                </p>
                <p>
                  Với định hướng{' '}
                  <strong className="font-semibold text-[#001A36]">
                    &ldquo;Ngon lành – Tự nhiên – Tiện lợi&rdquo;
                  </strong>
                  , Thái Sơn Foods không ngừng phát triển danh mục sản phẩm, mang đến những thức
                  uống phù hợp cho nhiều khoảnh khắc trong cuộc sống và đưa hương vị quen thuộc của
                  quê hương đến mọi người.
                </p>
                <p className="font-bold text-[#1B5E3B] text-[17px] lg:text-[20px]">
                  Thái Sơn Foods – Uống một bữa ăn ngon lành.
                </p>
              </motion.div>
            </div>

            {/* Button - Cleanly pinned below */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.25 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 1.1 }}
              style={{ marginTop: '36px' }}
            >
              <a
                href="/#san-pham"
                className="group inline-flex items-center gap-3 font-semibold text-[#001A36] transition-all hover:brightness-95 active:scale-[0.98]"
                style={{
                  background: '#FFCF83',
                  borderRadius: '8px',
                  padding: '13px 28px',
                  fontSize: '16px',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                }}
              >
                <span>Về chúng tôi</span>
                <ArrowRight
                  className="transition-transform duration-200 group-hover:translate-x-1"
                  style={{ width: '20px', height: '20px' }}
                />
              </a>
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN: Image (Exact 489.656px x 612.063px on desktop) ─── */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full lg:w-[489.656px] shrink-0 overflow-hidden"
            style={{
              minHeight: '612.063px',
            }}
          >
            <Image
              src="/images/banners/vechungtoi1.jpg"
              alt="Thái Sơn Foods – Hương vị tự nhiên nguyên liệu chọn lọc"
              fill
              className="object-cover"
              style={{ objectPosition: 'center top' }}
              sizes="(min-width: 1024px) 490px, 100vw"
              priority
            />
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);
}
