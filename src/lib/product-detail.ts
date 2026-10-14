import { Product, ProductVariant } from '@/types';
import { getProductDetailContent } from '@/data/product-detail-content';

/**
 * Logic tính toán thuần (không phụ thuộc React) cho trang chi tiết sản phẩm.
 * Giá luôn lấy từ bảng giá của từng quy cách (variant.price) — không suy ra theo công thức.
 */

export function sortVariants(variants?: ProductVariant[]): ProductVariant[] {
  return [...(variants || [])].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
}

/** Tên quy cách hiển thị: "Lốc 7 chai", "Thùng 12 chai" */
export function getVariantLabel(variant: ProductVariant, language: string = 'vi'): string {
  const qty = variant.quantity || 1;
  const unit = (variant.unit || '').toLowerCase();
  if (language === 'en') {
    return unit === 'thùng' ? `Carton of ${qty}` : `Pack of ${qty}`;
  }
  const unitLabel = unit === 'thùng' ? 'Thùng' : unit === 'lốc' ? 'Lốc' : '';
  return unitLabel ? `${unitLabel} ${variant.name}` : variant.name;
}

/** Dung tích một chai, ưu tiên quy cách ("7 x 270ml") vì một số sản phẩm có volume chung chưa đồng bộ */
export function getBottleVolume(product: Product, variant?: ProductVariant): string {
  const fromVariant = variant?.volume?.includes('x') ? variant.volume.split('x').pop()?.trim() : undefined;
  return fromVariant || product.volume || '';
}

export function getUnitPrice(variant: ProductVariant): number {
  return Math.round(variant.price / Math.max(1, variant.quantity || 1));
}

/**
 * Giá gốc của quy cách: CHỈ khi sản phẩm có originalPrice (giá gốc / chai) hợp lệ.
 * Không tự tạo phần trăm giảm giá.
 */
export function getVariantOriginalPrice(product: Product, variant: ProductVariant): number | null {
  if (!product.originalPrice || product.originalPrice <= product.price) return null;
  const original = product.originalPrice * Math.max(1, variant.quantity || 1);
  return original > variant.price ? original : null;
}

export function getShortProductName(product: Product, language: string = 'vi'): string {
  if (language === 'en' && product.nameEn) {
    return product.nameEn.split(',')[0].trim();
  }
  const mapped = getProductDetailContent(product).shortName;
  if (mapped) return mapped;
  const firstPart = product.name.split(/\s[-–]\s|[,.]/)[0].trim();
  return firstPart.length > 42 ? `${firstPart.slice(0, 40)}…` : firstPart;
}

/** Sản phẩm cùng danh mục (để chọn hương vị khác) — giữ thứ tự danh mục gốc */
export function getSiblingProducts(product: Product, allProducts: Product[]): Product[] {
  const catId = (product.categoryId || '').replace(/^cat-/, '');
  return allProducts.filter((p) => p.isActive && p.categoryId === catId);
}

/** Sản phẩm tương tự: cùng danh mục trước, sau đó các danh mục khác. Loại trừ sản phẩm hiện tại */
export function getSimilarProducts(product: Product, allProducts: Product[], limit = 12): Product[] {
  const catId = (product.categoryId || '').replace(/^cat-/, '');
  const others = allProducts.filter(
    (p) => p.isActive && p.id !== product.id && p.slug !== product.slug
  );
  const sameCategory = others.filter((p) => p.categoryId === catId);
  const rest = others.filter((p) => p.categoryId !== catId);
  return [...sameCategory, ...rest].slice(0, limit);
}

export function isSameProduct(a: Pick<Product, 'id' | 'slug'>, b: Pick<Product, 'id' | 'slug'>): boolean {
  return a.id === b.id || a.slug === b.slug;
}
