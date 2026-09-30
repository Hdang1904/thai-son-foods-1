'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useFlyToCart } from '@/context/FlyToCartContext';
import { useRouter } from 'next/navigation';
import {
  Star,
  Truck,
  RotateCcw,
  Lock,
  ChevronDown,
  Check,
  Sparkles,
  Info,
  Flame,
  Clock,
  Package,
  Plus,
  Minus,
  Leaf,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useBranchStore } from '@/store/branch';

const VEGAN_PRODUCT_IDS = new Set([
  'sua-bap-nep',
  'sua-bap-nep-thai-son',
  'sua-hat-sen-mekong',
  'sua-hat-sen-mekong-xanh',
  'sua-gao-lut-mekong',
  'sua-gao-lut-mekong-xanh',
  'sua-hat-sen-lotus',
  'sua-hat-sen-lotus-yoo',
  'sua-gao-lut-ohsawa',
  'sua-gao-lut-ohsawa-yoo',
  'nha-dam-mu-trom',
  'nha-dam-mu-trom-thai-son',
  'tao-do-hat-chia',
  'tao-do-hat-chia-thai-son',
  'sam-la-han-hoa-cuc',
]);

interface ProductHighlightItem {
  labelVi: string;
  contentVi: string;
  labelEn: string;
  contentEn: string;
}

const PRODUCT_HIGHLIGHTS: Record<string, ProductHighlightItem[]> = {
  // Sữa Bắp Nếp Thái Sơn
  'sua-bap-nep': [
    {
      labelVi: 'Chứng nhận Quốc tế HACCP',
      contentVi: 'Quy trình sản xuất thanh trùng khép kín, kiểm soát an toàn vệ sinh thực phẩm.',
      labelEn: 'International HACCP Certification',
      contentEn: 'Closed pasteurization process, strict food hygiene and safety control.',
    },
    {
      labelVi: 'Nguyên liệu tuyển chọn',
      contentVi: 'Chế biến từ nguồn bắp nếp và hạt tự nhiên tươi ngon, giữ trọn hương vị béo ngậy thanh thuần.',
      labelEn: 'Selected Ingredients',
      contentEn: 'Processed from fresh glutinous corn and natural grains, preserving rich authentic flavor.',
    },
    {
      labelVi: 'Giàu dưỡng chất',
      contentVi: 'Bổ sung chất xơ tự nhiên, hỗ trợ tiêu hóa và nạp năng lượng tươi mới.',
      labelEn: 'Rich in Nutrients',
      contentEn: 'Supplements natural dietary fiber, supports digestion and recharges fresh energy.',
    },
  ],
  'sua-bap-nep-thai-son': [
    {
      labelVi: 'Chứng nhận Quốc tế HACCP',
      contentVi: 'Quy trình sản xuất thanh trùng khép kín, kiểm soát an toàn vệ sinh thực phẩm.',
      labelEn: 'International HACCP Certification',
      contentEn: 'Closed pasteurization process, strict food hygiene and safety control.',
    },
    {
      labelVi: 'Nguyên liệu tuyển chọn',
      contentVi: 'Chế biến từ nguồn bắp nếp và hạt tự nhiên tươi ngon, giữ trọn hương vị béo ngậy thanh thuần.',
      labelEn: 'Selected Ingredients',
      contentEn: 'Processed from fresh glutinous corn and natural grains, preserving rich authentic flavor.',
    },
    {
      labelVi: 'Giàu dưỡng chất',
      contentVi: 'Bổ sung chất xơ tự nhiên, hỗ trợ tiêu hóa và nạp năng lượng tươi mới.',
      labelEn: 'Rich in Nutrients',
      contentEn: 'Supplements natural dietary fiber, supports digestion and recharges fresh energy.',
    },
  ],
};

