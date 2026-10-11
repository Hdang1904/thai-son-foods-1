import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products, getProductBySlug, categories, getProductsByCategory } from '@/data/products';
import { query } from '@/lib/db';
import { Product } from '@/types';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo, { ProductBreadcrumb } from '@/components/product/ProductInfo';
import ProductDescription from '@/components/product/ProductDescription';
import ProductFeatureShowcase from '@/components/product/ProductFeatureShowcase';
import ProductCombosSidebar from '@/components/product/ProductCombosSidebar';
import ProductSection from '@/components/home/ProductSection';
import SubscribeSaveSection from '@/components/home/SubscribeSaveSection';
import ProductReviewsSection from '@/components/product/ProductReviewsSection';
import ProductSponsoredBanner from '@/components/product/ProductSponsoredBanner';
import ProductSidebarSponsoredCard from '@/components/product/ProductSidebarSponsoredCard';
import { ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

/**
 * Lấy dữ liệu sản phẩm mới nhất từ cơ sở dữ liệu PostgreSQL (nếu có cập nhật từ Admin)
 * kết hợp với các tài nguyên mở rộng từ products.ts (hình ảnh gallery, highlights, video)
 */
async function getLiveProduct(slug: string): Promise<Product | undefined> {
  const baseProduct = getProductBySlug(slug);

  try {
    const dbRes = await query(
      `SELECT 
         p.*,
         c.name AS category_name,
         c.slug AS category_slug,
         COALESCE((
           SELECT json_agg(
             json_build_object('id', pv.id, 'name', pv.name, 'quantity', pv.quantity, 'price', pv.price, 'unit', pv.unit)
             ORDER BY pv.quantity ASC
           )
           FROM product_variants pv WHERE pv.product_id = p.id
         ), '[]') AS variants,
         COALESCE((
           SELECT json_agg(
             json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'sortOrder', pi.sort_order, 'isThumbnail', (pi.image_type = 'thumbnail'))
             ORDER BY pi.sort_order ASC
           )
           FROM product_images pi WHERE pi.product_id = p.id AND pi.is_active = true
         ), '[]') AS images
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.slug = $1 OR p.id = $1 OR p.sku = $1 OR p.slug LIKE $1 || '%' OR $1 LIKE p.slug || '%'
       LIMIT 1;`,
      [slug]
    );

    if (dbRes.rows.length > 0) {
      const dbProd = dbRes.rows[0];
      const fallback = baseProduct || products.find((p) => p.sku === dbProd.sku || p.id === dbProd.id) || {
        id: dbProd.id,
        name: dbProd.name,
        slug: dbProd.slug,
        sku: dbProd.sku,
        price: Number(dbProd.price) || 0,
        unit: dbProd.unit || 'lốc',
        categoryId: dbProd.category_id || 'sua-hat',
        thumbnail: dbProd.thumbnail || '/images/products/sua-bap-nep.png',
        images: [{ id: 'img-1', url: dbProd.thumbnail, alt: dbProd.name, sortOrder: 1 }],
        shortDescription: dbProd.short_description || '',
        description: dbProd.description || '',
        isActive: dbProd.is_active ?? true,
        isFeatured: dbProd.is_featured ?? false,
        isBestSeller: dbProd.is_best_seller ?? false,
        isNew: dbProd.is_new ?? false,
        variants: [],
      };

      const activeImages = Array.isArray(dbProd.images) && dbProd.images.length > 0 ? dbProd.images : [];
      const thumbFromImages = activeImages.find((img: any) => img.isThumbnail)?.url || activeImages[0]?.url;
      const finalThumbnail = dbProd.thumbnail || thumbFromImages || fallback.thumbnail;

      return {
        ...fallback,
        name: dbProd.name || fallback.name,
        sku: dbProd.sku || fallback.sku,
        price: Number(dbProd.price) || fallback.price,
        unit: dbProd.unit || fallback.unit,
        shortDescription: dbProd.short_description || fallback.shortDescription,
        description: dbProd.description || fallback.description,
        thumbnail: finalThumbnail,
        images: activeImages.length > 0
          ? activeImages.map((img: any) => ({
            id: img.id,
            url: img.url,
            alt: img.alt || dbProd.name,
            sortOrder: Number(img.sortOrder) || 1,
          }))
          : (fallback.images && fallback.images.length > 0 ? fallback.images : [{ id: 'img-1', url: finalThumbnail, alt: dbProd.name, sortOrder: 1 }]),
        categoryId: (dbProd.category_id ? dbProd.category_id.replace(/^cat-/, '') : fallback.categoryId),
        isFeatured: dbProd.is_featured !== null ? Boolean(dbProd.is_featured) : fallback.isFeatured,
        isNew: dbProd.is_new !== null ? Boolean(dbProd.is_new) : fallback.isNew,
        isBestSeller: dbProd.is_best_seller !== null ? Boolean(dbProd.is_best_seller) : fallback.isBestSeller,
        isActive: dbProd.is_active !== null ? Boolean(dbProd.is_active) : fallback.isActive,
        variants: (Array.isArray(dbProd.variants) && dbProd.variants.length > 0)
          ? dbProd.variants.map((v: any) => ({
            id: v.id || `var-${v.quantity}`,
            name: v.name || `${v.quantity} chai`,
            quantity: Number(v.quantity) || 1,
            price: Number(v.price) || 0,
            unit: v.unit || 'lốc',
            volume: v.volume || `${v.quantity} x ${dbProd.volume || '330ml'}`
          }))
            .sort((a: any, b: any) => a.quantity - b.quantity)
          : [...(fallback.variants || [])].sort((a: any, b: any) => a.quantity - b.quantity),
      };
    }
  } catch (err) {
    console.error('Error fetching live product from DB:', err);
  }

  return baseProduct;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getLiveProduct(slug);

  if (!product || product.isActive === false) {
    return { title: 'Sản phẩm không tìm thấy' };
  }

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: [{ url: product.thumbnail }],
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getLiveProduct(slug);

  if (!product || product.isActive === false) {
    notFound();
  }

  const cleanCatId = (product.categoryId || '').replace(/^cat-/, '');
  const category = categories.find(
    (c) => c.id === cleanCatId || c.id === product.categoryId || c.slug === cleanCatId
  );

  // Nạp danh sách sản phẩm cùng danh mục để hiển thị khu vực gợi ý dưới chân ảnh
  let categoryProducts = getProductsByCategory(cleanCatId);
  if (!categoryProducts || categoryProducts.length === 0) {
    categoryProducts = getProductsByCategory(product.categoryId);
  }
  // Đảm bảo luôn có danh sách gợi ý cho người dùng lựa chọn vị
  if (!categoryProducts || categoryProducts.length <= 1) {
    categoryProducts = products.filter((p) => p.isActive).slice(0, 5);
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.thumbnail,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'VND',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Main Content Area */}
      <div className="w-full">
        {/* Top Bar / Breadcrumb */}
        <ProductBreadcrumb product={product} category={category} />

        {/* Main Product Content Area (3-Column Layout: Gallery Left + Buy Box Center + Sponsored Ad Right) */}
        <div className="max-w-[1456px] mx-auto px-4 sm:px-6 py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Cột trái (Gallery): lg:col-span-5 w-full lg:sticky lg:top-[168px] */}
            <div className="lg:col-span-5 w-full lg:sticky lg:top-[168px]">
              <ProductGallery
                images={product.images}
                productName={product.name}
                imageFit={product.imageFit}
                currentProductId={product.id}
                categoryProducts={categoryProducts}
              />
            </div>

            {/* Cột giữa (Buy Box & Info): lg:col-span-4 xl:col-span-4 space-y-4 */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-4">
              <ProductInfo product={product} />
            </div>

            {/* Cột phải (Góc bên phải chỗ khoanh đỏ - Sponsored Best Seller / Đang Sale): lg:col-span-3 xl:col-span-3 */}
            <div className="hidden lg:block lg:col-span-3 xl:col-span-3 lg:sticky lg:top-[168px]">
              <ProductSidebarSponsoredCard currentProductId={product.id} />
            </div>
          </div>

          {/* Hiển thị dưới ProductInfo khi ở màn hình mobile (< lg) */}
          <div className="block lg:hidden mt-6">
            <ProductSidebarSponsoredCard currentProductId={product.id} />
          </div>
        </div>

        {/* ── 1. CÁC SẢN PHẨM BẠN CÓ THỂ THÍCH & CÁC COMBO NỔI BẬT (Thứ tự 1) ── */}
        <div className="border-t border-gray-200 mt-10 bg-white">
          <ProductSection
            excludeProductId={product.id}
            itemsPerRow={7}
            title="Các sản phẩm bạn có thể thích"
            showViewAll={false}
            className="py-8 sm:py-10 md:py-12"
          />
        </div>

        <div className="border-t border-gray-200 bg-white">
          <div className="section-container max-sm:px-2.5 py-8 sm:py-10 md:py-12 max-w-7xl mx-auto px-4 sm:px-6">
            <ProductCombosSidebar layout="horizontal" title="Các combo nổi bật đáng cân nhắc" />
          </div>
        </div>

        {/* ── 2. MÔ TẢ & CÂU CHUYỆN CHẤT LƯỢNG (Thứ tự 2) ── */}
        <ProductDescription
          productName={product.name}
          description={product.description || product.shortDescription}
        />

        {/* ── 3. VISUAL A+ CONTENT: 2 BANNER XẾP CHỒNG (Thứ tự 3) ── */}
        <ProductFeatureShowcase
          productName={product.name}
          productThumbnail={product.thumbnail}
        />

        {/* ── BANNER SHOWCASE THƯƠNG HIỆU & SẢN PHẨM (CHUẨN AMAZON BRAND SHOWCASE) ── */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <ProductSponsoredBanner product={product} />
          </div>
        </div>

        {/* ĐÁNH GIÁ TỪ KHÁCH HÀNG (SOCIAL PROOF & REVIEWS) — Chuẩn Amazon & Shopee */}
        <div className="border-t border-gray-200 bg-white" id="danh-gia-khach-hang">
          <ProductReviewsSection productId={product.slug || product.id} productName={product.name} />
        </div>

        {/* 1 DÒNG 8 SẢN PHẨM / 8 COMBO GIAO ĐỊNH KỲ (SUBSCRIBE & SAVE) */}
        <div className="border-t border-gray-200 bg-white">
          <SubscribeSaveSection
            title="Đăng Ký Giao Định Kỳ — 8 Sản Phẩm & Combo Tiết Kiệm 15%"
            subtitle="Tự động nhận nước uống tươi ngon mỗi tuần tận nhà. Miễn phí vận chuyển 100%, linh hoạt đổi vị và tạm dừng bất kỳ lúc nào."
          />
        </div>
      </div>
    </div>
  );
}
