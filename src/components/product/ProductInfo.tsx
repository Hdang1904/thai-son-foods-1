'use client';

import { useState } from 'react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useRouter } from 'next/navigation';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Lock,
  ChevronDown,
  Check,
  Heart,
  Sparkles,
  Droplets,
  Info,
  MapPin,
  Flame,
  Clock,
  Package,
  Plus,
  Minus,
  Award,
  Leaf,
} from 'lucide-react';

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [activeVariant, setActiveVariant] = useState(
    product.variants?.[0]?.id || 'standard'
  );
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  // Accordion state
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    highlights: true,
    details: true,
    measurements: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  // Find selected variant
  const currentVariant = product.variants?.find((v) => v.id === activeVariant);
  const currentPrice = currentVariant ? currentVariant.price : product.price;
  const currentUnit = currentVariant ? currentVariant.name : product.unit;
  const currentVolume = currentVariant?.volume || product.volume || '330ml';

  // Calculate per bottle price
  const bottleCount = currentVariant?.quantity || 1;
  const perBottlePrice = Math.round(currentPrice / bottleCount);

  // Check if product is milk tea (4 loại trà sữa: Trà Sữa Ciao, Matcha Trà Sữa Ciao, Trà Sữa GO, Trà Xanh GO)
  const isMilkTea =
    product.categoryId === 'tra-sua' ||
    ('categorySlug' in product && (product as { categorySlug?: string }).categorySlug === 'tra-sua') ||
    ['tra-sua-ciao', 'matcha-tra-sua-ciao', 'tra-sua-go', 'tra-xanh-go'].includes(product.slug) ||
    ['tra-sua-ciao', 'matcha-tra-sua-ciao', 'tra-sua-go', 'tra-xanh-go'].includes(product.id);

  const handleAddToCart = () => {
    addItem(
      {
        productId: currentVariant ? `${product.id}-${currentVariant.id}` : product.id,
        name: currentVariant && currentVariant.name !== '1 chai' ? `${product.name} (${currentVariant.name})` : product.name,
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
    addItem(
      {
        productId: currentVariant ? `${product.id}-${currentVariant.id}` : product.id,
        name: currentVariant && currentVariant.name !== '1 chai' ? `${product.name} (${currentVariant.name})` : product.name,
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
        <a href="/#ve-chung-toi" className="hover:text-green-dark hover:underline flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-600 inline-block"></span>
          Gian hàng chính hãng Thái Sơn Foods
        </a>
        <span className="text-gray-400 text-xs">Mã sản phẩm: {product.sku || 'TSF-PRODUCT'}</span>
      </div>

      {/* 2. Tên sản phẩm */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-snug tracking-tight font-sans">
        {product.name}
      </h1>

      {/* 3.5. Huy hiệu Chứng nhận Tiêu chuẩn HACCP */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-sm font-semibold w-fit">
        <Award className="w-4.5 h-4.5 text-[#1B5E3B] shrink-0" />
        <span>Chứng nhận Quốc tế HACCP</span>
      </div>

      {/* 4. Mô tả tóm tắt sản phẩm */}
      {product.shortDescription && (
        <p className="text-base text-gray-600 leading-relaxed">
          {product.shortDescription}
        </p>
      )}

      {/* 4.5. Sản phẩm thuần chay (cho tất cả sản phẩm trừ 4 loại trà sữa) */}
      {!isMilkTea && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-sm font-semibold w-fit">
          <Leaf className="w-4.5 h-4.5 text-[#1B5E3B] shrink-0" />
          <span>Sản phẩm thuần chay</span>
        </div>
      )}

      {/* 5. Khu vực giá & Thể tích thực */}
      <div className="space-y-2.5 py-1 border-b border-gray-200 pb-3.5">
        <div className="flex items-baseline gap-2.5 flex-wrap">
          <span className="text-3xl md:text-4xl font-bold text-gray-900">
            {formatPrice(currentPrice)} <span className="text-lg font-semibold">₫</span>
          </span>
          <span className="text-sm text-gray-500 font-normal">
            ({formatPrice(perBottlePrice)} ₫ / {bottleCount > 1 ? 'chai' : product.unit})
          </span>
        </div>

        {/* Thẻ thể tích thực */}
        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-md">
            <Droplets className="w-4 h-4 text-emerald-600" />
            Thể tích thực: <strong>{currentVolume}</strong>
          </span>
          <span className="text-sm text-gray-500">
            • Đã bao gồm thuế giá trị gia tăng (VAT)
          </span>
        </div>
      </div>

      {/* Thông báo phạm vi giao hàng (Amazon-style Delivery Restriction Alert) */}
      <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-sm flex items-start gap-2.5">
        <MapPin className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-amber-950">
            Lưu ý phạm vi giao hàng:
          </p>
          <p className="text-amber-900 leading-relaxed">
            Do đặc tính sản phẩm tươi thanh trùng cần bảo quản lạnh liên tục (2°C – 5°C), Thái Sơn Foods hiện chỉ hỗ trợ giao hàng hỏa tốc tại <strong>khu vực TP.HCM và các tỉnh lân cận</strong> (chưa hỗ trợ giao đi các tỉnh ở xa).
          </p>
        </div>
      </div>

      {/* 6. Lựa chọn Quy cách đóng gói (Variant Matrix) */}
      {product.variants && product.variants.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">
              Quy cách đóng gói: <strong className="text-gray-900">{currentUnit}</strong> ({currentVolume})
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {product.variants.map((v) => {
              const isSelected = activeVariant === v.id;
              const vPerBottle = Math.round(v.price / (v.quantity || 1));
              const vVolume = v.volume || product.volume || '330ml';

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
                    <span className="text-sm font-semibold text-gray-900">{v.name}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#1B5E3B] text-white flex items-center justify-center text-xs">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 font-medium mt-0.5">
                    Thể tích: {vVolume}
                  </div>
                  <div className="mt-1.5 pt-1 border-t border-gray-100">
                    <div className="text-base font-bold text-gray-900">
                      {formatPrice(v.price)} ₫
                    </div>
                    <div className="text-xs text-gray-500">
                      ({formatPrice(vPerBottle)} ₫/chai)
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. KHỐI MUA HÀNG (Buy Box) */}
      <div className="border border-gray-200/90 rounded-2xl p-4 md:p-5 bg-white shadow-sm space-y-4">
        {/* Tình trạng tồn kho & Giao hàng */}
        <div className="flex items-center justify-between text-sm pb-2 border-b border-gray-100">
          <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            Còn hàng
          </span>
          <span className="text-gray-500 flex items-center gap-1">
            <Truck className="w-4 h-4 text-gray-400" />
            Giao hỏa tốc trong ngày
          </span>
        </div>

        {/* Số lượng */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 font-medium">Số lượng:</label>
          <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-l-lg cursor-pointer"
              aria-label="Giảm số lượng"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-sm font-bold text-gray-900 min-w-[36px] text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-r-lg cursor-pointer"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleAddToCart}
            className="w-full py-3.5 px-4 bg-[#FFD814] hover:bg-[#F7CA00] active:scale-[0.99] text-gray-900 font-bold rounded-xl text-sm md:text-base shadow-sm transition-all border border-[#FCD200] cursor-pointer"
          >
            Thêm vào giỏ hàng
          </button>

          <button
            onClick={handleBuyNow}
            className="w-full py-3.5 px-4 bg-[#1B5E3B] hover:bg-[#14482D] active:scale-[0.99] text-white font-bold rounded-xl text-sm md:text-base shadow-sm transition-all cursor-pointer"
          >
            Mua ngay
          </button>
        </div>

        {/* Toast thông báo khi thêm giỏ */}
        {addedToast && (
          <div className="bg-green-50 border border-green-300 text-green-800 text-sm px-3.5 py-2 rounded-lg flex items-center gap-2 animate-fade-in-up">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span>Đã thêm <strong>{quantity} {currentUnit} ({currentVolume})</strong> vào giỏ hàng!</span>
          </div>
        )}

        {/* Nút yêu thích */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors py-1 cursor-pointer"
        >
          <Heart
            className={cn('w-4 h-4', isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400')}
          />
          <span>{isWishlisted ? 'Đã thêm vào danh sách yêu thích' : 'Thêm vào danh sách yêu thích'}</span>
        </button>

        {/* Cam kết dịch vụ */}
        <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-100 text-center text-sm text-emerald-950">
          <ShieldCheck className="w-4.5 h-4.5 text-[#1B5E3B]" />
          <span className="font-semibold">Chứng nhận Quốc tế HACCP</span>
        </div>
      </div>

      {/* 8. CÁC KHỐI THÔNG TIN CHI TIẾT (ACCORDIONS) */}
      <div className="pt-2 space-y-2.5">
        {/* Accordion 1: Đặc điểm nổi bật (Top highlights) */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <button
            onClick={() => toggleAccordion('highlights')}
            className="w-full flex items-center justify-between px-4 py-3 text-left font-bold text-sm md:text-base text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#1B5E3B]" />
              Đặc điểm nổi bật
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
              <div className="flex items-start gap-2">
                <span className="text-[#1B5E3B] font-bold">•</span>
                <span><strong>Chứng nhận Quốc tế HACCP:</strong> Quy trình sản xuất thanh trùng khép kín, kiểm soát an toàn vệ sinh thực phẩm.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1B5E3B] font-bold">•</span>
                <span><strong>100% Nguyên liệu tuyển chọn:</strong> Chế biến từ nguồn bắp nếp và hạt tự nhiên tươi ngon, giữ trọn hương vị béo ngậy thanh thuần.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1B5E3B] font-bold">•</span>
                <span><strong>Không chất bảo quản hóa học:</strong> Đạt tiêu chuẩn vệ sinh an toàn thực phẩm, an tâm cho sức khỏe người dùng.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1B5E3B] font-bold">•</span>
                <span><strong>Giàu dưỡng chất & Vitamin:</strong> Bổ sung vitamin A, nhóm B và chất xơ tự nhiên, hỗ trợ tiêu hóa và nạp năng lượng tươi mới.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#1B5E3B] font-bold">•</span>
                <span><strong>Công nghệ thanh trùng khép kín:</strong> Giữ trọn độ tươi mát và dinh dưỡng trọn vẹn trong chai.</span>
              </div>
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
              Thông tin chi tiết
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
                    <td className="py-2.5 font-semibold text-gray-600 w-40">Thương hiệu</td>
                    <td className="py-2.5 text-gray-900 font-medium">Thái Sơn Foods</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">Xuất xứ</td>
                    <td className="py-2.5 text-gray-900">Việt Nam</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">Mã sản phẩm</td>
                    <td className="py-2.5 text-gray-900 font-mono">{product.sku || 'TSF-PRODUCT'}</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">Chứng nhận</td>
                    <td className="py-2.5 text-emerald-700 font-semibold">Chứng nhận Quốc tế HACCP</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">Hạn sử dụng</td>
                    <td className="py-2.5 text-gray-900">30 ngày kể từ NSX (Xem trên nắp chai)</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2.5 font-semibold text-gray-600">Hướng dẫn bảo quản</td>
                    <td className="py-2.5 text-gray-900">Bảo quản ở nhiệt độ 2°C - 5°C trong ngăn mát tủ lạnh</td>
                  </tr>
                  {product.description && (
                    <tr>
                      <td className="py-2.5 font-semibold text-gray-600 align-top">Mô tả sản phẩm</td>
                      <td className="py-2.5 text-gray-900 leading-relaxed">{product.description}</td>
                    </tr>
                  )}
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
              Quy cách & Kích thước
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
              <p>• Dung tích đóng chai tiêu chuẩn: <strong>{currentVolume}</strong></p>
              <p>• Chất liệu bao bì: <strong>Nhựa nguyên sinh an toàn thực phẩm</strong>, có thể tái chế.</p>
              <p>• Quy cách vận chuyển: Thùng carton 5 lớp chống va đập, bảo quản kèm túi giữ nhiệt khi giao xa.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
