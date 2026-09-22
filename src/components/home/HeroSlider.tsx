'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { banners } from '@/data/banners';
import { motion } from 'framer-motion';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export default function HeroSlider() {
  if (!banners || banners.length === 0) return null;

  if (banners.length === 1) {
    const banner = banners[0];
    return (
      <section className="section-container -mt-6 sm:-mt-8 md:-mt-11 pt-1 pb-6 md:pt-1 md:pb-10" aria-label="Banner quảng cáo">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative rounded-2xl md:rounded-[22px] overflow-hidden shadow-sm"
        >
          {banner.link ? (
            <Link href={banner.link} className="block group">
              <div className="relative w-full aspect-[3/1] md:aspect-[3/1] max-sm:aspect-[16/9]">
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 1290px"
                  priority
                />
              </div>
            </Link>
          ) : (
            <div className="relative w-full aspect-[3/1] md:aspect-[3/1] max-sm:aspect-[16/9]">
              <Image
                src={banner.image}
                alt={banner.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1290px"
                priority
              />
            </div>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section className="section-container -mt-6 sm:-mt-8 md:-mt-11 pt-1 pb-6 md:pt-1 md:pb-10" aria-label="Banner quảng cáo">
      <div className="relative rounded-2xl md:rounded-[22px] overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: false,
          }}
          navigation={true}
          loop={true}
          speed={600}
          className="hero-swiper"
        >
          {banners.map((banner, index) => (
            <SwiperSlide key={banner.id}>
              {banner.link ? (
                <Link href={banner.link} className="block">
                  <div className="relative w-full aspect-[3/1] md:aspect-[3/1] max-sm:aspect-[4/3]">
                    <Image
                      src={banner.image}
                      alt={banner.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 1290px"
                      priority={index === 0}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                </Link>
              ) : (
                <div className="relative w-full aspect-[3/1] md:aspect-[3/1] max-sm:aspect-[4/3]">
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 1290px"
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
