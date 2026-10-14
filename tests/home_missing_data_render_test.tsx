/**
 * Kiểm tra render TRANG CHỦ MỚI (bố cục Amazon) với dữ liệu thiếu:
 * DB rỗng (không banner/sản phẩm/combo), ảnh rỗng, tên rất dài, sản phẩm không có quy cách.
 * Chạy: npx tsx tests/home_missing_data_render_test.tsx
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { products } from '@/data/products';
import { combos } from '@/data/combos';
import { Product, Combo } from '@/types';
import { MISSING_PRODUCT_IMAGE } from '@/lib/product-detail';
import { LanguageProvider } from '@/context/LanguageContext';
import { UserAuthProvider } from '@/context/UserAuthContext';
import { FlyToCartProvider } from '@/context/FlyToCartContext';
import HomePage from '@/components/home/HomePage';
import { HERO_PLACEHOLDER_SLIDES } from '@/data/homepage-placeholders';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
};

const noop = () => {};
const router = { push: noop, replace: noop, refresh: noop, back: noop, forward: noop, prefetch: noop } as any;
const wrap = (el: React.ReactElement) =>
  renderToString(
    <AppRouterContext.Provider value={router}>
      <LanguageProvider>
        <UserAuthProvider>
          <FlyToCartProvider>{el}</FlyToCartProvider>
        </UserAuthProvider>
      </LanguageProvider>
    </AppRouterContext.Provider>
  );

const LONG_NAME = 'Sữa Hạt Thử Nghiệm Tên Rất Dài '.repeat(12).trim();
const brokenProduct: Product = {
  ...products[0],
  id: 'test-missing',
  slug: 'test-missing',
  name: LONG_NAME,
  nameEn: undefined,
  thumbnail: '',
  images: [],
  variants: [],
  description: '',
  shortDescription: '',
};
const brokenCombo: Combo = { ...combos[0], id: 'combo-test', slug: 'combo-test', name: LONG_NAME, image: '', discount: 10 };

// 1. DB rỗng hoàn toàn
try {
  const html = wrap(<HomePage heroBanners={[]} liveProducts={[]} liveCombos={[]} />);
  check('DB rỗng: render không lỗi', html.includes('data-homepage="amazon"'));
  check('DB rỗng: hero dùng slide placeholder', html.includes(encodeURIComponent(HERO_PLACEHOLDER_SLIDES[0].image)) || html.includes(HERO_PLACEHOLDER_SLIDES[0].image));
  check('DB rỗng: không hiện hàng "Sản phẩm Thái Sơn" trống', !html.includes('id="san-pham"'));
  check('DB rỗng: không hiện "Deal trong ngày" khi không có combo', !html.includes('Deal trong ngày'));
  check('DB rỗng: vẫn giữ khối thương hiệu #kho-si', html.includes('id="kho-si"'));
} catch (e) {
  check('DB rỗng: render không lỗi', false, String(e));
}

// 2. Ảnh rỗng + tên dài + không có quy cách
try {
  const html = wrap(
    <HomePage heroBanners={[]} liveProducts={[brokenProduct, ...products.slice(1)]} liveCombos={[brokenCombo, ...combos.slice(1)]} />
  );
  check('Ảnh rỗng: thẻ danh mục dùng ảnh dự phòng', html.includes(encodeURIComponent(MISSING_PRODUCT_IMAGE)) || html.includes(MISSING_PRODUCT_IMAGE));
  check('Tên dài: được giới hạn bằng line-clamp-2', html.includes('line-clamp-2'));
  check('Combo ảnh rỗng: render không lỗi', html.includes('Deal trong ngày'));
  check('Giữ anchor #san-pham, #combo, #kho-si', ['id="san-pham"', 'id="combo"', 'id="kho-si"'].every((s) => html.includes(s)));
  check('Có anchor danh mục #danh-muc-*', html.includes('id="danh-muc-sua-hat"'));
  check('Khối placeholder có nhãn "Bản mẫu"', html.includes('Bản mẫu'));
} catch (e) {
  check('Ảnh rỗng/tên dài: render không lỗi', false, String(e));
}


console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra đạt');
process.exit(failed ? 1 : 0);
