import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { combos, getComboBySlug } from '@/data/combos';
import { products } from '@/data/products';
import ComboDetailView from '@/components/product/ComboDetailView';
import ProductCombosSidebar from '@/components/product/ProductCombosSidebar';
import CartStickySidebar from '@/components/cart/CartStickySidebar';
import ScrollBannerShowcase from '@/components/product/ScrollBannerShowcase';
import ProductSection from '@/components/home/ProductSection';

import { query } from '@/lib/db';
import { Combo } from '@/types';

export const dynamic = 'force-dynamic';

interface ComboPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return combos.map((combo) => ({
    slug: combo.slug,
  }));
}

/**
 * Lấy dữ liệu combo mới nhất từ PostgreSQL database
 */
async function getLiveCombo(slug: string): Promise<Combo | undefined> {
  const baseCombo = getComboBySlug(slug);

  try {
    const dbRes = await query(
      `SELECT 
         c.*,
         COALESCE((
           SELECT json_agg(
             json_build_object('product_id', ci.product_id, 'quantity', ci.quantity)
           )
           FROM combo_items ci WHERE ci.combo_id = c.id
         ), '[]') AS items,
         COALESCE((
           SELECT json_agg(
             json_build_object('id', cimg.id, 'url', cimg.url, 'alt', cimg.alt, 'sortOrder', cimg.sort_order, 'isPrimary', cimg.is_primary)
             ORDER BY cimg.sort_order ASC
           )
           FROM combo_images cimg WHERE cimg.combo_id = c.id AND cimg.is_active = true
         ), '[]') AS images
       FROM combos c
       WHERE c.slug = $1 OR c.id = $1
       LIMIT 1;`,
      [slug]
    );

    if (dbRes.rows.length > 0) {
      const dbCombo = dbRes.rows[0];
      const fallback = baseCombo || combos.find((c) => c.id === dbCombo.id || c.slug === dbCombo.slug) || {
        id: dbCombo.id,
        name: dbCombo.name,
        slug: dbCombo.slug,
        originalPrice: Number(dbCombo.original_price) || 0,
        salePrice: Number(dbCombo.sale_price) || 0,
        totalItems: Number(dbCombo.total_items) || 10,
        discount: Number(dbCombo.discount) || 0,
        image: dbCombo.thumbnail || '/images/combos/combo-1.jpg',
        description: dbCombo.description || '',
        products: [],
        isActive: true,
      };

      const activeImages = Array.isArray(dbCombo.images) && dbCombo.images.length > 0 ? dbCombo.images : [];
      const primaryFromImages = activeImages.find((img: any) => img.isPrimary)?.url || activeImages[0]?.url;
      const finalImage = dbCombo.thumbnail || primaryFromImages || fallback.image;

      return {
        ...fallback,
        name: dbCombo.name || fallback.name,
        originalPrice: dbCombo.original_price !== null && dbCombo.original_price !== undefined ? Number(dbCombo.original_price) : fallback.originalPrice,
        salePrice: dbCombo.sale_price !== null && dbCombo.sale_price !== undefined ? Number(dbCombo.sale_price) : fallback.salePrice,
        totalItems: dbCombo.total_items !== null && dbCombo.total_items !== undefined ? Number(dbCombo.total_items) : fallback.totalItems,
        discount: dbCombo.discount !== null && dbCombo.discount !== undefined ? Number(dbCombo.discount) : fallback.discount,
        image: finalImage,
        images: activeImages.map((img: any) => ({
          id: img.id,
          url: img.url,
          alt: img.alt || dbCombo.name,
          sortOrder: Number(img.sortOrder) || 1,
          isPrimary: Boolean(img.isPrimary),
        })),
        description: dbCombo.description || fallback.description,
        products: (Array.isArray(dbCombo.items) && dbCombo.items.length > 0)
          ? dbCombo.items.map((it: any) => ({
              productId: it.product_id,
              quantity: Number(it.quantity) || 1,
            }))
          : fallback.products,
      };
    }
  } catch (err) {
    console.error('Error fetching live combo from DB:', err);
  }

  return baseCombo;
}

export async function generateMetadata({
  params,
}: ComboPageProps): Promise<Metadata> {
  const { slug } = await params;
  const combo = await getLiveCombo(slug);

  if (!combo) {
    return { title: 'Combo không tìm thấy' };
  }

  return {
    title: combo.name,
    description: combo.description,
    openGraph: {
      title: combo.name,
      description: combo.description,
      images: [{ url: combo.image }],
      type: 'website',
    },
  };
}

export default async function ComboDetailPage({ params }: ComboPageProps) {
  const { slug } = await params;
  const combo = await getLiveCombo(slug);

  if (!combo) {
    notFound();
  }

  // Lấy chi tiết từng chai trong combo từ danh sách products chính
  const comboProductsWithDetail = combo.products.map((item) => {
    const matchedProduct = products.find(
      (p) => p.id === item.productId || p.slug === item.productId
    );
    return {
      quantity: item.quantity,
      productId: item.productId,
      product: matchedProduct || null,
    };
  });

  return (
    <div className="bg-white min-h-screen">
      {/* ─── VÙNG 1: CHI TIẾT COMBO & CÁC COMBO KHÁC (KÈM GIỎ HÀNG CUỘN DÍNH BÊN PHẢI) ─── */}
      <div className="flex flex-row relative w-full items-start">
        {/* Cột nội dung chính */}
        <div className="flex-1 min-w-0">
          <ComboDetailView
            combo={combo}
            productsDetail={comboProductsWithDetail}
          />

          {/* Hàng các sản phẩm bạn có thể thích */}
          <div className="border-t border-gray-200 bg-white">
            <ProductSection
              itemsPerRow={7}
              title="Các sản phẩm bạn có thể thích"
              showViewAll={false}
              className="py-6 sm:py-8 lg:py-10"
            />
          </div>

          {/* Các combo nổi bật đáng cân nhắc khác */}
          <div className="border-t border-gray-200 bg-white">
            <div className="section-container max-sm:px-2.5 py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto px-4 sm:px-6">
              <ProductCombosSidebar layout="horizontal" title="Các combo nổi bật đáng cân nhắc" />
            </div>
          </div>
        </div>

        {/* Giỏ hàng cố định cuộn dính bên phải trên desktop lớn */}
        <aside
          aria-label="Giỏ hàng cố định"
          className="hidden min-[1440px]:flex flex-col w-[380px] shrink-0 sticky top-[114px] border-l border-border-light bg-white shadow-xl z-30 overflow-hidden"
          style={{ height: 'calc(100vh - 114px)' }}
        >
          <CartStickySidebar />
        </aside>
      </div>

      {/* ─── VÙNG 2: BANNER TRẢI NGHIỆM CUỘN ĐIỆN ẢNH (SCROLL-DRIVEN) ─── */}
      <div className="w-full border-t border-gray-200">
        <ScrollBannerShowcase />
      </div>
    </div>
  );
}
