'use client';

import { useState, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { products } from '@/data/products';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';

// ==========================================
// CẤU HÌNH COMBO 01 (TỰ DO 4 CHAI)
// ==========================================
const COMBO_01_TARGET = 4;
const COMBO_01_PRICE = 69000;

const PRODUCT_SUBTITLES: Record<string, string> = {
  'sua-bap-nep': '330ml • Vị ngọt thanh bùi ngậy bắp non',
  'nha-dam-mu-trom': '330ml • Thanh nhiệt giải độc giòn sần sật',
  'sua-hat-sen-mekong': '330ml • Hương sen Đồng Tháp thuần khiết',
  'sua-gao-lut-mekong': '330ml • Giàu dưỡng chất, thơm dẻo gạo lứt',
  'sua-hat-sen-lotus': '330ml • Công thức ít ngọt, thơm mát',
  'sua-gao-lut-ohsawa': '330ml • Vị đậm đà bổ dưỡng năng lượng',
  'tao-do-hat-chia': '330ml • Bổ khí huyết, đẹp da và dáng',
  'sam-la-han-hoa-cuc': '330ml • Mát gan giải nhiệt ngày nắng nóng',
  'tra-sua-ciao': '330ml • Đậm vị trà, béo ngậy vị sữa',
  'matcha-tra-sua-ciao': '330ml • Trà xanh Matcha Nhật Bản thơm dịu',
  'tra-sua-go': '330ml • Thạch dai giòn sảng khoái',
  'tra-xanh-go': '330ml • Trà xanh thanh mát, thạch giòn',
};

// ==========================================
// CẤU HÌNH COMBO 02 (10 CHAI PHÂN NHÁNH)
// ==========================================
const COMBO_02_TARGET = 10;
const COMBO_02_PRICE = 145000;
const COMBO_02_ORIGINAL_PRICE = 180000;

interface OptionItem {
  id: string;
  name: string;
  count: number;
  unitPrice: number;
  totalOriginal: number;
  image: string;
  desc: string;
  badge?: string;
}

// BƯỚC 1: Chọn 5 chai chủ lực
const STEP1_OPTIONS: OptionItem[] = [
  {
    id: 'sua-bap-nep',
    name: 'Sữa Bắp Nếp Thái Sơn',
    count: 5,
    unitPrice: 18000,
    totalOriginal: 90000,
    image: '/images/products/1200x900-sb1.jpg',
    desc: '330ml • Vị ngọt thanh bùi ngậy tự nhiên từ bắp non tươi nguyên chất',
    badge: 'Món bán chạy #1',
  },
  {
    id: 'nha-dam-mu-trom',
    name: 'Nha Đam Mủ Trôm Thái Sơn',
    count: 5,
    unitPrice: 18000,
    totalOriginal: 90000,
    image: '/images/products/1200x900-md1.jpg',
    desc: '330ml • Thanh nhiệt giải độc cơ thể, topping nha đam giòn mát sần sật',
    badge: 'Thanh nhiệt giải độc',
  },
];

// BƯỚC 2 (Nhánh A: Khi đã chọn 5 Sữa Bắp): 3 chai Thảo mộc
const STEP2_SUA_BAP_OPTIONS: OptionItem[] = [
  {
    id: 'sam-la-han-hoa-cuc',
    name: 'Sâm La Hán Hoa Cúc',
    count: 3,
    unitPrice: 18000,
    totalOriginal: 54000,
    image: '/images/products/1200x900-lh1.jpg',
    desc: '330ml • Mát gan giải nhiệt, kết hợp tinh hoa La Hán Quả & Hoa Cúc tự nhiên',
    badge: 'Thảo mộc thanh mát',
  },
  {
    id: 'tao-do-hat-chia',
    name: 'Táo Đỏ Hạt Chia',
    count: 3,
    unitPrice: 18000,
    totalOriginal: 54000,
    image: '/images/products/1200x900-td1.jpg',
    desc: '330ml • Bổ khí huyết, đẹp da dáng cùng hạt chia organic giàu dưỡng chất',
    badge: 'Bổ dưỡng đẹp dáng',
  },
];

// BƯỚC 2 (Nhánh B: Khi đã chọn 5 Mủ Trôm): 3 chai Sữa hạt
const STEP2_MU_TROM_OPTIONS: OptionItem[] = [
  {
    id: 'sua-hat-sen-mekong',
    name: 'Sữa Hạt Sen Mekong Xanh',
    count: 3,
    unitPrice: 18000,
    totalOriginal: 54000,
    image: '/images/products/1200x900-shs1.jpg',
    desc: '330ml • Hạt sen Đồng Tháp thuần khiết, thanh tâm an thần ngủ ngon',
    badge: 'An thần thanh lọc',
  },
  {
    id: 'sua-gao-lut-mekong',
    name: 'Sữa Gạo Lứt Mekong Xanh',
    count: 3,
    unitPrice: 18000,
    totalOriginal: 54000,
    image: '/images/products/1200x900-sgl1.jpg',
    desc: '330ml • Gạo lứt huyết rồng dồi dào chất xơ & nguồn năng lượng lành mạnh',
    badge: 'Năng lượng lành',
  },
];

// BƯỚC 3: Chọn 2 chai Trà thạch
const STEP3_OPTIONS: OptionItem[] = [
  {
    id: 'tra-sua-go',
    name: 'Trà Sữa GO',
    count: 2,
    unitPrice: 18000,
    totalOriginal: 36000,
    image: '/images/products/1200x900-tsg1.jpg',
    desc: '330ml • Trà sữa béo ngậy thơm nồng kèm thạch dai giòn sảng khoái',
    badge: 'Kèm thạch giòn',
  },
  {
    id: 'tra-xanh-go',
    name: 'Trà Xanh GO',
    count: 2,
    unitPrice: 18000,
    totalOriginal: 36000,
    image: '/images/products/1200x900-txg1.jpg',
    desc: '330ml • Lá trà xanh mát lạnh kết hợp thạch giòn dai vui miệng',
    badge: 'Kèm thạch giòn',
  },
];

// ==========================================
// COMPONENT CHỌN COMBO 01 (TỰ DO 4 CHAI)
// ==========================================
function Combo01View() {
  const [selectedBottles, setSelectedBottles] = useState<Record<string, number>>({
    'sua-bap-nep': 1,
    'nha-dam-mu-trom': 1,
  });
  const [justAdded, setJustAdded] = useState(false);

  const availableProducts = useMemo(() => {
    return products.filter((p) => p.isActive);
  }, []);

  const totalSelected = useMemo(() => {
    return Object.values(selectedBottles).reduce((sum, qty) => sum + qty, 0);
  }, [selectedBottles]);

  const originalMarketPrice = useMemo(() => {
    const sum = Object.entries(selectedBottles).reduce((acc, [id, qty]) => {
      const prod = availableProducts.find((p) => p.id === id);
      return acc + (prod ? prod.price * qty : 18000 * qty);
    }, 0);
    return Math.max(72000, sum);
  }, [selectedBottles, availableProducts]);

  const savings = Math.max(3000, originalMarketPrice - COMBO_01_PRICE);
  const percentComplete = Math.min(100, Math.round((totalSelected / COMBO_01_TARGET) * 100));

  const selectedSlots = useMemo(() => {
    const slots: (typeof availableProducts[0] | null)[] = [];
    for (const [id, qty] of Object.entries(selectedBottles)) {
      const prod = availableProducts.find((p) => p.id === id);
      if (prod) {
        for (let i = 0; i < qty; i++) {
          if (slots.length < COMBO_01_TARGET) {
            slots.push(prod);
          }
        }
      }
    }
    while (slots.length < COMBO_01_TARGET) {
      slots.push(null);
    }
    return slots;
  }, [selectedBottles, availableProducts]);

  const handleIncrease = (productId: string) => {
    if (totalSelected >= COMBO_01_TARGET) return;
    setSelectedBottles((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleDecrease = (productId: string) => {
    setSelectedBottles((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: current - 1,
      };
    });
  };

  const handleClearAll = () => {
    setSelectedBottles({});
  };

  const handleAddToCart = () => {
    if (totalSelected !== COMBO_01_TARGET) return;

    const summaryList = Object.entries(selectedBottles)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const prod = availableProducts.find((p) => p.id === id);
        const name = prod
          ? prod.name.replace('Thái Sơn', '').replace('Mekong Xanh', '').trim()
          : id;
        return `${qty} ${name}`;
      });

    const summaryText = summaryList.join(', ');
    const fingerprint = Object.entries(selectedBottles)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => `${id}:${qty}`)
      .sort()
      .join('_');

    useCartStore.getState().addItem({
      productId: `combo-4-chai-${fingerprint}`,
      name: 'Combo 4 Chai (Tự chọn)',
      slug: '/combo?type=combo-4-chai',
      price: COMBO_01_PRICE,
      unit: `4 chai: ${summaryText}`,
      thumbnail: '/images/combos/combo-7-chai-3.jpg',
    });

    setJustAdded(true);
    useCartStore.getState().openCart();
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div>
      {/* Header: Tiêu đề & Giá bán */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#11241C] font-heading tracking-tight">
            Chọn 4 chai cho Combo 01
          </h1>
          <p className="text-text-muted text-sm md:text-[15px] mt-1">
            Tự do chọn 4 chai bất kỳ trong 12 thức uống bên dưới — Giá trọn gói chỉ{' '}
            <strong className="text-text-dark font-bold">{formatPrice(COMBO_01_PRICE)}đ</strong>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#11241C] font-heading">
              {formatPrice(COMBO_01_PRICE)}đ
            </span>
            <span className="text-sm md:text-base text-gray-400 line-through">
              {formatPrice(originalMarketPrice)}đ
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 mt-0.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Tiết kiệm {formatPrice(savings)}đ so với giá bán lẻ
          </div>
        </div>
      </div>

      {/* KHAY 4 CHAI ĐÃ CHỌN */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-4 sm:p-6 shadow-xs mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {selectedSlots.map((product, index) => {
                if (product) {
                  return (
                    <div
                      key={`slot-${index}-${product.id}`}
                      className="relative rounded-2xl border-2 border-[#1B4D3E] bg-[#FAF8F5] p-3 flex flex-col items-center justify-between text-center min-h-[145px] shadow-xs group transition-all"
                    >
                      <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#1B4D3E] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                        {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDecrease(product.id)}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-100 hover:bg-red-500 text-red-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Bỏ chai này"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div className="relative w-16 h-20 my-1">
                        <Image
                          src={product.thumbnail}
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="80px"
                        />
                      </div>

                      <div className="w-full">
                        <p className="text-xs font-bold text-text-dark line-clamp-1 leading-tight">
                          {product.name.replace('Thái Sơn', '').replace('Mekong Xanh', '').trim()}
                        </p>
                        <span className="text-[10px] text-emerald-700 font-semibold">Đã chọn</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`slot-empty-${index}`}
                    className="relative rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 p-3 flex flex-col items-center justify-center text-center min-h-[145px] transition-all"
                  >
                    <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-gray-200 text-gray-500 text-[11px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-200/80 flex items-center justify-center text-gray-400 mb-2">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">Chai {index + 1}</span>
                    <span className="text-[10px] text-gray-400">Chọn bên dưới</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-text-dark mb-1.5">
                <span>Tiến độ hoàn tất Combo</span>
                <span className="text-emerald-700 font-bold">{totalSelected} / {COMBO_01_TARGET} chai</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#1B4D3E] transition-all duration-300 rounded-full"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>

              {totalSelected < COMBO_01_TARGET ? (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/70 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Vui lòng chọn thêm <strong>{COMBO_01_TARGET - totalSelected} chai</strong> nữa để đủ 4 chai cho combo.</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Đã đủ 4 chai! Bạn có thể thêm ngay vào giỏ hàng.</span>
                </div>
              )}
            </div>

            {totalSelected > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="mt-4 text-xs font-semibold text-gray-500 hover:text-red-500 inline-flex items-center gap-1 self-start transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Làm mới khay chọn</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DANH SÁCH 12 SẢN PHẨM ĐỂ CHỌN */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-dark font-heading">
            Danh sách 12 thức uống thanh mát
          </h2>
          <span className="text-xs text-text-muted">Nhấn dấu + hoặc - để thêm chai</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {availableProducts.map((prod) => {
            const currentQty = selectedBottles[prod.id] || 0;
            const isSelected = currentQty > 0;
            const subtitle = PRODUCT_SUBTITLES[prod.id] || prod.volume || '330ml';
            const isLimitReached = totalSelected >= COMBO_01_TARGET && currentQty === 0;

            return (
              <div
                key={prod.id}
                className={cn(
                  'rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between bg-white relative',
                  isSelected
                    ? 'border-[#1B4D3E] shadow-sm ring-1 ring-[#1B4D3E]/20'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-xs',
                  isLimitReached && 'opacity-60 bg-gray-50'
                )}
              >
                {isSelected && (
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#1B4D3E] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    {currentQty}
                  </span>
                )}

                <div>
                  <div className="relative w-full aspect-square mb-3 bg-[#FAF8F5] rounded-xl p-2 flex items-center justify-center overflow-hidden">
                    <Image
                      src={prod.thumbnail}
                      alt={prod.name}
                      fill
                      className="object-contain p-2 group-hover:scale-105 transition-transform"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  <h3 className="font-bold text-text-dark text-sm sm:text-base leading-snug line-clamp-1 mb-1">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-1 mb-2">{subtitle}</p>

                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-xs text-gray-400">Giá lẻ:</span>
                    <span className="text-xs font-semibold text-gray-600 line-through">
                      {formatPrice(prod.price)}đ
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Gói Combo
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  {currentQty > 0 ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecrease(prod.id)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold text-text-dark min-w-[20px] text-center">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrease(prod.id)}
                          disabled={totalSelected >= COMBO_01_TARGET}
                          className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                            totalSelected >= COMBO_01_TARGET
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-[#1B4D3E] hover:bg-[#153D31] text-white cursor-pointer'
                          )}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-emerald-800">
                        {currentQty} chai
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleIncrease(prod.id)}
                      disabled={totalSelected >= COMBO_01_TARGET}
                      className={cn(
                        'w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all',
                        totalSelected >= COMBO_01_TARGET
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-[#FAF8F5] hover:bg-[#1B4D3E] text-text-dark hover:text-white border border-gray-300 hover:border-[#1B4D3E] cursor-pointer active:scale-95'
                      )}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm vào Combo</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THANH TỔNG KẾT VÀ NÚT THÊM GIỎ HÀNG DƯỚI CÙNG */}
      <div className="fixed bottom-0 left-0 right-0 min-[1440px]:right-[380px] z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 px-4 py-3 sm:py-4 shadow-xl">
        <div className="section-container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#11241C] font-heading">
                  {formatPrice(COMBO_01_PRICE)}đ
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(originalMarketPrice)}đ
                </span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">
                Đã chọn {totalSelected}/{COMBO_01_TARGET} chai
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {totalSelected < COMBO_01_TARGET && (
              <div className="hidden sm:flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Chọn thêm {COMBO_01_TARGET - totalSelected} chai để hoàn tất
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={totalSelected !== COMBO_01_TARGET}
              className={cn(
                'w-full sm:w-auto px-6 sm:px-8 py-3 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md',
                totalSelected === COMBO_01_TARGET
                  ? 'bg-[#1B4D3E] text-white hover:bg-[#153D31] active:scale-95 cursor-pointer shadow-[#1B4D3E]/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              )}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Đã thêm vào giỏ!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Thêm vào giỏ hàng ({formatPrice(COMBO_01_PRICE)}đ)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT CHỌN COMBO 02 (10 CHAI PHÂN NHÁNH)
// ==========================================
function Combo02View() {
  const [step1, setStep1] = useState<'sua-bap-nep' | 'nha-dam-mu-trom' | null>(null);
  const [step2, setStep2] = useState<string | null>(null);
  const [step3, setStep3] = useState<'tra-sua-go' | 'tra-xanh-go' | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  // Tính toán số chai đã chọn
  const totalSelected = useMemo(() => {
    let count = 0;
    if (step1) count += 5;
    if (step2) count += 3;
    if (step3) count += 2;
    return count;
  }, [step1, step2, step3]);

  const isComplete = totalSelected === COMBO_02_TARGET;

  // Sản phẩm đang được chọn
  const selectedStep1Obj = useMemo(() => {
    return STEP1_OPTIONS.find((o) => o.id === step1) || null;
  }, [step1]);

  const currentStep2Options = useMemo(() => {
    if (step1 === 'sua-bap-nep') return STEP2_SUA_BAP_OPTIONS;
    if (step1 === 'nha-dam-mu-trom') return STEP2_MU_TROM_OPTIONS;
    return [];
  }, [step1]);

  const selectedStep2Obj = useMemo(() => {
    if (!step2) return null;
    return currentStep2Options.find((o) => o.id === step2) || null;
  }, [step2, currentStep2Options]);

  const selectedStep3Obj = useMemo(() => {
    return STEP3_OPTIONS.find((o) => o.id === step3) || null;
  }, [step3]);

  // Xử lý chọn Bước 1 (5 chai)
  const handleToggleStep1 = (id: 'sua-bap-nep' | 'nha-dam-mu-trom') => {
    if (step1 === id) {
      setStep1(null);
      setStep2(null); // Reset bước 2
    } else {
      setStep1(id);
      setStep2(null); // Reset bước 2 để chọn lại theo nhánh mới
    }
  };

  // Xử lý chọn Bước 2 (3 chai)
  const handleToggleStep2 = (id: string) => {
    if (step2 === id) {
      setStep2(null);
    } else {
      setStep2(id);
    }
  };

  // Xử lý chọn Bước 3 (2 chai)
  const handleToggleStep3 = (id: 'tra-sua-go' | 'tra-xanh-go') => {
    if (step3 === id) {
      setStep3(null);
    } else {
      setStep3(id);
    }
  };

  // Làm mới toàn bộ
  const handleReset = () => {
    setStep1(null);
    setStep2(null);
    setStep3(null);
  };

  // Thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (!isComplete || !selectedStep1Obj || !selectedStep2Obj || !selectedStep3Obj) return;

    const summaryText = `5x ${selectedStep1Obj.name}, 3x ${selectedStep2Obj.name}, 2x ${selectedStep3Obj.name}`;
    const fingerprint = `${step1}_${step2}_${step3}`;

    useCartStore.getState().addItem({
      productId: `combo-van-phong-${fingerprint}`,
      name: 'Combo Văn Phòng (10 chai)',
      slug: '/combo?type=combo-van-phong',
      price: COMBO_02_PRICE,
      unit: `10 chai: ${summaryText}`,
      thumbnail: '/images/combos/combo-6-chai-2.jpg',
    });

    setJustAdded(true);
    useCartStore.getState().openCart();
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div>
      {/* Header: Tiêu đề & Mức giá ưu đãi */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 pb-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            COMBO 02 • ĐẶC QUYỀN 10 CHAI THEO NHÁNH VỊ
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#11241C] font-heading tracking-tight">
            Tùy chọn Combo 10 chai Văn Phòng
          </h1>
          <p className="text-text-muted text-sm md:text-[15px] mt-1 max-w-2xl">
            Tùy chọn combo 10 chai: <strong className="text-emerald-800">5 chai chủ đạo</strong> +{' '}
            <strong className="text-amber-800">3 chai bổ trợ</strong> +{' '}
            <strong className="text-teal-800">2 chai trà thạch</strong> — Trọn gói ưu đãi chỉ{' '}
            <strong className="text-text-dark font-bold">{formatPrice(COMBO_02_PRICE)}đ</strong>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-[#11241C] font-heading">
              {formatPrice(COMBO_02_PRICE)}đ
            </span>
            <span className="text-sm md:text-base text-gray-400 line-through">
              {formatPrice(COMBO_02_ORIGINAL_PRICE)}đ
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 mt-0.5">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            Tiết kiệm 35.000đ (giảm 19%) so với giá bán lẻ
          </div>
        </div>
      </div>

      {/* THANH TIẾN ĐỘ CHECKLIST GỌN GÀNG (PROGRESS STRIP) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-3.5 sm:p-4 shadow-xs mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span className="text-sm font-bold text-text-dark">
              Tiến độ chọn: {totalSelected}/10 chai
            </span>
            {isComplete ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ✓ Đã đủ 10 chai
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Còn thiếu {10 - totalSelected} chai
              </span>
            )}
          </div>

          {totalSelected > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-gray-500 hover:text-red-500 inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chọn lại từ đầu</span>
            </button>
          )}
        </div>

        {/* Thanh bar % trực quan */}
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
            style={{ width: `${(totalSelected / 10) * 100}%` }}
          />
        </div>

        {/* 3 tag tóm tắt nhanh món đang chọn */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 text-xs">
          <div
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors',
              selectedStep1Obj ? 'bg-emerald-50/80 text-emerald-900 font-semibold' : 'bg-gray-50 text-gray-400'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                selectedStep1Obj ? 'bg-emerald-600' : 'bg-gray-300'
              )}
            />
            <span className="truncate">
              5 chai chính:{' '}
              <strong className={selectedStep1Obj ? 'text-emerald-950' : ''}>
                {selectedStep1Obj ? selectedStep1Obj.name : 'Chưa chọn'}
              </strong>
            </span>
          </div>

          <div
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors',
              selectedStep2Obj ? 'bg-amber-50/80 text-amber-900 font-semibold' : 'bg-gray-50 text-gray-400'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                selectedStep2Obj ? 'bg-amber-600' : 'bg-gray-300'
              )}
            />
            <span className="truncate">
              3 chai bổ trợ:{' '}
              <strong className={selectedStep2Obj ? 'text-amber-950' : ''}>
                {selectedStep2Obj ? selectedStep2Obj.name : 'Chưa chọn'}
              </strong>
            </span>
          </div>

          <div
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-colors',
              selectedStep3Obj ? 'bg-teal-50/80 text-teal-900 font-semibold' : 'bg-gray-50 text-gray-400'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full shrink-0',
                selectedStep3Obj ? 'bg-teal-600' : 'bg-gray-300'
              )}
            />
            <span className="truncate">
              2 chai trà thạch:{' '}
              <strong className={selectedStep3Obj ? 'text-teal-950' : ''}>
                {selectedStep3Obj ? selectedStep3Obj.name : 'Chưa chọn'}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* DANH SÁCH CHECKLIST 3 MỤC CHỌN (GỌN GÀNG - TRỰC QUAN) */}
      <div className="space-y-5 mb-10">
        {/* MỤC 1: 5 CHAI CHỦ ĐẠO */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <h3 className="text-base font-bold text-text-dark font-heading">
                1. Chọn 5 chai chủ đạo
              </h3>
              <span className="text-xs text-text-muted hidden sm:inline-block">
                (Chọn 1 trong 2 loại)
              </span>
            </div>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-0.5 rounded-full',
                step1 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
              )}
            >
              {step1 ? '✓ Đã chọn 5 chai' : 'Bắt buộc • 5 chai'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STEP1_OPTIONS.map((opt) => {
              const isSelected = step1 === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleToggleStep1(opt.id as any)}
                  className={cn(
                    'group flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none',
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600/20'
                      : 'border-gray-200 hover:border-emerald-300 bg-white hover:bg-gray-50/50'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox / Radio indicator */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white group-hover:border-emerald-500'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-12 h-14 bg-[#FAF8F5] rounded-lg p-1 shrink-0 flex items-center justify-center border border-gray-100">
                      <Image
                        src={opt.image}
                        alt={opt.name}
                        fill
                        className="object-contain p-0.5"
                        sizes="48px"
                      />
                    </div>

                    {/* Name & Desc */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            'text-[11px] font-bold px-1.5 py-0.2 rounded',
                            isSelected ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          5 chai
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold truncate leading-tight',
                            isSelected ? 'text-emerald-950 font-extrabold' : 'text-text-dark'
                          )}
                        >
                          {opt.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-black block',
                        isSelected ? 'text-emerald-800' : 'text-gray-700'
                      )}
                    >
                      {formatPrice(opt.totalOriginal)}đ
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {isSelected ? 'Đang chọn' : 'Chạm để chọn'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MỤC 2: 3 CHAI BỔ TRỢ THEO VỊ */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              <h3 className="text-base font-bold text-text-dark font-heading">
                2. Chọn 3 chai bổ trợ{' '}
                {step1 === 'sua-bap-nep'
                  ? '(Thảo mộc thanh mát)'
                  : step1 === 'nha-dam-mu-trom'
                  ? '(Sữa hạt thực dưỡng)'
                  : ''}
              </h3>
              <span className="text-xs text-text-muted hidden sm:inline-block">
                (Chọn 1 trong 2 loại)
              </span>
            </div>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-0.5 rounded-full',
                step2 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'
              )}
            >
              {step2 ? '✓ Đã chọn 3 chai' : 'Bắt buộc • 3 chai'}
            </span>
          </div>

          {!step1 ? (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50/70 border border-dashed border-amber-200 text-amber-900 text-xs sm:text-sm">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                !
              </span>
              <span>
                Vui lòng tick chọn 5 chai chủ đạo ở mục 1 trước để hiển thị 2 lựa chọn 3 chai phù hợp tại đây.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentStep2Options.map((opt) => {
                const isSelected = step2 === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleToggleStep2(opt.id)}
                    className={cn(
                      'group flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none',
                      isSelected
                        ? 'border-amber-600 bg-amber-50/50 shadow-xs ring-1 ring-amber-600/20'
                        : 'border-gray-200 hover:border-amber-300 bg-white hover:bg-gray-50/50'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox / Radio indicator */}
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          isSelected
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-gray-300 bg-white group-hover:border-amber-500'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      {/* Thumbnail */}
                      <div className="relative w-12 h-14 bg-[#FAF8F5] rounded-lg p-1 shrink-0 flex items-center justify-center border border-gray-100">
                        <Image
                          src={opt.image}
                          alt={opt.name}
                          fill
                          className="object-contain p-0.5"
                          sizes="48px"
                        />
                      </div>

                      {/* Name & Desc */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              'text-[11px] font-bold px-1.5 py-0.2 rounded',
                              isSelected ? 'bg-amber-700 text-white' : 'bg-gray-100 text-gray-700'
                            )}
                          >
                            3 chai
                          </span>
                          <span
                            className={cn(
                              'text-sm font-bold truncate leading-tight',
                              isSelected ? 'text-amber-950 font-extrabold' : 'text-text-dark'
                            )}
                          >
                            {opt.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                          {opt.desc}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={cn(
                          'text-xs sm:text-sm font-black block',
                          isSelected ? 'text-amber-800' : 'text-gray-700'
                        )}
                      >
                        {formatPrice(opt.totalOriginal)}đ
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {isSelected ? 'Đang chọn' : 'Chạm để chọn'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MỤC 3: 2 CHAI TRÀ THẠCH GO */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <h3 className="text-base font-bold text-text-dark font-heading">
                3. Chọn 2 chai trà thạch GO
              </h3>
              <span className="text-xs text-text-muted hidden sm:inline-block">
                (Chọn 1 trong 2 loại)
              </span>
            </div>
            <span
              className={cn(
                'text-xs font-bold px-2.5 py-0.5 rounded-full',
                step3 ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-500'
              )}
            >
              {step3 ? '✓ Đã chọn 2 chai' : 'Bắt buộc • 2 chai'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STEP3_OPTIONS.map((opt) => {
              const isSelected = step3 === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleToggleStep3(opt.id as any)}
                  className={cn(
                    'group flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer select-none',
                    isSelected
                      ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600/20'
                      : 'border-gray-200 hover:border-teal-300 bg-white hover:bg-gray-50/50'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox / Radio indicator */}
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                        isSelected
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-gray-300 bg-white group-hover:border-teal-500'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    {/* Thumbnail */}
                    <div className="relative w-12 h-14 bg-[#FAF8F5] rounded-lg p-1 shrink-0 flex items-center justify-center border border-gray-100">
                      <Image
                        src={opt.image}
                        alt={opt.name}
                        fill
                        className="object-contain p-0.5"
                        sizes="48px"
                      />
                    </div>

                    {/* Name & Desc */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            'text-[11px] font-bold px-1.5 py-0.2 rounded',
                            isSelected ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-700'
                          )}
                        >
                          2 chai
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold truncate leading-tight',
                            isSelected ? 'text-teal-950 font-extrabold' : 'text-text-dark'
                          )}
                        >
                          {opt.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={cn(
                        'text-xs sm:text-sm font-black block',
                        isSelected ? 'text-teal-800' : 'text-gray-700'
                      )}
                    >
                      {formatPrice(opt.totalOriginal)}đ
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {isSelected ? 'Đang chọn' : 'Chạm để chọn'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* THANH TỔNG KẾT VÀ NÚT THÊM GIỎ HÀNG DƯỚI CÙNG CHO COMBO 02 */}
      <div className="fixed bottom-0 left-0 right-0 min-[1440px]:right-[380px] z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/90 px-4 py-3 sm:py-4 shadow-xl">
        <div className="section-container max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-[#11241C] font-heading">
                  {formatPrice(COMBO_02_PRICE)}đ
                </span>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(COMBO_02_ORIGINAL_PRICE)}đ
                </span>
                <span className="text-[11px] font-bold text-sale bg-sale/10 px-1.5 py-0.5 rounded">
                  -19%
                </span>
              </div>
              <span className="text-xs text-emerald-800 font-semibold">
                Đã chọn: {totalSelected}/{COMBO_02_TARGET} chai
                {isComplete ? ' (Đã đủ 10 chai)' : ' (Chưa đủ 10 chai)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {!isComplete && (
              <div className="hidden sm:flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Vui lòng tick chọn đủ 10 chai ({totalSelected}/10 chai)
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!isComplete}
              className={cn(
                'w-full sm:w-auto px-6 sm:px-8 py-3 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md',
                isComplete
                  ? 'bg-gradient-to-r from-emerald-700 to-[#1B4D3E] text-white hover:opacity-95 active:scale-95 cursor-pointer shadow-emerald-700/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              )}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Đã thêm Combo 02 vào giỏ!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  Thêm vào giỏ hàng ({formatPrice(COMBO_02_PRICE)}đ)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENT CHÍNH VỚI TABS CHUYỂN ĐỔI COMBO 01 & 02
// ==========================================
function ComboContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');

  // Mặc định tab dựa trên url param hoặc combo-4-chai
  const [activeTab, setActiveTab] = useState<'combo-01' | 'combo-02'>(() => {
    if (typeParam === 'combo-van-phong' || typeParam === 'combo-02') {
      return 'combo-02';
    }
    return 'combo-01';
  });

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-32 pt-2">
      <div className="section-container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar: Nút quay lại */}
        <div className="flex items-center justify-between py-3 mb-3">
          <Link
            href="/#combo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-green-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </Link>

          <span className="text-xs text-text-muted hidden sm:inline-block">
            Thái Sơn Foods • Thức uống dinh dưỡng tự nhiên
          </span>
        </div>

        {/* TABS CHỌN GIỮA COMBO 01 VÀ COMBO 02 */}
        <div className="flex items-center gap-2 p-1.5 bg-gray-200/80 rounded-2xl max-w-lg mb-8 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('combo-01')}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5',
              activeTab === 'combo-01'
                ? 'bg-white text-[#11241C] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Combo 01 (4 chai)</span>
            <span className="text-[11px] opacity-75 font-normal">69k</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('combo-02')}
            className={cn(
              'flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5',
              activeTab === 'combo-02'
                ? 'bg-[#1B4D3E] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-corn" />
            <span>Combo 02 (10 chai)</span>
            <span className="text-[11px] opacity-85 font-normal">145k</span>
          </button>
        </div>

        {/* HIỂN THỊ NỘI DUNG TƯƠNG ỨNG */}
        {activeTab === 'combo-01' ? <Combo01View /> : <Combo02View />}
      </div>
    </div>
  );
}

export default function ComboSelectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-text-dark">Đang tải tùy chọn Combo...</p>
          </div>
        </div>
      }
    >
      <ComboContent />
    </Suspense>
  );
}
