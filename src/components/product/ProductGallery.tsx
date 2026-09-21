'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { ProductImage } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Share2, ZoomIn, X, Check, PlayCircle } from 'lucide-react';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  imageFit?: 'cover' | 'contain';
}

export default function ProductGallery({ images, productName, imageFit }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomOpen(false);
      if (e.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % displayImages.length);
      if (e.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, images.length]);

  // Guarantee at least one valid image
  const displayImages = images.length > 0 ? images : [
    { id: 'default', url: '/images/products/sua-bap-nep.jpg', alt: productName, sortOrder: 1 }
  ];

  const activeImage = displayImages[activeIndex] || displayImages[0];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          url: window.location.href,
        });
      } catch {
        // Fallback to clipboard
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isLandscape =
    activeImage.url.includes('600X400') ||
    activeImage.url.includes('combo') ||
    activeImage.url.includes('lifestyle');
  const is2x3 =
    activeImage.url.includes('620x930') ||
    activeImage.url.includes('620X930') ||
    activeImage.url.includes('800x1200') ||
    activeImage.url.includes('800X1200');
  const is3x4 = activeImage.url.includes('dreamina');
  const aspectClass = isLandscape
    ? 'aspect-[3/2]'
    : is2x3
    ? 'aspect-[2/3]'
    : is3x4
    ? 'aspect-[3/4]'
    : 'aspect-[4/5]';

  const isPoster =
    (!activeImage.url.endsWith('.png') && (
      activeImage.url.includes('620x930') ||
      activeImage.url.includes('800x1200') ||
      activeImage.url.includes('banner') ||
      activeImage.url.includes('lifestyle') ||
      activeImage.url.includes('poster') ||
      activeImage.url.includes('canh-dong') ||
      activeImage.url.includes('1789') ||
      activeImage.url.endsWith('.jpg') ||
      activeImage.url.endsWith('.jpeg') ||
      activeImage.url.endsWith('.webp')
    )) || (imageFit === 'cover' && !activeImage.url.endsWith('.png'));
  const isBottle = !isPoster || activeImage.url.endsWith('.png');

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Main Image Card — Chuẩn tỷ lệ 4:3 (tương đương 1200x900px) */}
      <div
        className={`relative w-full aspect-[4/3] max-w-[640px] ${isBottle ? 'bg-[#FAF8F5]' : 'bg-white'} rounded-2xl border border-gray-200/80 overflow-hidden group shadow-sm transition-all`}
        style={{ maxWidth: '640px' }}
      >
        {/* Floating Prev Button (<) */}
        {displayImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md border border-gray-100 flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 hover:scale-105 cursor-pointer"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Floating Next Button (>) */}
        {displayImages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveIndex((prev) => (prev + 1) % displayImages.length);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md border border-gray-100 flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 hover:scale-105 cursor-pointer"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Share Button (Top-Right) */}
        <button
          onClick={handleShare}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/85 hover:bg-white shadow-sm border border-gray-200/80 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all cursor-pointer"
          title="Chia sẻ sản phẩm"
          aria-label="Chia sẻ sản phẩm"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>

        {/* Bottom-Right Counter Badge (e.g. 1/5 like cailonuong) */}
        <div className="absolute bottom-3.5 right-3.5 z-10 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium tracking-wider pointer-events-none">
          {activeIndex + 1}/{displayImages.length}
        </div>

        {/* Main Product Image with zoom on click */}
        <div
          onClick={() => setIsZoomOpen(true)}
          className="relative w-full h-full cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
        >
          <Image
            src={activeImage.url}
            alt={activeImage.alt || productName}
            fill
            className={`${
              isBottle ? 'object-contain p-4 sm:p-6 md:p-8' : 'object-cover object-center'
            } transition-transform duration-300 group-hover:scale-[1.02]`}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
            priority
          />
        </div>
      </div>

      {/* Clean Thumbnails Row below card */}
      {displayImages.length > 1 && (
        <div className="w-full max-w-[640px] flex items-center gap-2.5 overflow-x-auto py-3 px-0.5">
          {displayImages.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'relative w-20 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-white p-0.5 flex items-center justify-center cursor-pointer',
                activeIndex === index
                  ? 'border-[#1B5E3B] shadow-[0_0_0_1px_#1B5E3B]'
                  : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
              )}
              aria-label={`Xem ảnh ${index + 1}`}
            >
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={image.url}
                  alt={image.alt || productName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* "Click to see full view" caption */}
      <button
        onClick={() => setIsZoomOpen(true)}
        className="mt-1 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1B5E3B] font-medium transition-colors cursor-pointer"
      >
        <ZoomIn className="w-3.5 h-3.5" />
        <span>Nhấp để phóng to / xem ảnh toàn màn hình</span>
      </button>

      {/* Full View Lightbox Modal via Portal to document.body (avoids stacking context bugs) */}
      {isZoomOpen && mounted && createPortal(
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[99999] bg-black/92 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in-up select-none"
        >
          {/* Close Button */}
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-5 right-5 z-50 text-white/80 hover:text-white p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer backdrop-blur-sm shadow-lg"
            aria-label="Đóng xem toàn màn hình"
            title="Đóng"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous Arrow */}
          {displayImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
              }}
              className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer hidden sm:flex items-center justify-center"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Arrow */}
          {displayImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev + 1) % displayImages.length);
              }}
              className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer hidden sm:flex items-center justify-center"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image Container — Fits viewport cleanly without forcing aspect-square */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full h-[80vh] flex items-center justify-center"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt || productName}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Bottom Caption / Indicator */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-md px-5 py-2 rounded-full text-white text-sm font-medium border border-white/10 flex items-center gap-2"
          >
            <span className="text-orange-400 font-bold">{activeIndex + 1}</span>
            <span className="text-white/60">/</span>
            <span>{displayImages.length}</span>
            <span className="text-white/40">•</span>
            <span className="truncate max-w-[280px] sm:max-w-md">{productName}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
