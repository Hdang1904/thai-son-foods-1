import HeroSlider from '@/components/home/HeroSlider';
import ProductSection from '@/components/home/ProductSection';
import ComboShowcase from '@/components/home/ComboShowcase';
import WarehouseSection from '@/components/home/WarehouseSection';
import CategorySidebar from '@/components/home/CategorySidebar';
import StorePromotionSidebar from '@/components/home/StorePromotionSidebar';

import { query } from '@/lib/db';
import { Banner } from '@/types';
import { banners as defaultBanners } from '@/data/banners';

export const dynamic = 'force-dynamic';

async function getHeroBanners(): Promise<Banner[]> {
  try {
    const res = await query(
      `SELECT * FROM banners WHERE placement = 'hero' AND is_active = true ORDER BY sort_order ASC`
    );
    if (res.rows.length > 0) {
      return res.rows.map((r: any) => ({
        id: r.id,
        title: r.title || '',
        titleEn: r.title_en || '',
        subtitle: r.subtitle || '',
        subtitleEn: r.subtitle_en || '',
        image: r.image,
        link: r.link || '',
        alt: r.alt || r.title || 'Thái Sơn Foods',
        sortOrder: Number(r.sort_order) || 1,
        isActive: Boolean(r.is_active),
      }));
    }
  } catch (err) {
    console.error('Error fetching live hero banners:', err);
  }
  return defaultBanners;
}

export default async function HomePage() {
  const heroBanners = await getHeroBanners();
  return (
    <>
      <h1 className="sr-only">Thái Sơn Foods — Thức uống tự nhiên từ nguyên liệu chọn lọc</h1>
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
        <HeroSlider banners={heroBanners} />

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

