'use client';

import { products } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import SectionTitle from '@/components/ui/SectionTitle';
import { motion } from 'framer-motion';

export default function ProductSection() {
  // Mô hình 3 / 2 / 3 / 2 / 2 cho 12 sản phẩm Thái Sơn
  // Tất cả các hàng 2 sản phẩm và 3 sản phẩm đều dùng layout 'vertical' chuẩn đồng bộ
  const rows = [
    { count: 3, items: products.slice(0, 3), layout: 'vertical' as const },
    { count: 2, items: products.slice(3, 5), layout: 'vertical' as const },
    { count: 3, items: products.slice(5, 8), layout: 'vertical' as const },
    { count: 2, items: products.slice(8, 10), layout: 'vertical' as const },
    { count: 2, items: products.slice(10, 12), layout: 'vertical' as const },
  ];

  return (
    <section id="san-pham" className="section-container py-10 md:py-16">
      <SectionTitle
        title="Sản phẩm Thái Sơn"
        viewAllLink="/san-pham"
        viewAllText="Xem tất cả"
      />

      <div className="space-y-6 md:space-y-8 w-full">
        {rows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`grid grid-cols-1 ${
              row.count === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'
            } gap-4 md:gap-5 lg:gap-6 w-full`}
          >
            {row.items.map((product, pIdx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.55,
                  ease: 'easeOut',
                  delay: pIdx * 0.08,
                }}
                className="h-full"
              >
                <ProductCard
                  product={product}
                  layout={row.layout}
                />
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
