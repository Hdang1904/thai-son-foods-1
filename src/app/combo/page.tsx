'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
} from 'lucide-react';
import { products } from '@/data/products';
import { formatPrice, cn } from '@/lib/utils';
import { useCartStore } from '@/store/cart';

const COMBO_TARGET_ITEMS = 4;
const COMBO_PRICE = 69000;

// Mô tả súc tích cho từng sản phẩm theo đúng phong cách Stitch
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

export default function ComboSelectionPage() {
  // Khởi tạo mặc định 2 chai để khách thấy ngay khay chọn như thiết kế Stitch
  const [selectedBottles, setSelectedBottles] = useState<Record<string, number>>({
    'sua-bap-nep': 1,
    'nha-dam-mu-trom': 1,
  });
  const [justAdded, setJustAdded] = useState(false);

  // 12 sản phẩm đang hoạt động trên website
  const availableProducts = useMemo(() => {
    return products.filter((p) => p.isActive);
  }, []);

  // Tổng số chai đã chọn
  const totalSelected = useMemo(() => {
    return Object.values(selectedBottles).reduce((sum, qty) => sum + qty, 0);
  }, [selectedBottles]);

  // Tổng giá bán lẻ niêm yết của các chai đã chọn
  const originalMarketPrice = useMemo(() => {
    const sum = Object.entries(selectedBottles).reduce((acc, [id, qty]) => {
      const prod = availableProducts.find((p) => p.id === id);
      return acc + (prod ? prod.price * qty : 18000 * qty);
    }, 0);
    return Math.max(72000, sum);
  }, [selectedBottles, availableProducts]);

  const savings = Math.max(3000, originalMarketPrice - COMBO_PRICE);
  const percentComplete = Math.min(100, Math.round((totalSelected / COMBO_TARGET_ITEMS) * 100));

  // Chuyển đổi danh sách đã chọn thành mảng 4 vị trí khay (Slots)
  const selectedSlots = useMemo(() => {
    const slots: (typeof availableProducts[0] | null)[] = [];
    for (const [id, qty] of Object.entries(selectedBottles)) {
      const prod = availableProducts.find((p) => p.id === id);
      if (prod) {
        for (let i = 0; i < qty; i++) {
          if (slots.length < COMBO_TARGET_ITEMS) {
            slots.push(prod);
          }
        }
      }
    }
    while (slots.length < COMBO_TARGET_ITEMS) {
      slots.push(null);
    }
    return slots;
  }, [selectedBottles, availableProducts]);

  // Tăng số lượng
  const handleIncrease = (productId: string) => {
    if (totalSelected >= COMBO_TARGET_ITEMS) return;
    setSelectedBottles((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  // Giảm số lượng
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

  // Xóa toàn bộ
  const handleClearAll = () => {
    setSelectedBottles({});
  };

  // Thêm combo vào giỏ hàng
  const handleAddToCart = () => {
    if (totalSelected !== COMBO_TARGET_ITEMS) return;

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
      slug: '/combo',
      price: COMBO_PRICE,
      unit: `4 chai: ${summaryText}`,
      thumbnail: '/images/banners/combo-05.png',
    });

    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] pb-32 pt-2">
      <div className="section-container max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top bar: Nút quay lại & Badge số chai */}
        <div className="flex items-center justify-between py-3 mb-2">
          <Link
            href="/#combo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-green-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            ĐÃ CHỌN: {totalSelected}/{COMBO_TARGET_ITEMS} CHAI
          </span>
        </div>

        {/* Header: Tiêu đề & Giá bán */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 pb-2">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#11241C] font-heading tracking-tight">
              Chọn 4 chai cho Combo
            </h1>
            <p className="text-text-muted text-sm md:text-[15px] mt-1">
              Chọn 4 chai bất kỳ trong 12 thức uống thanh mát bên dưới — Giá trọn gói chỉ{' '}
              <strong className="text-text-dark font-bold">{formatPrice(COMBO_PRICE)}đ</strong>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-black text-[#11241C] font-heading">
                {formatPrice(COMBO_PRICE)}đ
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

        {/* KHAY 4 CHAI ĐÃ CHỌN (TRAY SLOTS & PROGRESS) — THEO ĐÚNG THIẾT KẾ STITCH */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-4 sm:p-6 shadow-xs mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* 4 Khay chai bên trái */}
            <div className="lg:col-span-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {selectedSlots.map((product, index) => {
                  if (product) {
                    return (
                      <div
                        key={`slot-${index}-${product.id}`}
                        className="relative rounded-2xl border-2 border-[#1B4D3E] bg-[#FAF8F5] p-3 flex flex-col items-center justify-between text-center min-h-[145px] shadow-xs group transition-all"
                      >
                        {/* Huy hiệu số thứ tự 1, 2, 3, 4 */}
                        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#1B4D3E] text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                          {index + 1}
                        </span>

                        {/* Nút xóa chai khỏi khay */}
                        <button
                          type="button"
                          onClick={() => handleDecrease(product.id)}
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center border border-gray-200 transition-colors cursor-pointer shadow-2xs"
                          title={`Bỏ ${product.name}`}
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Ảnh chai */}
                        <div className="relative w-14 h-14 md:w-16 md:h-16 my-1">
                          <Image
                            src={product.thumbnail}
                            alt={product.name}
                            fill
                            className="object-cover rounded-lg"
                            sizes="64px"
                          />
                        </div>

                        {/* Tên chai */}
                        <span className="text-xs font-bold text-text-dark truncate w-full px-1">
                          {product.name.replace('Thái Sơn', '').replace('Mekong Xanh', '').trim()}
                        </span>
                      </div>
                    );
                  }

                  // Khay trống chưa chọn
                  return (
                    <div
                      key={`slot-empty-${index}`}
                      className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 p-3 flex flex-col items-center justify-center text-center min-h-[145px]"
                    >
                      <div className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-400 flex items-center justify-center mb-1.5 shadow-2xs">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-medium text-gray-500">
                        Chai {index + 1}
                      </span>
                      <span className="text-[11px] text-gray-400">Trống</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thanh tiến độ & Thông báo bên phải */}
            <div className="lg:col-span-4 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
              <div className="flex items-center justify-between text-xs font-bold text-text-dark mb-2">
                <span>Tiến độ lựa chọn</span>
                <span>
                  {totalSelected}/{COMBO_TARGET_ITEMS} chai ({percentComplete}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-[#1B4D3E] transition-all duration-300 rounded-full"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>

              {/* Lời nhắn tiến độ */}
              <div className="text-xs flex items-center gap-1.5 text-gray-600">
                {totalSelected < COMBO_TARGET_ITEMS ? (
                  <>
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                      !
                    </span>
                    <span>
                      Vui lòng chọn thêm{' '}
                      <strong className="text-amber-700 font-bold">
                        {COMBO_TARGET_ITEMS - totalSelected} chai nữa
                      </strong>{' '}
                      để hoàn tất combo ưu đãi!
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-bold">
                      Đã chọn đủ 4 chai! Bạn có thể thêm vào giỏ hàng ngay.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* LƯỚI 12 SẢN PHẨM TRÊN WEBSITE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-10">
          {availableProducts.map((product) => {
            const currentQty = selectedBottles[product.id] || 0;
            const canIncrease = totalSelected < COMBO_TARGET_ITEMS;
            const subtitle =
              PRODUCT_SUBTITLES[product.id] || '330ml • Thức uống tươi ngon tự nhiên';

            return (
              <div
                key={product.id}
                className={cn(
                  'relative bg-white rounded-3xl border p-4 flex flex-col justify-between transition-all duration-200 group',
                  currentQty > 0
                    ? 'border-2 border-[#1B4D3E] shadow-md ring-2 ring-[#1B4D3E]/10'
                    : 'border-gray-200/90 hover:border-gray-300 hover:shadow-sm'
                )}
              >
                <div>
                  {/* Hàng badge trên cùng của card */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E53935] text-white shadow-2xs">
                      Uống một bữa ăn ngon lành
                    </span>

                    {currentQty > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#1B4D3E] text-white flex items-center gap-1 shadow-2xs">
                        Đã chọn: {currentQty}
                      </span>
                    )}
                  </div>

                  {/* Ảnh sản phẩm chuẩn 4:3 */}
                  <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#F2EFE9] mb-3 border border-gray-100/80 flex items-center justify-center p-2">
                    <Image
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Tên sản phẩm */}
                  <h3 className="font-bold text-[#11241C] text-sm md:text-[15px] line-clamp-1 mb-1">
                    {product.name}
                  </h3>

                  {/* Mô tả súc tích theo Stitch */}
                  <p className="text-xs text-text-muted line-clamp-1 mb-1">
                    {subtitle}
                  </p>

                  {/* Giá bán lẻ gạch mờ */}
                  <p className="text-[11px] text-gray-400 line-through mb-3">
                    {formatPrice(product.price)}đ / chai lẻ
                  </p>
                </div>

                {/* Bộ nút Stepper [-] [số lượng] [+] */}
                <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      currentQty > 0 ? 'text-[#1B4D3E]' : 'text-gray-400'
                    )}
                  >
                    {currentQty > 0 ? 'Số lượng:' : 'Chưa chọn'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDecrease(product.id)}
                      disabled={currentQty === 0}
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                        currentQty > 0
                          ? 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 cursor-pointer shadow-2xs active:scale-95'
                          : 'bg-gray-50 border border-gray-200 text-gray-300 cursor-not-allowed'
                      )}
                      aria-label={`Giảm ${product.name}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <span
                      className={cn(
                        'w-6 text-center font-bold text-sm',
                        currentQty > 0 ? 'text-[#1B4D3E]' : 'text-gray-400'
                      )}
                    >
                      {currentQty}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleIncrease(product.id)}
                      disabled={!canIncrease}
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center transition-all',
                        canIncrease
                          ? 'bg-[#1B4D3E] text-white hover:bg-[#153D31] cursor-pointer shadow-2xs active:scale-95'
                          : 'bg-gray-100 border border-gray-200 text-gray-300 cursor-not-allowed'
                      )}
                      aria-label={`Tăng ${product.name}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* THANH ĐẶT HÀNG CỐ ĐỊNH CHÂN TRANG (STICKY BOTTOM BAR) — CHUẨN STITCH */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 py-3.5 px-4 shadow-xl">
        <div className="section-container max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          {/* Bên trái: Tổng tiền & Badge tiết kiệm */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Tổng thanh toán (Combo):
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-black text-[#11241C] font-heading">
                  {formatPrice(COMBO_PRICE)}đ
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Tiết kiệm {formatPrice(savings)}đ
                </span>
              </div>
            </div>

            {/* Chips các chai đang chọn (hiển thị trên màn hình vừa và lớn) */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto max-w-md pl-4">
              {Object.entries(selectedBottles).filter(([_, qty]) => qty > 0).length > 0 && (
                <>
                  {Object.entries(selectedBottles)
                    .filter(([_, qty]) => qty > 0)
                    .map(([id, qty]) => {
                      const prod = availableProducts.find((p) => p.id === id);
                      const name = prod
                        ? prod.name.replace('Thái Sơn', '').replace('Mekong Xanh', '').trim()
                        : id;
                      return (
                        <span
                          key={id}
                          className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium shrink-0 flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {name} ({qty})
                        </span>
                      );
                    })}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-gray-400 hover:text-red-500 ml-1 underline cursor-pointer shrink-0"
                  >
                    Xóa tất cả
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bên phải: Nút trợ giúp số lượng & Nút Thêm vào giỏ */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {totalSelected < COMBO_TARGET_ITEMS && (
              <div className="hidden sm:flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Chọn thêm {COMBO_TARGET_ITEMS - totalSelected} chai để hoàn tất Combo
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={totalSelected !== COMBO_TARGET_ITEMS}
              className={cn(
                'w-full md:w-auto px-6 md:px-8 py-3 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all shadow-md',
                totalSelected === COMBO_TARGET_ITEMS
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
                  Thêm vào giỏ hàng ({formatPrice(COMBO_PRICE)}đ)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING TOAST THÔNG BÁO TIẾN ĐỘ CHỌN CHAI (GÓC DƯỚI BÊN PHẢI NHƯ HÌNH STITCH) */}
      <div className="fixed bottom-24 right-4 z-30 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md border border-emerald-200/90 rounded-2xl p-3 shadow-lg max-w-sm">
        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-text-dark">
            Đang chọn: {totalSelected} chai
          </p>
          <p className="text-[11px] text-text-muted truncate">
            {Object.entries(selectedBottles)
              .filter(([_, qty]) => qty > 0)
              .map(([id, qty]) => {
                const prod = availableProducts.find((p) => p.id === id);
                return `${prod ? prod.name.replace('Thái Sơn', '').replace('Mekong Xanh', '').trim() : id} (${qty})`;
              })
              .join(', ') || 'Chưa chọn chai nào'}
            {totalSelected < COMBO_TARGET_ITEMS &&
              ` • Vui lòng chọn thêm ${COMBO_TARGET_ITEMS - totalSelected} chai`}
          </p>
        </div>
      </div>
    </div>
  );
}
