/**
 * Kiểm tra render trang chi tiết (bố cục mới) với dữ liệu thiếu: ảnh rỗng, tên rất dài, không có quy cách.
 * Chạy: npx tsx tests/pdp_missing_data_render_test.tsx
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { products } from '@/data/products';
import { Product } from '@/types';
import { getProductImage, getShortProductName, MISSING_PRODUCT_IMAGE } from '@/lib/product-detail';
import ProductCompareTable from '@/components/product/ProductCompareTable';
import ProductBundleSuggestions from '@/components/product/ProductBundleSuggestions';
import ProductDetailTabs from '@/components/product/ProductDetailTabs';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
};

const LONG_NAME = 'Sữa Hạt Thử Nghiệm '.repeat(20).trim();
const broken: Product = {
  ...products[0],
  id: 'test-missing',
  slug: 'test-missing',
  name: LONG_NAME,
  thumbnail: '',
  images: [],
  variants: [],
  description: '',
  shortDescription: '',
};

check('getProductImage("") trả về ảnh dự phòng', getProductImage(broken) === MISSING_PRODUCT_IMAGE);
check('getProductImage("   ") trả về ảnh dự phòng', getProductImage({ thumbnail: '   ' }) === MISSING_PRODUCT_IMAGE);
const short = getShortProductName(broken);
check('Tên dài được rút gọn ≤ 43 ký tự', short.length <= 43, `"${short}" (${short.length})`);

try {
  const html = renderToString(<ProductCompareTable current={broken} others={products.slice(1, 3)} />);
  check('ProductCompareTable render với ảnh rỗng', html.includes(encodeURIComponent(MISSING_PRODUCT_IMAGE)) || html.includes(MISSING_PRODUCT_IMAGE));
} catch (e) {
  check('ProductCompareTable render với ảnh rỗng', false, String(e));
}

try {
  const html = renderToString(<ProductBundleSuggestions currentProduct={broken} />);
  check('ProductBundleSuggestions render với ảnh rỗng & không có quy cách', html.includes('Sản phẩm này'));
} catch (e) {
  check('ProductBundleSuggestions render với ảnh rỗng & không có quy cách', false, String(e));
}

try {
  const html = renderToString(<ProductDetailTabs product={broken} />);
  check('ProductDetailTabs hiển thị trạng thái "đang cập nhật" khi thiếu mô tả', html.includes('đang được cập nhật'));
} catch (e) {
  check('ProductDetailTabs render khi thiếu dữ liệu', false, String(e));
}

console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra đạt');
process.exit(failed ? 1 : 0);
