'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Combo, Product } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useFlyToCart } from '@/context/FlyToCartContext';
import {
  ShoppingBag,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Phone,
  Plus,
  Minus,
  Check,
  Flame,
  Award,
  ZoomIn,
  X,
  Copy,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useBranchStore } from '@/store/branch';
import { MapPin, AlertCircle } from 'lucide-react';

interface ComboProductDetailItem {
  quantity: number;
  productId: string;
  product: Product | null;
}

interface ComboDetailViewProps {
  combo: Combo;
  productsDetail: ComboProductDetailItem[];
}

export default function ComboDetailView({ combo, productsDetail }: ComboDetailViewProps) {
  const { language } = useLanguage();
  const router = useRouter();
  const { flyToCart } = useFlyToCart();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Chi nhánh & Tồn kho
  const { selectedBranch, openBranchModal } = useBranchStore();
  const [isAvailable, setIsAvailable] = useState(true);
  const [checkingStock, setCheckingStock] = useState(false);
  const [alternativeStores, setAlternativeStores] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    setCheckingStock(true);
    fetch('/api/inventory/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeCode: selectedBranch?.code || 'NH',
        items: [{ productId: combo.id, quantity }],
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (!active) return;
        if (res.success) {
          setIsAvailable(res.isAvailable);
          setAlternativeStores(res.alternativeStores || []);
        }
      })
      .catch((err) => console.error('Error checking combo stock:', err))
      .finally(() => {
        if (active) setCheckingStock(false);
      });

    return () => {
      active = false;
    };
  }, [combo.id, quantity, selectedBranch?.code]);

  const savingsAmount = combo.originalPrice - combo.salePrice;
  const avgBottlePrice = Math.round(combo.salePrice / combo.totalItems);

  const isCombo01 = combo.id === 'combo-4-chai';
  const isCombo02 = combo.id === 'combo-van-phong';
  const isComboUuDai = combo.id === 'combo-uu-dai' || combo.id === 'combo-5-old';
  const isComboSieuHoi = combo.id === 'combo-sieu-hoi' || combo.id === 'combo-6-old';
  const isCustomizable = isCombo01 || isCombo02 || isComboUuDai || isComboSieuHoi;

  const customizeLink = isCombo01
    ? '/combo?type=combo-4-chai'
    : isCombo02
    ? '/combo?type=combo-van-phong'
    : isComboUuDai
    ? '/combo?type=combo-uu-dai'
    : isComboSieuHoi
    ? '/combo?type=combo-sieu-hoi'
    : '/combo';

  const comboTitle = (language === 'en' && combo.nameEn) ? combo.nameEn : combo.name;
  const comboDesc = (language === 'en' && combo.descriptionEn) ? combo.descriptionEn : combo.description;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Danh sách hình ảnh mô tả combo (ảnh chính combo + ảnh các chai thành phần + Bảng Icon tiêu chuẩn)
  const galleryImages = useMemo(() => {
    const list: { id: string; url: string; alt: string; label?: string }[] = [];

    // 1. Ảnh chính trọn bộ Combo & các ảnh combo được cấu hình từ Admin
    if (combo.images && combo.images.length > 0) {
      combo.images.forEach((cImg, idx) => {
        list.push({
          id: cImg.id || `combo-img-${idx}`,
          url: cImg.url,
          alt: cImg.alt || comboTitle,
          label: cImg.isPrimary ? (language === 'en' ? 'Combo Set' : 'Trọn bộ Combo') : undefined,
        });
      });
    } else if (combo.image) {
      list.push({
        id: `combo-main-${combo.id}`,
        url: combo.image,
        alt: comboTitle,
        label: language === 'en' ? 'Combo Set' : 'Trọn bộ Combo',
      });
    }

    // 2. Ảnh của từng sản phẩm thành phần trong combo
    productsDetail.forEach((item, pIdx) => {
      const p = item.product;
      if (!p) return;
      const pName = (language === 'en' && p.nameEn) ? p.nameEn : p.name;

      // Ảnh thumbnail chính của chai
      if (p.thumbnail && !list.some((img) => img.url === p.thumbnail)) {
        list.push({
          id: `prod-thumb-${p.id}-${pIdx}`,
          url: p.thumbnail,
          alt: pName,
          label: `${pName} (x${item.quantity})`,
        });
      }

      // Các ảnh phụ/chi tiết của chai (bỏ qua icon tiêu chuẩn & bảng dinh dưỡng đơn để ghim riêng ở thumbnail 3 & 4)
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, imgIdx) => {
          const isSpecial = img.url.includes('bang-icon') || 
                            img.url.includes('sua-bap-nep-3') ||
                            img.url.includes('sua-bap-nep-4') ||
                            img.url.includes('bang-thong-tin');
          if (img.url && !isSpecial && !list.some((existing) => existing.url === img.url)) {
            list.push({
              id: `prod-img-${p.id}-${imgIdx}`,
              url: img.url,
              alt: img.alt || pName,
              label: pName,
            });
          }
        });
      }
    });

    // 3. Ghim Bảng Icon tiêu chuẩn vào thumbnail thứ 3 (index 2)
    const standardIconImage = {
      id: `combo-cert-icon-${combo.id}`,
      url: '/images/products/bang-icon.png',
      alt: language === 'en' ? 'Quality Standards & Certifications' : 'Bảng Icon tiêu chuẩn',
      label: language === 'en' ? 'Standards & Certifications' : 'Bảng Icon',
    };

    if (list.length >= 2) {
      list.splice(2, 0, standardIconImage);
    } else {
      list.push(standardIconImage);
    }

    // 4. Ghim Bảng thông tin thành phần combo vào thumbnail thứ 4 (index 3)
    const nutritionInfoImage = {
      id: `combo-nutrition-info-${combo.id}`,
      url: '/images/combos/bang-thong-tin-thanh-phan-combo.png',
      alt: language === 'en' ? 'Combo Ingredients & Nutrition Facts' : 'Bảng thông tin thành phần combo',
      label: language === 'en' ? 'Nutrition Facts' : 'Thông tin thành phần',
    };

    if (list.length >= 3) {
      list.splice(3, 0, nutritionInfoImage);
    } else {
      list.push(nutritionInfoImage);
    }

    // Ràng buộc: tối đa 5 hình ảnh mô tả
    const capped = list.length > 5 ? list.slice(0, 5) : list;

    return capped.length > 0
      ? capped
      : [{ id: 'default', url: combo.image || '/images/combos/combo-1.jpg', alt: comboTitle }];
  }, [combo.image, combo.id, comboTitle, productsDetail, language]);

  const activeImage = galleryImages[activeIndex] || galleryImages[0];

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isZoomOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsZoomOpen(false);
      if (e.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % galleryImages.length);
      if (e.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZoomOpen, galleryImages.length]);

  const handleAddToCart = (e?: React.MouseEvent) => {
    if (e && imageContainerRef.current) {
      const img = imageContainerRef.current.querySelector('img');
      flyToCart({
        startElement: img || (e.currentTarget as HTMLElement),
        imageSrc: combo.image,
      });
    }

    addItem(
      {
        productId: combo.id,
        name: comboTitle,
        slug: combo.slug || `#combo-${combo.id}`,
        price: combo.salePrice,
        unit: `${combo.totalItems} ${language === 'en' ? 'bottles' : 'chai'}`,
        thumbnail: combo.image,
      },
      quantity
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addItem(
      {
        productId: combo.id,
        name: comboTitle,
        slug: combo.slug || `#combo-${combo.id}`,
        price: combo.salePrice,
        unit: `${combo.totalItems} ${language === 'en' ? 'bottles' : 'chai'}`,
        thumbnail: combo.image,
      },
      quantity
    );
    router.push('/thanh-toan');
  };

  return (
    <div className="w-full">
      {/* ─── Breadcrumb ─── */}
      <div className="border-b border-gray-100 bg-[#F7F8F8] py-2.5 text-xs">
        <div className="section-container">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-gray-500 flex-wrap">
              <li>
                <Link href="/" className="hover:text-green-primary transition-colors font-medium">
                  {language === 'en' ? 'Home' : 'Trang chủ'}
                </Link>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" /></li>
              <li>
                <Link href="/#combo" className="hover:text-green-primary transition-colors font-medium">
                  {language === 'en' ? 'Value Combos' : 'Combo tiết kiệm'}
                </Link>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" /></li>
              <li className="text-gray-900 font-semibold break-words">
                {comboTitle}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ─── Main Content (2 Columns Layout) ─── */}
      <div className="section-container py-6 lg:py-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* CỘT TRÁI: Gallery ảnh Combo (Thumbnails bên trái + Ảnh lớn bên phải) + Danh sách chi tiết chai */}
          <div className="lg:col-span-6 space-y-4">
            {/* Gallery Layout: Thumbnails Trái + Ảnh lớn Phải (Chuẩn theo ProductGallery) */}
            <div className="w-full flex flex-row items-stretch gap-3 select-none">
              {/* Cột Thumbnails dọc bên trái — hiển thị từ màn hình sm trở lên */}
              {galleryImages.length > 1 && (
                <div className="hidden sm:flex flex-col gap-2 w-[76px] shrink-0 max-h-[460px] overflow-y-auto scrollbar-hide py-0.5">
                  {galleryImages.map((image, index) => (
                    <button
                      key={image.id || index}
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        'relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-[#FAF8F5] p-0.5 flex items-center justify-center cursor-pointer',
                        activeIndex === index
                          ? 'border-[#1B5E3B] shadow-[0_0_0_1px_#1B5E3B]'
                          : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                      )}
                      aria-label={`Xem ảnh ${index + 1}`}
                      title={image.label || image.alt}
                    >
                      <div className="relative w-full h-full rounded overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.alt || comboTitle}
                          fill
                          className={index === 0 ? "object-cover" : "object-contain"}
                          sizes="80px"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Khung ảnh chính */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div
                  ref={imageContainerRef}
                  className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#FAF8F5] border border-gray-200/80 shadow-sm group"
                >
                  {/* Floating Prev Button (<) */}
                  {galleryImages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md border border-gray-100 flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 hover:scale-105 cursor-pointer"
                      aria-label="Ảnh trước"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {/* Floating Next Button (>) */}
                  {galleryImages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex((prev) => (prev + 1) % galleryImages.length);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow-md border border-gray-100 flex items-center justify-center transition-all opacity-85 group-hover:opacity-100 hover:scale-105 cursor-pointer"
                      aria-label="Ảnh tiếp theo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Bottom-Right Counter Badge */}
                  <div className="absolute bottom-3.5 right-3.5 z-20 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium tracking-wider pointer-events-none">
                    {activeIndex + 1}/{galleryImages.length}
                  </div>

                  {/* Ảnh chính hiển thị với cursor zoom */}
                  <div
                    onClick={() => setIsZoomOpen(true)}
                    className="relative w-full h-full cursor-zoom-in transition-transform duration-300 group-hover:scale-[1.02]"
                  >
                    <Image
                      src={activeImage.url}
                      alt={activeImage.alt}
                      fill
                      priority={activeIndex === 0}
                      className={
                        activeImage.url.includes('bang-thong-tin')
                          ? "object-contain p-1"
                          : activeIndex === 0 || activeImage.url.includes('bang-icon') || activeImage.url.includes('sua-bap-nep-3')
                          ? "object-cover object-center"
                          : "object-contain p-4"
                      }
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>

                  {/* Huy hiệu loại combo (góc trên trái) */}
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 text-xs font-bold bg-[#0F2A1F]/90 backdrop-blur-xs text-corn rounded-lg shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-corn" />
                      {isCustomizable
                        ? (language === 'en' ? 'Customizable Combo' : 'Combo tự chọn vị')
                        : (language === 'en' ? 'Pre-packed Combo' : 'Combo đóng gói sẵn')}
                    </span>
                  </div>

                  {/* Huy hiệu giảm giá góc trên phải */}
                  <div className="absolute top-3 right-3 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-sale text-white rounded-lg shadow-sm">
                      -{combo.discount}%
                    </span>
                  </div>

                  {/* Huy hiệu số lượng chai góc dưới trái */}
                  <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
                    <span className="px-3 py-1.5 text-xs font-bold bg-emerald-800/95 backdrop-blur-xs text-white rounded-lg shadow-sm">
                      {combo.totalItems} {language === 'en' ? 'bottles' : 'chai'}
                    </span>
                  </div>
                </div>

                {/* Mobile Thumbnails Row — hiển thị dưới ảnh trên điện thoại */}
                {galleryImages.length > 1 && (
                  <div className="sm:hidden w-full flex items-center gap-2 overflow-x-auto py-2.5 px-0.5">
                    {galleryImages.map((image, index) => (
                      <button
                        key={image.id || index}
                        onClick={() => setActiveIndex(index)}
                        className={cn(
                          'relative w-16 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-[#FAF8F5] p-0.5 flex items-center justify-center cursor-pointer',
                          activeIndex === index
                            ? 'border-[#1B5E3B] shadow-[0_0_0_1px_#1B5E3B]'
                            : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                        )}
                        aria-label={`Xem ảnh ${index + 1}`}
                      >
                        <div className="relative w-full h-full rounded overflow-hidden">
                          <Image
                            src={image.url}
                            alt={image.alt || comboTitle}
                            fill
                            className={index === 0 ? "object-cover" : "object-contain"}
                            sizes="64px"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dưới ảnh: Phóng to & Chia sẻ bạn bè */}
            <div className="w-full pt-1.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 px-1">
              <button
                onClick={() => setIsZoomOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#1B5E3B] font-medium transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Click image to zoom' : 'Nhấp vào ảnh để phóng to'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">
                  {language === 'en' ? 'Share:' : 'Chia sẻ đến bạn bè của bạn:'}
                </span>

                {/* Facebook */}
                <button
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.href : '';
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'noopener,noreferrer,width=620,height=580');
                  }}
                  className="w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 text-[#1877F2] flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs"
                  title="Share to Facebook"
                  aria-label="Share to Facebook"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>

                {/* Zalo */}
                <button
                  onClick={() => {
                    const url = typeof window !== 'undefined' ? window.location.href : '';
                    window.open(`https://sp.zalo.me/plugins/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(comboTitle)}`, '_blank', 'noopener,noreferrer,width=620,height=580');
                  }}
                  className="w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0068FF] flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-2xs font-extrabold text-[10px]"
                  title="Share to Zalo"
                  aria-label="Share to Zalo"
                >
                  Zalo
                </button>

                {/* Sao chép link */}
                <button
                  onClick={async () => {
                    const url = typeof window !== 'undefined' ? window.location.href : '';
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    } catch {}
                  }}
                  className={cn(
                    "h-7 px-2.5 rounded-full border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs",
                    copied
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                  )}
                  title="Copy link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                      <span>{language === 'en' ? 'Copied!' : 'Đã chép!'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-gray-500" />
                      <span>{language === 'en' ? 'Copy link' : 'Sao chép'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* DANH SÁCH CHI TIẾT TỪNG CHAI TRONG COMBO */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-primary" />
                  <span>
                    {language === 'en'
                      ? `Items in this Combo box (${combo.totalItems} bottles)`
                      : `Thành phần trong hộp Combo (${combo.totalItems} chai)`}
                  </span>
                </h3>
                <span className="text-xs text-text-muted">
                  {language === 'en' ? 'Standard packaging spec' : 'Đúng định lượng đóng gói'}
                </span>
              </div>

              <div className="space-y-2.5">
                {productsDetail.map((item, idx) => {
                  const pName = (language === 'en' && item.product?.nameEn)
                    ? item.product.nameEn
                    : (item.product?.name || item.productId);
                  const pDesc = (language === 'en' && item.product?.shortDescriptionEn)
                    ? item.product.shortDescriptionEn
                    : (item.product?.shortDescription || (language === 'en' ? 'Convenient 330ml bottled nutrition' : 'Thức uống dinh dưỡng đóng chai 330ml tiện lợi'));

                  return (
                    <div
                      key={`${item.productId}-${idx}`}
                      className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#FAF8F5] border border-gray-100/90 hover:border-emerald-600/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Ảnh chai */}
                        <div className="relative w-12 h-12 rounded-lg bg-white overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center p-1">
                          <Image
                            src={item.product?.thumbnail || combo.image}
                            alt={pName}
                            fill
                            className="object-contain p-0.5"
                            sizes="48px"
                          />
                        </div>

                        {/* Thông tin chai */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 text-[11px] font-bold bg-emerald-800 text-white rounded shrink-0">
                              x{item.quantity} {language === 'en' ? 'bottles' : 'chai'}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-text-dark leading-snug">
                              {pName}
                            </h4>
                          </div>
                          <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                            {pDesc}
                          </p>
                        </div>
                      </div>

                      {/* Link xem chi tiết chai */}
                      {item.product && (
                        <Link
                          href={`/san-pham/${item.product.slug}`}
                          className="shrink-0 text-xs font-semibold text-green-primary hover:text-green-dark hover:underline flex items-center gap-0.5 ml-2"
                          title={language === 'en' ? `View ${pName}` : `Xem chi tiết ${item.product.name}`}
                        >
                          <span className="hidden sm:inline">
                            {language === 'en' ? 'View' : 'Xem vị'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Thông tin Combo, Giá, Khuyến mãi & Nút mua hàng */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Thương hiệu */}
              <div className="flex items-center gap-2 text-xs font-semibold text-green-primary uppercase tracking-wider mb-2">
                <span className="w-2 h-2 rounded-full bg-green-primary inline-block" />
                <span>
                  {language === 'en'
                    ? 'Thai Son Foods • Bottled Nutritious Beverages'
                    : 'Thái Sơn Foods • Thức Uống Dinh Dưỡng Đóng Chai'}
                </span>
              </div>

              {/* Tên combo */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-snug">
                {comboTitle}
              </h1>

              {/* Cam kết & Đánh giá */}
              <div className="flex items-center gap-3 mt-2.5 text-xs text-text-muted flex-wrap">
                <div className="flex items-center text-amber-500">
                  {'★'.repeat(5)}
                  <span className="ml-1 text-gray-700 font-semibold">(5.0)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 bg-emerald-50/80 px-2 py-0.5 rounded text-emerald-900">
                  <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>Kho: <strong>{selectedBranch?.name || 'Chi nhánh'}</strong></span>
                  <button
                    type="button"
                    onClick={openBranchModal}
                    className="text-emerald-800 underline font-bold ml-1 hover:text-emerald-950 cursor-pointer"
                  >
                    Đổi
                  </button>
                </div>
                <span>•</span>
                {isAvailable ? (
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    {language === 'en' ? 'In stock' : 'Còn hàng'}
                  </span>
                ) : (
                  <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded">
                    {language === 'en' ? 'Out of stock' : 'Hết hàng tại chi nhánh này'}
                  </span>
                )}
                <span>•</span>
                <span>{language === 'en' ? 'Combo Code: ' : 'Mã Combo: '}#{combo.id.toUpperCase()}</span>
              </div>
            </div>

            {/* KHỐI GIÁ BÁN NỔI BẬT */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-gray-200/80">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-green-primary">
                  {formatPrice(combo.salePrice)}đ
                </span>
                <span className="text-sm sm:text-base text-gray-400 line-through">
                  {formatPrice(combo.originalPrice)}đ
                </span>
                <span className="px-2 py-0.5 text-xs font-bold text-sale bg-red-100/90 rounded-md">
                  {language === 'en'
                    ? `Save ${formatPrice(savingsAmount)}đ (-${combo.discount}%)`
                    : `Tiết kiệm ${formatPrice(savingsAmount)}đ (-${combo.discount}%)`}
                </span>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-gray-200/70 text-xs sm:text-sm text-text-muted">
                <span>
                  {language === 'en'
                    ? <>Packaging: <strong>{combo.totalItems} bottles / carton</strong></>
                    : <>Quy cách: <strong>{combo.totalItems} chai / thùng</strong></>}
                </span>
              </div>
            </div>

            {/* Khối tiện ích & cam kết */}
            <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="p-3 rounded-xl bg-white border border-gray-200/80 flex items-start gap-2.5">
                  <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">
                      {language === 'en' ? 'Cooling & Nutritious' : 'Thanh mát bổ dưỡng'}
                    </p>
                    <p className="text-gray-500">
                      {language === 'en'
                        ? 'Helps cool the body and provide natural healthy vitality.'
                        : 'Giúp giải nhiệt cơ thể và cung cấp năng lượng lành mạnh.'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-gray-200/80 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">
                      {language === 'en' ? '100% Fresh Ingredients' : '100% Nguyên liệu tươi'}
                    </p>
                    <p className="text-gray-500">
                      {language === 'en'
                        ? 'No chemical preservatives, strict food safety certification.'
                        : 'Không chất bảo quản, chuẩn vệ sinh an toàn thực phẩm.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BỘ CHỌN SỐ LƯỢNG & NÚT MUA HÀNG */}
            {isCustomizable ? (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-sm text-emerald-900">
                  <p className="font-bold mb-1">
                    {language === 'en'
                      ? 'This combo supports flexible flavor customization!'
                      : 'Combo này hỗ trợ tự chọn vị linh hoạt theo sở thích!'}
                  </p>
                  <p className="text-xs text-emerald-800">
                    {language === 'en'
                      ? 'You can customize your own combination of Corn Milk, Lotus Seed Milk, Aloe Vera, or Herbal Tea.'
                      : 'Bạn có thể tự tay phối hợp các hương vị Sữa Bắp, Sâm La Hán, Mủ Trôm hoặc Sữa Hạt theo ý muốn.'}
                  </p>
                </div>

                <Link
                  href={customizeLink}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base bg-corn hover:bg-yellow-400 text-text-dark shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-text-dark" />
                  <span>
                    {language === 'en'
                      ? 'Customize flavors for this Combo'
                      : 'Vào trang tự chọn vị cho Combo này'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {/* Chọn số lượng combo */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-900">
                    {language === 'en' ? 'Quantity:' : 'Số lượng:'}
                  </span>
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="p-2 sm:px-3 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                      aria-label={language === 'en' ? 'Decrease quantity' : 'Giảm số lượng'}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-1.5 font-bold text-sm sm:text-base text-gray-900 min-w-[40px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-2 sm:px-3 hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer"
                      aria-label={language === 'en' ? 'Increase quantity' : 'Tăng số lượng'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-text-muted">
                    {language === 'en' ? 'Total: ' : 'Tổng cộng: '}
                    <strong>{formatPrice(combo.salePrice * quantity)}đ</strong>
                  </span>
                </div>

                {/* Cảnh báo thiếu hàng tại chi nhánh */}
                {!isAvailable && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-red-900">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{selectedBranch?.name || 'Chi nhánh'} hiện không đủ hàng cho Combo này</span>
                    </div>
                    {alternativeStores.length > 0 ? (
                      <div className="pt-1 border-t border-red-200/60 flex items-center justify-between gap-1">
                        <span className="text-[11px] text-gray-700">
                          Kho <strong>{alternativeStores[0].name}</strong> đủ hàng
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            useBranchStore.getState().setSelectedBranch(alternativeStores[0]);
                          }}
                          className="text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer"
                        >
                          Đổi sang kho này
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={openBranchModal}
                        className="text-[11px] font-bold text-emerald-800 underline cursor-pointer block text-left"
                      >
                        Chọn chi nhánh khác còn hàng
                      </button>
                    )}
                  </div>
                )}

                {/* Hai nút hành động chính */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={(e) => isAvailable && handleAddToCart(e)}
                    className={cn(
                      "w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2",
                      isAvailable
                        ? "bg-green-primary hover:bg-green-dark text-white hover:shadow-lg active:scale-[0.98] cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none"
                    )}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5 text-white" />
                        <span>{language === 'en' ? 'Added to cart!' : 'Đã thêm vào giỏ!'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        <span>{isAvailable ? (language === 'en' ? 'Add to Cart' : 'Thêm vào giỏ hàng') : 'Hết hàng tại chi nhánh'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!isAvailable}
                    onClick={() => isAvailable && handleBuyNow()}
                    className={cn(
                      "w-full py-3.5 px-5 rounded-xl font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center gap-2",
                      isAvailable
                        ? "bg-corn hover:bg-yellow-400 text-text-dark hover:shadow-lg active:scale-[0.98] cursor-pointer"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none"
                    )}
                  >
                    <span>{language === 'en' ? 'Buy Now' : 'Mua ngay'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Hotline & Cam kết chất lượng */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-gray-200/80 text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-gray-800 font-medium">
                  <Phone className="w-4 h-4 text-green-primary" />
                  <span>
                    {language === 'en'
                      ? 'Need bulk order advice for events / companies?'
                      : 'Cần tư vấn đặt số lượng lớn cho sự kiện/công ty?'}
                  </span>
                </div>
                <a
                  href="tel:02862915024"
                  className="font-bold text-green-primary hover:underline"
                >
                  Hotline: 028 6291 5024
                </a>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-gray-600">
                <div className="p-2 rounded-lg bg-gray-50 flex flex-col items-center gap-1">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'en' ? 'Fast 2h delivery' : 'Giao nhanh 2h'}</span>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'en' ? 'Cold store 0-4°C' : 'Bảo quản lạnh 0-4°C'}</span>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 flex flex-col items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-emerald-700" />
                  <span>{language === 'en' ? 'Attentive returns' : 'Đổi trả chu đáo'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Modal via Portal */}
      {isZoomOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsZoomOpen(false)}
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none"
        >
          {/* Close button */}
          <button
            onClick={() => setIsZoomOpen(false)}
            className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
              }}
              className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer hidden sm:flex items-center justify-center"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next button */}
          {galleryImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev + 1) % galleryImages.length);
              }}
              className="absolute right-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer hidden sm:flex items-center justify-center"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full h-[80vh] flex items-center justify-center"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Bottom caption */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/15 backdrop-blur-md px-5 py-2 rounded-full text-white text-sm font-medium border border-white/10 flex items-center gap-2"
          >
            <span className="text-orange-400 font-bold">{activeIndex + 1}</span>
            <span className="text-white/60">/</span>
            <span>{galleryImages.length}</span>
            <span className="text-white/40">•</span>
            <span>{activeImage.alt}</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
