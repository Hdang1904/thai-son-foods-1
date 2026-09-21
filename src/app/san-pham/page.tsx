'use client';

import { useState, useMemo } from 'react';
import { products, categories } from '@/data/products';
import ProductCard from '@/components/product/ProductCard';
import { Search, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === 'all' || product.categoryId === selectedCategory;
        const matchesSearch =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'bestseller') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        return 0;
      });
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div className="section-container py-6 md:py-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-sm text-text-muted">
          <li>
            <Link href="/" className="hover:text-green-primary transition-colors">
              Trang chủ
            </Link>
          </li>
          <li>/</li>
          <li className="text-text-dark font-medium">Tất cả sản phẩm</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-text-dark font-heading mb-3">
          Tất cả sản phẩm Thái Sơn Foods
        </h1>
        <p className="text-text-muted max-w-2xl text-sm md:text-base">
          Các dòng thức uống dinh dưỡng, đóng chai tự nhiên từ nguồn nguyên liệu chọn lọc kỹ lưỡng, an toàn cho sức khỏe cả gia đình.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-border-light mb-8 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Tìm kiếm thức uống..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-ivory/40 text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-text-muted" />
            <span className="text-xs md:text-sm text-text-muted font-medium">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2.5 px-3 rounded-xl border border-border bg-white text-text-dark text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary font-medium cursor-pointer"
            >
              <option value="default">Mặc định</option>
              <option value="bestseller">Bán chạy nhất</option>
              <option value="price-asc">Giá: Thấp đến cao</option>
              <option value="price-desc">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border-light">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-green-primary text-white shadow-sm'
                : 'bg-ivory text-text-body hover:bg-ivory-dark'
            }`}
          >
            Tất cả ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-green-primary text-white shadow-sm'
                    : 'bg-ivory text-text-body hover:bg-ivory-dark'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-border-light">
          <p className="text-base text-text-body font-medium mb-2">
            Không tìm thấy sản phẩm nào phù hợp
          </p>
          <p className="text-sm text-text-muted mb-5">
            Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bộ lọc
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-6 py-2.5 bg-green-primary text-white text-sm font-semibold rounded-xl hover:bg-green-dark transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