const DEFAULT_HIGHLIGHTS: ProductHighlightItem[] = [
  {
    labelVi: 'Chứng nhận Quốc tế HACCP',
    contentVi: 'Quy trình sản xuất thanh trùng khép kín, kiểm soát an toàn vệ sinh thực phẩm.',
    labelEn: 'International HACCP Certification',
    contentEn: 'Strict closed pasteurization technology, ensuring optimal food safety and hygiene.',
  },
  {
    labelVi: '100% Nguyên liệu tuyển chọn',
    contentVi: 'Chế biến từ nguồn nguyên liệu tự nhiên tươi ngon, giữ trọn hương vị thanh thuần.',
    labelEn: '100% Selected Natural Ingredients',
    contentEn: 'Crafted from fresh wholesome natural ingredients, retaining authentic flavor.',
  },
  {
    labelVi: 'Không chất bảo quản hóa học',
    contentVi: 'Đạt tiêu chuẩn vệ sinh an toàn thực phẩm, an tâm cho sức khỏe người dùng.',
    labelEn: 'No Chemical Preservatives',
    contentEn: 'Guaranteed food safety certified, safe and wholesome for the whole family.',
  },
  {
    labelVi: 'Giàu dưỡng chất & Vitamin',
    contentVi: 'Bổ sung vitamin và chất xơ tự nhiên, hỗ trợ tiêu hóa và nạp năng lượng tươi mới.',
    labelEn: 'Rich in Nutrients & Vitamins',
    contentEn: 'Naturally loaded with essential nutrients, boosting vitality and gut wellness.',
  },
];

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const isVegan = Boolean(product.isVegan || VEGAN_PRODUCT_IDS.has(product.id) || VEGAN_PRODUCT_IDS.has(product.slug));
  const { language } = useLanguage();
  const { flyToCart } = useFlyToCart();
  const [quantity, setQuantity] = useState(1);

  // Sắp xếp quy cách đóng gói theo thứ tự số lượng tăng dần (Chuẩn UX E-commerce: 7 -> 10 -> 12 -> 15 -> 24)
  const sortedVariants = useMemo(() => {
    if (!product.variants) return [];
    return [...product.variants].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
  }, [product.variants]);

  const [activeVariant, setActiveVariant] = useState(
    () => sortedVariants[0]?.id || product.variants?.[0]?.id || 'standard'
  );

  const [addedToast, setAddedToast] = useState(false);

  // Quản lý thông tin tồn kho theo chi nhánh đang chọn toàn site
  const { selectedBranch, openBranchModal } = useBranchStore();
  const [branchStockStatus, setBranchStockStatus] = useState<'in_stock' | 'low_stock' | 'out_of_stock'>('in_stock');
  const [hasOtherBranchInStock, setHasOtherBranchInStock] = useState(false);

  // Nạp dữ liệu tồn kho theo chi nhánh đang chọn cho sản phẩm này
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/stores?productId=${encodeURIComponent(product.id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.stores)) {
          const currentStore = data.stores.find((s: any) => s.code === selectedBranch?.code);
          if (currentStore && currentStore.stockStatus) {
            setBranchStockStatus(currentStore.stockStatus);
          } else {
            setBranchStockStatus('in_stock');
          }
          const otherInStock = data.stores.some(
            (s: any) => s.code !== selectedBranch?.code && s.stockStatus !== 'out_of_stock'
          );
          setHasOtherBranchInStock(otherInStock);
        }
      })
      .catch((err) => {
        console.error('Error fetching product stock:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [product.id, selectedBranch?.code]);

  const isOutOfStock = branchStockStatus === 'out_of_stock';
  const isLowStock = branchStockStatus === 'low_stock';

  // Accordion state - Luôn luôn đóng mặc định, người xem muốn đọc sẽ bấm mở rộng
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    highlights: false,
    details: false,
    measurements: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  // Helper for variant names
  const getVariantName = (vName: string) => {
    if (language !== 'en') return vName;
    if (vName.includes('1 chai')) return '1 Bottle';
    if (vName.includes('7 chai')) return 'Pack of 7 bottles';
    if (vName.includes('10 chai')) return 'Pack of 10 bottles';
    if (vName.includes('12 chai')) return 'Carton of 12 bottles';
    if (vName.includes('15 chai')) return 'Carton of 15 bottles';
    if (vName.includes('6 chai') || vName.includes('Lốc 6')) return 'Pack of 6 bottles';
    if (vName.includes('24 chai') || vName.includes('Thùng 24')) return 'Carton of 24 bottles';
    if (vName.includes('Combo 4')) return 'Combo of 4 bottles';
    if (vName.includes('Combo 10')) return 'Combo of 10 bottles';
    return vName;
  };

  // Find selected variant
  const currentVariant = product.variants?.find((v) => v.id === activeVariant);
  const currentPrice = currentVariant ? currentVariant.price : product.price;
  const currentUnit = currentVariant ? getVariantName(currentVariant.name) : (language === 'en' ? (product.unitEn || 'bottle') : product.unit);
  const currentVolume = currentVariant?.volume || product.volume || '330ml';
  const bottleVolume = product.volume || (currentVariant?.volume && currentVariant.volume.includes('x') ? currentVariant.volume.split('x').pop()?.trim() : currentVariant?.volume) || '330ml';
  const displayName = (language === 'en' && product.nameEn) ? product.nameEn : product.name;
  const displayShortDesc = (language === 'en' && product.shortDescriptionEn) ? product.shortDescriptionEn : product.shortDescription;
  const highlights = PRODUCT_HIGHLIGHTS[product.id] || PRODUCT_HIGHLIGHTS[product.slug] || DEFAULT_HIGHLIGHTS;

  const bottleCount = currentVariant?.quantity || 1;
  const perBottlePrice = Math.round(currentPrice / bottleCount);

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isOutOfStock) return;

    // Tìm ảnh chính sản phẩm trong gallery hoặc fallback về nút bấm
    const mainImg = document.querySelector('[data-product-main-image]') as HTMLElement | null;
    const btn = e.currentTarget as HTMLElement;

    flyToCart({
      startElement: mainImg || btn,
      imageSrc: product.thumbnail,
    });

    addItem(
      {
        productId: currentVariant ? `${product.id}-${currentVariant.id}` : product.id,
        name: currentVariant && currentVariant.name !== '1 chai' ? `${displayName} (${getVariantName(currentVariant.name)})` : displayName,
        slug: product.slug,
        price: currentPrice,
        unit: currentUnit,
        thumbnail: product.thumbnail,
      },
      quantity
    );

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;

    addItem(
      {
        productId: currentVariant ? `${product.id}-${currentVariant.id}` : product.id,
        name: currentVariant && currentVariant.name !== '1 chai' ? `${displayName} (${getVariantName(currentVariant.name)})` : displayName,
        slug: product.slug,
        price: currentPrice,
        unit: currentUnit,
        thumbnail: product.thumbnail,
      },
      quantity
    );

    router.push('/thanh-toan');
  };

  return (
    <div className="flex flex-col space-y-5 w-full max-w-[640px]">
      {/* 1. Thương hiệu & Gian hàng */}
      <div className="flex items-center justify-between text-sm text-green-primary font-medium">
        <Link href="/#ve-chung-toi" className="hover:text-green-dark hover:underline flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>
          {language === 'en' ? 'Official Thai Son Foods Store' : 'Gian hàng chính hãng Thái Sơn Foods'}
        </Link>
        <span className="text-gray-400 text-xs">
          {language === 'en' ? 'SKU: ' : 'Mã sản phẩm: '}{product.sku || 'TSF-PRODUCT'}
        </span>
      </div>

      {/* 2. Tên sản phẩm & Mô tả ngắn */}
      <div className="space-y-1.5">
        <h1
          className="text-[19px] font-bold text-gray-900 leading-snug tracking-tight font-sans"
          style={{ fontSize: '19px' }}
        >
          {displayName}
        </h1>
        {displayShortDesc && (
          <p className="text-xs sm:text-[13px] text-gray-500 leading-relaxed font-normal">
            {displayShortDesc}
          </p>
        )}
      </div>

      {/* 3. Khu vực giá & Nhãn đặc tính */}
      <div className="py-1 border-b border-gray-200 pb-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl md:text-4xl font-bold text-gray-900">
            {formatPrice(currentPrice)} <span className="text-lg font-semibold">₫</span>
          </span>
          <span className="text-sm text-gray-500 font-normal">
            ({formatPrice(perBottlePrice)} ₫ / {bottleCount > 1 ? (language === 'en' ? 'bottle' : 'chai') : (language === 'en' ? (product.unitEn || 'bottle') : product.unit)})
          </span>
        </div>

        {isVegan && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#1B5E3B] text-xs sm:text-sm font-semibold tracking-wide shadow-xs">
            <Leaf className="w-4 h-4 text-[#1B5E3B] fill-[#1B5E3B]/20" />
            <span>{language === 'en' ? 'Purely Vegan Product' : 'Sản phẩm thuần chay'}</span>
          </div>
        )}
      </div>

      {/* 4. Lựa chọn Quy cách đóng gói (Variant Matrix) */}
      {product.variants && product.variants.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">
              {language === 'en' ? 'Packaging options: ' : 'Quy cách đóng gói: '}<strong className="text-gray-900">{currentUnit}</strong> ({currentVolume})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {sortedVariants.map((v) => {
              const isSelected = activeVariant === v.id;
              const vPerBottle = Math.round(v.price / (v.quantity || 1));
              const vVolume = v.volume || product.volume || '330ml';
              const vDisplayName = getVariantName(v.name);

              return (
                <button
                  key={v.id}
                  onClick={() => setActiveVariant(v.id)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer',
                    isSelected
                      ? 'border-[#1B5E3B] bg-emerald-50/60 shadow-[0_0_0_1px_#1B5E3B]'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-semibold text-gray-900">{vDisplayName}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center text-xs">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-0.5">
                    {language === 'en' ? 'Volume: ' : 'Thể tích: '}{vVolume}
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-gray-100">
                    <div className="text-base font-bold text-gray-900">
                      {formatPrice(v.price)} ₫
                    </div>
                    <div className="text-xs text-gray-500">
                      ({formatPrice(vPerBottle)} ₫/{language === 'en' ? 'bottle' : 'chai'})
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. KHỐI MUA HÀNG (Buy Box) */}
      <div className="border border-gray-200/90 rounded-2xl p-4 md:p-5 bg-white shadow-sm space-y-4">
        {/* Tình trạng tồn kho theo chi nhánh & Giao hàng */}
        {isOutOfStock ? (
          <div className="space-y-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>
                {language === 'en'
                  ? `Out of stock at ${selectedBranch?.name || 'this branch'}`
                  : `Hết hàng tại ${selectedBranch?.name || 'chi nhánh này'}`}
              </span>
            </div>
            {hasOtherBranchInStock ? (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900">
                <span className="font-medium">
                  {language === 'en' ? 'Available at other branches' : 'Chi nhánh khác còn hàng'}
                </span>
                <button
                  type="button"
                  onClick={openBranchModal}
                  className="font-bold underline text-[#1B5E3B] hover:text-emerald-800 cursor-pointer shrink-0"
                >
                  {language === 'en' ? 'Switch branch' : 'Đổi chi nhánh'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                {language === 'en'
                  ? 'We are working hard to have this item back in stock soon.'
                  : 'Chúng tôi đang nỗ lực để sớm có hàng trở lại.'}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm pb-2 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'w-2 h-2 rounded-full animate-pulse',
                  isLowStock ? 'bg-amber-500' : 'bg-emerald-600'
                )}
              ></span>
              <span
                className={cn(
                  'font-semibold text-xs sm:text-sm',
                  isLowStock ? 'text-amber-700' : 'text-emerald-700'
                )}
              >
                {isLowStock
                  ? language === 'en'
                    ? `Low stock at ${selectedBranch?.name || 'branch'}`
                    : `Sắp hết tại ${selectedBranch?.name || 'chi nhánh'}`
                  : language === 'en'
                  ? `In stock at ${selectedBranch?.name || 'branch'}`
                  : `Còn hàng tại ${selectedBranch?.name || 'chi nhánh'}`}
              </span>
            </div>
            <span className="text-gray-500 text-xs flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-gray-400" />
              <span>{language === 'en' ? 'Same-day express' : 'Giao hỏa tốc'}</span>
            </span>
          </div>
        )}

        {/* Số lượng (Ẩn khi tạm thời hết hàng) */}
        {!isOutOfStock && (
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700 font-medium">
              {language === 'en' ? 'Quantity:' : 'Số lượng:'}
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-l-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={quantity <= 1}
                aria-label={language === 'en' ? 'Decrease quantity' : 'Giảm số lượng'}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 py-1.5 text-sm font-bold text-gray-900 min-w-[36px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-r-lg cursor-pointer"
                aria-label={language === 'en' ? 'Increase quantity' : 'Tăng số lượng'}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Nút hành động */}
        {isOutOfStock ? (
          <div className="pt-1">
            <button
              type="button"
              disabled
              className="w-full py-3.5 px-4 bg-gray-100 text-gray-400 font-bold rounded-xl text-sm md:text-base border border-gray-200 cursor-not-allowed text-center"
            >
              {language === 'en' ? 'Currently unavailable' : 'Hiện tạm thời hết hàng'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleAddToCart}
              className="w-full py-3.5 px-4 bg-[#FFD814] hover:bg-[#F7CA00] active:scale-[0.99] text-gray-900 font-bold rounded-xl text-sm md:text-base shadow-sm transition-all border border-[#FCD200] cursor-pointer"
            >
              {language === 'en' ? 'Add to Cart' : 'Thêm vào giỏ hàng'}
            </button>

            <button
              onClick={handleBuyNow}
              className="w-full py-3.5 px-4 bg-[#1B5E3B] hover:bg-[#14482D] active:scale-[0.99] text-white font-bold rounded-xl text-sm md:text-base shadow-sm transition-all cursor-pointer"
            >
              {language === 'en' ? 'Buy Now' : 'Mua ngay'}
            </button>
          </div>
        )}

        {/* Toast thông báo khi thêm giỏ */}
        {addedToast && (
          <div className="bg-green-50 border border-green-300 text-green-800 text-sm px-3.5 py-2 rounded-lg flex items-center gap-2 animate-fade-in-up">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span>
              {language === 'en' ? (
                <>Added <strong>{quantity} {currentUnit} ({currentVolume})</strong> to cart!</>
              ) : (
                <>Đã thêm <strong>{quantity} {currentUnit} ({currentVolume})</strong> vào giỏ hàng!</>
              )}
            </span>
          </div>
        )}
      </div>

      {/* 6. CÁC KHỐI THÔNG TIN CHI TIẾT (ACCORDIONS) */}
      <div className="pt-2 space-y-2.5">
        {/* Accordion 1: Đặc điểm nổi bật (Top highlights) */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            onClick={() => toggleAccordion('highlights')}
            className="w-full flex items-center justify-between px-4 py-3 text-left font-bold text-sm md:text-base text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#1B5E3B]" />
              {language === 'en' ? 'Key Highlights' : 'Đặc điểm nổi bật'}
            </span>
            <ChevronDown
              className={cn(
                'w-4.5 h-4.5 text-gray-500 transition-transform duration-200',
                openAccordions.highlights ? 'rotate-180' : ''
              )}
            />
          </button>
          {openAccordions.highlights && (
            <div className="px-4 pb-4 text-sm md:text-base text-gray-700 space-y-2 border-t border-gray-100 pt-3 leading-relaxed">
              {highlights.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#1B5E3B] font-bold">•</span>
                  <span>
                    <strong>
                      {language === 'en' ? item.labelEn : item.labelVi}:{' '}
                    </strong>
                    {language === 'en' ? item.contentEn : item.contentVi}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accordion 2: Thông tin chi tiết (Item details) */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            onClick={() => toggleAccordion('details')}
            className="w-full flex items-center justify-between px-4 py-3 text-left font-bold text-sm md:text-base text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Info className="w-4.5 h-4.5 text-[#1B5E3B]" />
              {language === 'en' ? 'Product Details' : 'Thông tin chi tiết'}
            </span>
            <ChevronDown
              className={cn(
                'w-4.5 h-4.5 text-gray-500 transition-transform duration-200',
                openAccordions.details ? 'rotate-180' : ''
              )}
            />
          </button>
          {openAccordions.details && (
            <div className="px-4 pb-4 text-sm text-gray-700 border-t border-gray-100 pt-3">
              <table className="w-full text-left">
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600 w-40">{language === 'en' ? 'Brand' : 'Thương hiệu'}</td>
                    <td className="py-2.5 text-gray-900 font-medium">Thái Sơn Foods</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">{language === 'en' ? 'Origin' : 'Xuất xứ'}</td>
                    <td className="py-2.5 text-gray-900">{language === 'en' ? 'Vietnam' : 'Việt Nam'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">{language === 'en' ? 'Product Code' : 'Mã sản phẩm'}</td>
                    <td className="py-2.5 text-gray-900 font-mono">{product.sku || 'TSF-PRODUCT'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">{language === 'en' ? 'Certification' : 'Chứng nhận'}</td>
                    <td className="py-2.5 text-emerald-700 font-semibold">{language === 'en' ? 'International HACCP Certification' : 'Chứng nhận Quốc tế HACCP'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">{language === 'en' ? 'Expiry Date' : 'Hạn sử dụng'}</td>
                    <td className="py-2.5 text-gray-900">{language === 'en' ? 'Printed on bottle cap' : 'Xem trên nắp chai'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">{language === 'en' ? 'Usage Instructions' : 'Hướng dẫn sử dụng'}</td>
                    <td className="py-2.5 text-gray-900">
                      {language === 'en'
                        ? 'Best consumed within 24 hours after opening. Keep refrigerated during use.'
                        : 'Sử dụng trong 24 giờ sau khi mở nắp, giữ lạnh sản phẩm trong quá trình sử dụng.'}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">{language === 'en' ? 'Storage Instructions' : 'Hướng dẫn bảo quản'}</td>
                    <td className="py-2.5 text-gray-900">
                      {language === 'en'
                        ? 'Store at 5 - 10°C in refrigerator chiller compartment.'
                        : 'Bảo quản ở nhiệt độ 5 - 10 độ C trong ngăn mát tủ lạnh'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Accordion 3: Quy cách & Kích thước (Measurements) */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            onClick={() => toggleAccordion('measurements')}
            className="w-full flex items-center justify-between px-4 py-3 text-left font-bold text-sm md:text-base text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Package className="w-4.5 h-4.5 text-[#1B5E3B]" />
              {language === 'en' ? 'Packaging & Dimensions' : 'Quy cách & Kích thước'}
            </span>
            <ChevronDown
              className={cn(
                'w-4.5 h-4.5 text-gray-500 transition-transform duration-200',
                openAccordions.measurements ? 'rotate-180' : ''
              )}
            />
          </button>
          {openAccordions.measurements && (
            <div className="px-4 pb-4 text-sm text-gray-700 border-t border-gray-100 pt-3 space-y-2 leading-relaxed">
              <p>• {language === 'en' ? 'Standard bottle volume: ' : 'Dung tích đóng chai tiêu chuẩn: '}<strong>{bottleVolume}</strong></p>
              <p>• {language === 'en' ? 'Packaging material: ' : 'Chất liệu bao bì: '}<strong>{language === 'en' ? 'Food-grade virgin PET, 100% recyclable' : 'Nhựa nguyên sinh an toàn thực phẩm, có thể tái chế.'}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProductBreadcrumb({
  product,
  category,
}: {
  product: Product;
  category?: { id: string; name: string; nameEn?: string; slug: string };
}) {
  const { language } = useLanguage();

  const homeText = language === 'en' ? 'Home' : 'Trang chủ';
  const categoryName = language === 'en'
    ? (category?.nameEn || (category ? category.name : 'Nutritious Beverages'))
    : (category ? category.name : 'Sản phẩm dinh dưỡng');
  const productName = language === 'en' ? (product.nameEn || product.name) : product.name;

  return (
    <div className="border-b border-gray-100 bg-[#F7F8F8] py-2.5 text-xs">
      <div className="section-container">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-gray-500 flex-wrap">
            <li>
              <Link href="/" className="hover:text-green-primary transition-colors font-medium">
                {homeText}
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" /></li>
            <li>
              <Link href="/#san-pham" className="hover:text-green-primary transition-colors font-medium">
                {categoryName}
              </Link>
            </li>
            <li><ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" /></li>
            <li className="text-gray-900 font-semibold break-words">
              {productName}
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
}
