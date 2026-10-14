import { Banner, Product, Combo } from '@/types';

interface HomePageProps {
  heroBanners: Banner[];
  liveProducts: Product[];
  liveCombos: Combo[];
}

export default function HomePage({ liveProducts }: HomePageProps) {
  return (
    <div data-homepage="amazon" className="section-container py-10">
      <h1>Thái Sơn Foods — trang chủ mới (khung) · {liveProducts.length} sản phẩm</h1>
    </div>
  );
}
