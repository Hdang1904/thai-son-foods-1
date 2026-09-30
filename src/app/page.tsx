import HeroSlider from '@/components/home/HeroSlider';
import ProductSection from '@/components/home/ProductSection';
import ComboShowcase from '@/components/home/ComboShowcase';
import WarehouseSection from '@/components/home/WarehouseSection';
import CategorySidebar from '@/components/home/CategorySidebar';
import StorePromotionSidebar from '@/components/home/StorePromotionSidebar';

export default function HomePage() {
  return (
    <>
      {/* 
        Khối hiển thị kết hợp Sidebar hai bên:
        - Bên trái: CategorySidebar (Danh mục sản phẩm).
        - Bên phải: StorePromotionSidebar (Animation Khuyến mãi bay bay, Deal sốc cửa hàng).
        - Giới hạn phạm vi cuộn dính (sticky) chỉ từ Banner, Sản phẩm đến hết ComboShowcase.
        - Khi lướt qua hết Combo, sidebar sẽ tự động dừng lại theo đáy container này, 
          hoàn toàn KHÔNG bị đè lên phần Kho xưởng (WarehouseSection) phía dưới.
      */}
      <div className="relative">
        {/* Sidebar bên trái: Danh mục sản phẩm */}
        <aside
          aria-label="Danh mục sản phẩm"
          className="hidden min-[1680px]:block absolute left-2 min-[1800px]:left-6 top-1 bottom-0 w-[210px] min-[1800px]:w-[240px] pointer-events-none z-20"
        >
          <div
            className="sticky top-[138px] max-h-[calc(100vh-160px)] overflow-y-auto pointer-events-auto pr-1 pb-8 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <CategorySidebar />
          </div>
        </aside>

        {/* Sidebar bên phải: Animation Khuyến Mãi Bay Bay & Deal Sốc Cửa Hàng */}
        <aside
          aria-label="Khuyến mãi & Deal Sốc Cửa Hàng"
          className="hidden min-[1680px]:block absolute right-2 min-[1800px]:right-6 top-1 bottom-0 w-[210px] min-[1800px]:w-[240px] pointer-events-none z-20"
        >
          <div
            className="sticky top-[160px] max-h-[calc(100vh-180px)] overflow-y-auto pointer-events-auto pl-1 pr-1 pt-3 pb-8 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <StorePromotionSidebar />
          </div>
        </aside>

        {/* 1. BANNER — Hero Banner Slider (Bố cục gốc giữ nguyên 100%, căn giữa section-container) */}
        <HeroSlider />

        {/* 2. SẢN PHẨM — Product Grid (2 hàng x 6 sản phẩm nhỏ gọn) */}
        <ProductSection />

        {/* 3. COMBO — Combo Showcase */}
        <ComboShowcase />
      </div>

      {/* 4. KHO/SỈ/CỬA HÀNG — Warehouse & Wholesale Distribution (Tách biệt ngoài container, sidebar không bao giờ lọt xuống đây) */}
      <WarehouseSection />
    </>
  );
}

