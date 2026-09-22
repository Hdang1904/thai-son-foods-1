import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { products, getProductBySlug, categories, getProductsByCategory } from '@/data/products';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductCombosSidebar from '@/components/product/ProductCombosSidebar';
import ProductSection from '@/components/home/ProductSection';
import { ChevronRight } from 'lucide-react';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return { title: 'Sản phẩm không tìm thấy' };
  }

  return {
    title: `${product.name} | Thái Sơn Foods`,
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
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const category = categories.find((c) => c.id === product.categoryId);
  const categoryProducts = getProductsByCategory(product.categoryId);

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

      {/* Top Bar / Breadcrumb */}
      <div className="border-b border-gray-100 bg-[#F7F8F8] py-2.5 text-xs">
        <div className="section-container">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-gray-500 flex-wrap">
              <li>
                <a href="/" className="hover:text-green-primary transition-colors font-medium">
                  Trang chủ
                </a>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" /></li>
              <li>
                <a href="/#san-pham" className="hover:text-green-primary transition-colors font-medium">
                  {category ? category.name : 'Sản phẩm dinh dưỡng'}
                </a>
              </li>
              <li><ChevronRight className="w-3.5 h-3.5 text-gray-400 inline" /></li>
              <li className="text-gray-900 font-semibold truncate max-w-[240px] sm:max-w-md">
                {product.name}
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Product Content Area (3-Column Layout: Combo Left + Gallery & Category Middle + Buy Box Right) */}
      <div className="section-container py-6 lg:py-8 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-7 items-start">
          {/* Cột 1: Combo bên tay trái đầy đủ thông tin để chọn */}
          <div className="order-3 lg:order-1 lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <ProductCombosSidebar />
            </div>
          </div>

          {/* Cột 2: Ảnh sản phẩm chính + Dưới chân là chọn sản phẩm cùng danh mục */}
          <div className="order-1 lg:order-2 lg:col-span-5 flex justify-center">
            <div className="w-full lg:sticky lg:top-24">
              <ProductGallery
                images={product.images}
                productName={product.name}
                imageFit={product.imageFit}
                currentProductId={product.id}
                categoryProducts={categoryProducts}
              />
            </div>
          </div>

          {/* Cột 3: Buy Box Thông tin sản phẩm & Mua hàng */}
          <div className="order-2 lg:order-3 lg:col-span-4">
            <ProductInfo product={product} />
          </div>
        </div>
      </div>

      {/* Related / Other Products Section */}
      <div className="border-t border-gray-200 mt-12 bg-ivory/50">
        <ProductSection />
      </div>
    </div>
  );
}
