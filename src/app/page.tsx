import HeroSlider from '@/components/home/HeroSlider';
import ProductSection from '@/components/home/ProductSection';
import ComboShowcase from '@/components/home/ComboShowcase';
import WarehouseSection from '@/components/home/WarehouseSection';
import BrandShowcase from '@/components/home/BrandShowcase';

export default function HomePage() {
  return (
    <>
      {/* 1. BANNER — Hero Banner Slider */}
      <HeroSlider />

      {/* 2. SẢN PHẨM — Product Grid */}
      <ProductSection />

      {/* 3. COMBO — Combo Showcase */}
      <ComboShowcase />

      {/* 4. KHO/SỈ/CỬA HÀNG — Warehouse & Wholesale Distribution */}
      <WarehouseSection />

      {/* 5. VỀ CHÚNG TÔI — Brand Story Showcase */}
      <BrandShowcase />
    </>
  );
}
