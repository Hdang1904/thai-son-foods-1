'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import Image from 'next/image';
import Link from 'next/link';
import { banners as defaultBanners } from '@/data/banners';
import { Banner } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface HeroSliderProps {
  banners?: Banner[];
  fullWidth?: boolean;
  aspectRatioClass?: string;
  className?: string;
}

export default function HeroSlider({
  banners: customBanners,
  fullWidth = false,
  aspectRatioClass,
  className,
}: HeroSliderProps = {}) {
  const bannerList = customBanners !== undefined ? customBanners : defaultBanners;

  if (!bannerList || bannerList.length === 0) return null;

  const aspect = aspectRatioClass || (fullWidth ? 'aspect-[1920/850] max-sm:aspect-[16/9]' : 'aspect-[3/1] md:aspect-[3/1] max-sm:aspect-[16/9]');

  if (bannerList.length === 1) {
    const banner = bannerList[0];
    return (
      <section
        className={cn(
          fullWidth ? 'w-full' : 'section-container pt-2 pb-2 md:pt-3 md:pb-3',
          className
        )}
        aria-label="Banner quảng cáo"
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={cn('relative overflow-hidden', fullWidth ? 'w-full' : 'rounded-2xl md:rounded-[22px] shadow-sm')}
        >
          {banner.link ? (
            <Link href={banner.link} className="block group">
              <div className={cn('relative w-full', aspect)}>
                <Image
                  src={banner.image}
                  alt={banner.alt}
                  fill
                  className="object-cover"
                  sizes={fullWidth ? '100vw' : '(max-width: 768px) 100vw, 1290px'}
                  priority
                />
              </div>
            </Link>
          ) : (
            <div className={cn('relative w-full', aspect)}>
              <Image
                src={banner.image}
                alt={banner.alt}
                fill
                className="object-cover"
                sizes={fullWidth ? '100vw' : '(max-width: 768px) 100vw, 1290px'}
                priority
              />
            </div>
          )}
        </motion.div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        fullWidth ? 'w-full' : 'section-container pt-2 pb-2 md:pt-3 md:pb-3',
        className
      )}
      aria-label="Banner quảng cáo"
    >
      <div className={cn('relative overflow-hidden', fullWidth ? 'w-full' : 'rounded-2xl md:rounded-[22px]')}>
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
          {bannerList.map((banner, index) => (
            <SwiperSlide key={banner.id}>
              {banner.link ? (
                <Link href={banner.link} className="block">
                  <div className={cn('relative w-full', aspect)}>
                    <Image
                      src={banner.image}
                      alt={banner.alt}
                      fill
                      className="object-cover"
                      sizes={fullWidth ? '100vw' : '(max-width: 768px) 100vw, 1290px'}
                      priority={index === 0}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                </Link>
              ) : (
                <div className={cn('relative w-full', aspect)}>
                  <Image
                    src={banner.image}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                    sizes={fullWidth ? '100vw' : '(max-width: 768px) 100vw, 1290px'}
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
