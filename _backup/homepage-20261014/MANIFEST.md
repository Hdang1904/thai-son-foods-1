# Backup trang chủ — 14/10/2026

Bản sao vật lý giao diện trang chủ Thái Sơn Foods **trước khi** tái thiết kế theo bố cục Amazon.

- **Route trang chủ:** `/` → `src/app/page.tsx` (server component, `force-dynamic`, tải banner/sản phẩm/combo từ PostgreSQL, dự phòng bằng `src/data/*`)
- **Commit gốc:** `18743ff` trên `main`
- **Git tag:** `backup/homepage-pre-amazon` · **Nhánh:** `backup/homepage-pre-amazon`
- **Cấu trúc thư mục:** giữ nguyên đường dẫn so với gốc dự án (`thai-son-foods/`)
- Thư mục này bị loại khỏi TypeScript (`tsconfig.json` → `exclude`) và ESLint (`eslint.config.mjs` → `globalIgnores`), nên không ảnh hưởng build.

## Danh sách file đã backup

| File | Vai trò trên trang chủ |
|---|---|
| `src/app/page.tsx` | Route `/`: hàm tải dữ liệu + bố cục trang chủ cũ |
| `src/app/layout.tsx` | Root layout: font Fira Sans / Roboto / Playfair, metadata, LogoPreloader |
| `src/app/globals.css` | Theme màu TSF (`@theme inline`), `.section-container`, style `hero-swiper`, animation |
| `src/components/layout/AppLayout.tsx` | Khung chung: Header + main + Footer + AuthModal + BranchSelectorModal |
| `src/components/layout/Header.tsx` | Header dùng chung (logo, tìm kiếm, ngôn ngữ, tài khoản, giỏ, taskbag, modal hỗ trợ) |
| `src/components/layout/BranchTopBar.tsx` | Thanh chi nhánh trên cùng của Header |
| `src/components/layout/Footer.tsx` | Footer dùng chung (công ty, sản phẩm, hỗ trợ, mạng xã hội, miễn phí giao hàng) |
| `src/components/layout/LogoPreloader.tsx` | Màn hình chờ logo |
| `src/components/home/HeroSlider.tsx` | Banner hero (Swiper) |
| `src/components/home/ProductSection.tsx` | Lưới "Sản phẩm Thái Sơn" 2×6 (`#san-pham`) |
| `src/components/home/ComboShowcase.tsx` | Lưới "Combo tiết kiệm" 2×6 (`#combo`) |
| `src/components/home/CategorySidebar.tsx` | Sidebar danh mục trái (màn ≥1680px) |
| `src/components/home/StorePromotionSidebar.tsx` | Sidebar 6 huy hiệu combo khuyến mãi phải (màn ≥1680px) |
| `src/components/home/WarehouseSection.tsx` | "Vì sao Thái Sơn Foods được tin chọn?" / Kho-Sỉ (`#kho-si`) |
| `src/components/home/SubscribeSaveSection.tsx` | Giao định kỳ (đang tắt bằng `MEMBERSHIP_CONFIG`) |
| `src/components/home/BrandShowcase.tsx`, `BrandBadge.tsx` | Khối thương hiệu (hiện không gắn vào trang chủ) |
| `src/components/product/ProductCard.tsx` | Thẻ sản phẩm + thêm giỏ |
| `src/components/product/ProductCarousel.tsx` | Dải sản phẩm cuộn ngang |
| `src/components/product/RecentlyViewedProducts.tsx` | "Sản phẩm bạn đã xem gần đây" (localStorage) |
| `src/components/ui/SectionTitle.tsx`, `Badge.tsx`, `Button.tsx` | UI dùng chung |
| `src/components/cart/FloatingCartWidget.tsx` | Widget giỏ nổi |
| `src/components/store/BranchSelectorModal.tsx` | Modal chọn chi nhánh |
| `src/components/auth/AuthModal.tsx` | Modal đăng nhập/đăng ký |
| `src/context/LanguageContext.tsx`, `UserAuthContext.tsx`, `FlyToCartContext.tsx` | Context ngôn ngữ, tài khoản, hiệu ứng bay vào giỏ |
| `src/store/cart.ts`, `src/store/branch.ts` | Zustand: giỏ hàng, chi nhánh |
| `src/data/banners.ts`, `products.ts`, `combos.ts`, `brand-showcase.ts` | Dữ liệu dự phòng khi DB trống/lỗi |
| `src/config/membership.ts`, `src/config/product-detail.ts` | Cờ tính năng liên quan |
| `tsconfig.json`, `eslint.config.mjs` | Cấu hình trước khi thêm loại trừ `_backup` |

**Không sao lưu ở đây:** ảnh trong `public/images/**` (không bị sửa; vẫn còn nguyên trong git và tag `backup/homepage-pre-amazon`).

Cách khôi phục: xem `ROLLBACK.md` ở thư mục gốc dự án.
