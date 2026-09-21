import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { products, getProductBySlug, categories } from '@/data/products';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductSection from '@/components/home/ProductSection';
import { ChevronRight, MapPin } from 'lucide-react';

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

      {/* Main Product Content Area (2-Column Layout like cailonuong: 624.75px Gallery + Info) */}
      <div className="section-container py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Column 1: Left Gallery (Exact 624.75px card like cailonuong) */}
          <div className="lg:col-span-6 xl:col-span-6 sticky top-20 flex justify-center">
            <ProductGallery images={product.images} productName={product.name} imageFit={product.imageFit} />
          </div>

          {/* Column 2: Right Info & Buy Box */}
          <div className="lg:col-span-6 xl:col-span-6">
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
