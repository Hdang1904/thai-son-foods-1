# ROLLBACK — Trang chủ bố cục Amazon

Có 3 cách quay về trang chủ cũ. Tất cả lệnh chạy trong thư mục `thai-son-foods/` (Git Bash).

| Mốc | Giá trị |
|---|---|
| Git tag | `backup/homepage-pre-amazon` (commit `18743ff`) |
| Nhánh backup | `backup/homepage-pre-amazon` |
| Nhánh làm việc | `feat/homepage-amazon-layout` |
| Thư mục backup | `_backup/homepage-20261014/` (xem `MANIFEST.md` bên trong) |
| Cờ cấu hình | `src/config/homepage.ts` → `DEFAULT_USE_AMAZON_HOMEPAGE`, hoặc biến môi trường `NEXT_PUBLIC_USE_AMAZON_HOMEPAGE` |

---

## (a) Đổi cờ cấu hình — nhanh nhất, không mất code mới

Khi cờ tắt: `/` hiển thị `HomePageLegacy` cùng `Header`/`Footer` gốc, y như trước. Các trang khác không bị ảnh hưởng.

**Cách 1 — sửa 1 dòng trong code**, file `src/config/homepage.ts`:

```ts
const DEFAULT_USE_AMAZON_HOMEPAGE = false; // true = trang mới, false = trang cũ
```

```bash
git add src/config/homepage.ts
git commit -m "chore: tắt trang chủ bố cục Amazon"
git push upstream main   # Vercel tự deploy (xem DEPLOY.md / memory deploy)
```

**Cách 2 — không sửa code, dùng biến môi trường** (ưu tiên hơn giá trị trong file):

- Local: `NEXT_PUBLIC_USE_AMAZON_HOMEPAGE=false npm run build && npm start`
- Vercel: Project → Settings → Environment Variables → `NEXT_PUBLIC_USE_AMAZON_HOMEPAGE` = `false` → **Redeploy**. Biến `NEXT_PUBLIC_*` được nhúng lúc build, nên bắt buộc phải redeploy.

## (b) Dùng git

Khôi phục riêng các file trang chủ về bản trước redesign, giữ các thay đổi khác:

```bash
git checkout tags/backup/homepage-pre-amazon -- src/app/page.tsx src/components/layout/AppLayout.tsx tsconfig.json eslint.config.mjs
git commit -m "revert: khôi phục trang chủ cũ từ tag backup/homepage-pre-amazon"
```

Các file mới thêm (`HomePage.tsx`, `HeaderAmazon.tsx`, `FooterAmazon.tsx`, `src/components/home/amazon/*`, `src/data/homepage-placeholders.ts`, `src/config/homepage.ts`, `HomePageLegacy.tsx`) sẽ không còn được dùng tới. Có thể để nguyên hoặc xóa.

Bỏ hẳn nhánh redesign:

```bash
git checkout main                     # main chưa merge nhánh redesign thì không cần làm gì thêm
# nếu đã merge vào main:
git revert -m 1 <merge-commit-sha>    # tạo commit đảo ngược, an toàn khi đã push
```

Xem nhanh bản cũ ở chế độ chỉ đọc: `git checkout tags/backup/homepage-pre-amazon` (về lại bằng `git checkout feat/homepage-amazon-layout`).

## (c) Khôi phục từ thư mục `_backup/homepage-20261014/`

Dùng khi không có git (ví dụ máy khác chỉ có mã nguồn). Bản sao giữ nguyên đường dẫn:

```bash
cp _backup/homepage-20261014/src/app/page.tsx                    src/app/page.tsx
cp _backup/homepage-20261014/src/components/layout/AppLayout.tsx src/components/layout/AppLayout.tsx
cp _backup/homepage-20261014/tsconfig.json                       tsconfig.json
cp _backup/homepage-20261014/eslint.config.mjs                   eslint.config.mjs
```

Khôi phục toàn bộ mọi file đã sao lưu (ghi đè):

```bash
cp -r _backup/homepage-20261014/src/. src/
```

**Lưu ý:** `tsconfig.json` bản cũ không loại trừ `_backup`. Sau khi chép lại, hãy xóa hoặc chuyển thư mục `_backup` ra ngoài dự án trước khi build.

## Kiểm tra sau khi rollback

```bash
npm run build && npm start
# mở http://localhost:3000/ → phải thấy: banner, "Sản phẩm Thái Sơn" (2×6), "Combo tiết kiệm" (2×6),
# khối "Vì sao Thái Sơn Foods được tin chọn?", Header có thanh "Đang xem hàng tại", Footer xanh 3 cột.
```
> Tag và nhánh trùng tên `backup/homepage-pre-amazon` → dùng `tags/backup/homepage-pre-amazon` (tag) hoặc `heads/backup/homepage-pre-amazon` (nhánh) để git không báo "ambiguous".
