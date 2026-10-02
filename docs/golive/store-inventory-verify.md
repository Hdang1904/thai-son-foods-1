# BÁO CÁO XÁC MINH TOÀN DIỆN: LUỒNG CHỌN CỬA HÀNG VÀ TỒN KHO
**Dự án:** Thái Sơn Foods E-Commerce  
**Ngày thực hiện:** 02/10/2026  
**Trạng thái:** Hoàn thành kiểm toán & Viết test tái hiện (Chưa can thiệp sửa code ứng dụng)  
**Tài liệu tham chiếu:** [AGENTS.md](file:///d:/WebTSF/AGENTS.md), [GOLIVE.md](file:///d:/WebTSF/GOLIVE.md)

---

## TỔNG QUAN KẾT QUẢ KIỂM TOÁN (EXECUTIVE SUMMARY)

Báo cáo này cung cấp kết quả điều tra độc lập, toàn diện về 7 trọng điểm của luồng **Chọn cửa hàng (Store Selection)** và **Quản lý tồn kho (Inventory Management)** theo yêu cầu chuẩn bị Go-Live:

| STT | Trọng Điểm Kiểm Toán | Tình Trạng Hiện Tại | Rủi Ro Go-Live |
| :---: | :--- | :---: | :---: |
| **1** | Hạn giữ chỗ (`RESERVATION_EXPIRY_HOURS`), Cron Cleanup & Trừ kho | **24 giờ** (Cấu hình chuẩn & Có Cleanup kép) | Thấp (Cần đồng bộ hardcode 24h) |
| **2** | Regex `extractBottleMultiplier` & Danh sách biến thể | **Có điểm mù Regex** & Lệch 3 variant giữa DB vs Code | **Trung bình - Cao** (Combo/lốc có thể tính sai số chai) |
| **3** | Checkout tự động đè cửa hàng khách đã chọn | **XÁC NHẬN CÓ BUG** (Đè cửa hàng tại `thanh-toan/page.tsx:382`) | **Nghiêm trọng** (Gây trải nghiệm xấu & chặn đơn oan) |
| **4** | Transfer trong 1 Transaction & Khi kho B thiếu hàng | **Có Transaction**, nhưng **BUG LỌT TỒN KHO** tại dòng 84 | **Rất nghiêm trọng** (Kho B thiếu hàng vẫn chuyển thành công) |
| **5** | Rà soát các trang còn đọc `products.stock_quantity` | **Đã phân lập**: Khách hàng không đọc; Cột này là tổng kho đồng bộ | Thấp (Đã chuyển sang `store_inventory`) |
| **6** | Phân loại 38 bản ghi trong bảng `stores` | **25 Retail thật / 3 Kho xưởng / 5 Cửa hàng cũ / 5 Test Admin** | Thấp (Đã định danh và phân loại rõ ràng) |
| **7** | So sánh hàm "Số tồn hiển thị" vs "Số chặn đặt hàng" | **KHÔNG DÙNG CHUNG HÀM** (Tồn tại độ lệch nghiệp vụ) | **Trung bình** (Admin hiển thị lệch safety_stock; Combo ở stores API) |

---

## MỤC 1: RESERVATION_EXPIRY_HOURS, CRON CLEANUP VÀ TRỪ TỒN KHO

### 1.1. Giá trị thực tế của `RESERVATION_EXPIRY_HOURS` và các vị trí sử dụng
- **Giá trị cấu hình thực tế:** `24` giờ (được định nghĩa tập trung tại [src/config/inventory.ts](file:///d:/WebTSF/thai-son-foods/src/config/inventory.ts#L8)).

| STT | Tệp tin & Vị trí dòng | Đoạn mã / Cách sử dụng | Mục đích sử dụng | Đánh giá |
| :---: | :--- | :--- | :--- | :--- |
| 1 | [src/config/inventory.ts:8](file:///d:/WebTSF/thai-son-foods/src/config/inventory.ts#L8) | `RESERVATION_EXPIRY_HOURS: 24` | Hằng số cấu hình hệ thống chuẩn | Gốc cấu hình chuẩn |
| 2 | [src/lib/inventory.ts:807](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L807) | `expiresAt = new Date(Date.now() + INVENTORY_CONFIG.RESERVATION_EXPIRY_HOURS * 3600 * 1000);` | Tính thời điểm hết hạn giữ chỗ khi tạo đơn hàng | Đúng chuẩn, đọc từ config |
| 3 | [src/app/api/orders/route.ts:422](file:///d:/WebTSF/thai-son-foods/src/app/api/orders/route.ts#L422) | `expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()` | Trả về thời gian hết hạn cho client ở response | Đang **hardcode 24**, nên dùng config |
| 4 | [src/app/api/admin/orders/transfer/route.ts:120](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/transfer/route.ts#L120) | `const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);` | Gia hạn giữ chỗ tại kho mới khi transfer đơn | Đang **hardcode 24**, nên dùng config |

### 1.2. Vị trí lập lịch Cron Cleanup
Việc dọn dẹp các reservation hết hạn được tổ chức theo kiến trúc bảo vệ đa tầng (Multi-tier Cleanup):

| Tầng bảo vệ | Tệp tin & Dòng | Lịch trình / Cơ chế kích hoạt | Chi tiết xử lý |
| :--- | :--- | :--- | :--- |
| **Cron độc lập (Vercel Cron)** | [vercel.json:5](file:///d:/WebTSF/thai-son-foods/vercel.json#L5) | `*/5 * * * *` (Mỗi 5 phút một lần) | Gọi endpoint `GET /api/cron/cleanup-reservations` |
| **Endpoint xử lý Cron** | [src/app/api/cron/cleanup-reservations/route.ts:18](file:///d:/WebTSF/thai-son-foods/src/app/api/cron/cleanup-reservations/route.ts#L18) | Nhận trigger từ Vercel Cron hoặc Bearer Token | Gọi `cleanupExpiredReservations(100)` trong transaction |
| **In-App Auto Trigger 1** | [src/app/api/orders/route.ts:176](file:///d:/WebTSF/thai-son-foods/src/app/api/orders/route.ts#L176) | Tự động chạy nền khi khách đặt hàng | Bọc `cleanupExpiredReservations().catch(...)` không chặn luồng đặt hàng |
| **In-App Auto Trigger 2** | [src/app/api/inventory/check/route.ts:18](file:///d:/WebTSF/thai-son-foods/src/app/api/inventory/check/route.ts#L18) | Tự động chạy khi kiểm tra tồn kho | Bọc `cleanupExpiredReservations().catch(...)` làm sạch dữ liệu cũ |
| **Core Cleanup Logic** | [src/lib/inventory.ts:1257-1335](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L1257-L1335) | Hàm `cleanupExpiredReservations()` | Tìm đơn `PENDING` quá hạn `expires_at`, nhả `reserved` trên `store_inventory` |

### 1.3. Trạng thái đơn nào thì trừ `stock_quantity`?
Vòng đời trừ kho thực tế được kiểm toán chặt chẽ trong mã nguồn:

| Trạng thái đơn hàng (`status`) | Biến động `reserved` | Biến động `stock_quantity` | Vị trí thực thi trong Code |
| :--- | :---: | :---: | :--- |
| **PENDING** (Khách vừa tạo đơn) | **+N** (Tăng giữ chỗ) | **0** (Chưa trừ kho thật) | [src/lib/inventory.ts:860-870](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L860-L870) |
| **CONFIRMED** (Xác nhận đơn) | **-N** (Giảm giữ chỗ) | **-N** (Trừ kho vật lý thật) | [src/app/api/admin/orders/route.ts:226](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/route.ts#L226) gọi `confirmStock()` ([src/lib/inventory.ts:961-969](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L961-L969)) |
| **PROCESSING** (Đang chuẩn bị) | Không đổi nếu đã trừ | **-N** (Trừ nếu đơn cũ chưa trừ) | [src/app/api/admin/orders/route.ts:226](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/route.ts#L226) |
| **SHIPPING** (Đang giao hàng) | Không đổi nếu đã trừ | **-N** (Trừ nếu đơn cũ chưa trừ) | [src/app/api/admin/orders/route.ts:226](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/route.ts#L226) |
| **COMPLETED** (Giao thành công) | Không đổi nếu đã trừ | **-N** (Đảm bảo đã trừ kho) | [src/app/api/admin/orders/route.ts:226](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/route.ts#L226) |
| **CANCELLED** (Đơn bị hủy) | **-N** (Nhả giữ chỗ) | **+N** (Hoàn lại nếu trước đó đã trừ) | [src/app/api/admin/orders/route.ts:234](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/route.ts#L234) gọi `releaseStock()` ([src/lib/inventory.ts:1120-1135](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L1120-L1135)) |

> **Quy tắc SQL trừ kho thực tế tại `confirmStock()`:**
> ```sql
> UPDATE store_inventory
> SET stock_quantity = GREATEST(0, stock_quantity - $1),
>     reserved = GREATEST(0, reserved - $1),
>     updated_at = CURRENT_TIMESTAMP
> WHERE store_code = $2 AND product_id = $3;
> ```

---

## MỤC 2: PHÂN TÍCH HÀM EXTRACTBOTTLEMULTIPLIER VÀ DANH SÁCH BIẾN THỂ

### 2.1. Liệt kê toàn bộ biến thể sản phẩm hiện có
Kiểm toán đối chiếu giữa Database (`product_variants`) và Mã nguồn tĩnh ([src/data/products.ts](file:///d:/WebTSF/thai-son-foods/src/data/products.ts)):
- **Tổng số biến thể trong Database:** 43 biến thể.
- **Tổng số biến thể trong Code (`src/data/products.ts`):** 46 biến thể.
- **LỆCH DỮ LIỆU ĐÃ PHÁT HIỆN:** 3 biến thể của sản phẩm `prod-ss-01` (`sua-hat-sen-lotus`) gồm `ss-5chai`, `ss-7chai`, `ss-10chai` có trong code nhưng **chưa được seed vào bảng `product_variants` trong Database**!

#### Bảng danh mục toàn bộ biến thể và kết quả bóc tách Regex:
| STT | Product ID | Variant ID | Tên biến thể / Quy cách | Đơn vị (`unit`) | Hệ số kỳ vọng | Regex bắt được | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| 1 | `prod-sb-01` | `var_prod-sb-01_sb-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 2 | `prod-sb-01` | `var_prod-sb-01_sb-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 3 | `prod-sb-01` | `var_prod-sb-01_sb-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 4 | `prod-sb-01` | `var_prod-sb-01_sb-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 5 | `prod-shs-01` | `var_prod-shs-01_shs-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 6 | `prod-shs-01` | `var_prod-shs-01_shs-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 7 | `prod-shs-01` | `var_prod-shs-01_shs-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 8 | `prod-shs-01` | `var_prod-shs-01_shs-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 9 | `prod-sgl-01` | `var_prod-sgl-01_sgl-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 10 | `prod-sgl-01` | `var_prod-sgl-01_sgl-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 11 | `prod-sgl-01` | `var_prod-sgl-01_sgl-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 12 | `prod-sgl-01` | `var_prod-sgl-01_sgl-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 13 | `prod-sl-01` | `var_prod-sl-01_sl-5chai` | 5 chai | lốc | 5 | 5 | Khớp chuẩn |
| 14 | `prod-sl-01` | `var_prod-sl-01_sl-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 15 | `prod-sl-01` | `var_prod-sl-01_sl-10chai` | 10 chai | thùng | 10 | 10 | Khớp chuẩn |
| 16 | `prod-md-01` | `var_prod-md-01_md-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 17 | `prod-md-01` | `var_prod-md-01_md-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 18 | `prod-md-01` | `var_prod-md-01_md-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 19 | `prod-md-01` | `var_prod-md-01_md-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 20 | `prod-td-01` | `var_prod-td-01_td-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 21 | `prod-td-01` | `var_prod-td-01_td-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 22 | `prod-td-01` | `var_prod-td-01_td-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 23 | `prod-td-01` | `var_prod-td-01_td-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 24 | `prod-lh-01` | `var_prod-lh-01_lh-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 25 | `prod-lh-01` | `var_prod-lh-01_lh-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 26 | `prod-lh-01` | `var_prod-lh-01_lh-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 27 | `prod-lh-01` | `var_prod-lh-01_lh-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 28 | `prod-tsa-01` | `var_prod-tsa-01_tsa-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 29 | `prod-tsa-01` | `var_prod-tsa-01_tsa-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 30 | `prod-tsa-01` | `var_prod-tsa-01_tsa-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 31 | `prod-tsa-01` | `var_prod-tsa-01_tsa-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 32 | `prod-mac-01` | `var_prod-mac-01_mac-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 33 | `prod-mac-01` | `var_prod-mac-01_mac-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 34 | `prod-mac-01` | `var_prod-mac-01_mac-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 35 | `prod-mac-01` | `var_prod-mac-01_mac-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 36 | `prod-tsg-01` | `var_prod-tsg-01_tsg-7chai` | Trà Sữa chai 330ml | 1 chai | 7 | 7 (nhờ suffix id) | Khớp chuẩn |
| 37 | `prod-tsg-01` | `var_prod-tsg-01_tsg-10chai` | Trà Sữa chai 330ml | 1 chai | 10 | 10 (nhờ suffix id) | Khớp chuẩn |
| 38 | `prod-tsg-01` | `var_prod-tsg-01_tsg-12chai` | Trà Sữa chai 330ml | 1 chai | 12 | 12 (nhờ suffix id) | Khớp chuẩn |
| 39 | `prod-tsg-01` | `var_prod-tsg-01_tsg-15chai` | Trà Sữa chai 330ml | 1 chai | 15 | 15 (nhờ suffix id) | Khớp chuẩn |
| 40 | `prod-txg-01` | `var_prod-txg-01_txg-7chai` | 7 chai | lốc | 7 | 7 | Khớp chuẩn |
| 41 | `prod-txg-01` | `var_prod-txg-01_txg-10chai` | 10 chai | lốc | 10 | 10 | Khớp chuẩn |
| 42 | `prod-txg-01` | `var_prod-txg-01_txg-12chai` | 12 chai | thùng | 12 | 12 | Khớp chuẩn |
| 43 | `prod-txg-01` | `var_prod-txg-01_txg-15chai` | 15 chai | thùng | 15 | 15 | Khớp chuẩn |
| 44 | `prod-ss-01` | `ss-5chai` *(Chỉ có ở code)* | Sữa Hạt Sen Lotus chai 568ml | 1 chai | 5 | 5 (nhờ suffix id) | Khớp chuẩn |
| 45 | `prod-ss-01` | `ss-7chai` *(Chỉ có ở code)* | Sữa Hạt Sen Lotus chai 568ml | 1 chai | 7 | 7 (nhờ suffix id) | Khớp chuẩn |
| 46 | `prod-ss-01` | `ss-10chai` *(Chỉ có ở code)* | Sữa Hạt Sen Lotus chai 568ml | 1 chai | 10 | 10 (nhờ suffix id) | Khớp chuẩn |

### 2.2. Điểm mù của Regex và các trường hợp bị fallback về 1
Mã nguồn hàm tại [src/lib/inventory.ts:269-287](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L269-L287):
```ts
const match = combined.match(/(\d+)\s*(chai|bottle)/);
const variantMatch = combined.match(/[-_](\d+)chai/);
```
**BẢNG CÁC TRƯỜNG HỢP REGEX BỊ LỖI VÀ FALLBACK VỀ 1:**

| Kịch bản thực tế | Input mẫu | Kết quả mong đợi | Kết quả Regex thực tế | Hậu quả tồn kho |
| :--- | :--- | :---: | :---: | :--- |
| **Quy cách không chứa chữ "chai"** | `id="var_loc5"`, `unit="lốc"`, `name="Lốc 5"` | **5 chai** | **1** | Trừ thiếu 4 chai khi khách mua 1 lốc |
| **Quy cách thùng không có chữ "chai"** | `id="thung-24"`, `unit="thùng"`, `name="Thùng 24"` | **24 chai** | **1** | Trừ thiếu 23 chai vật lý trong kho |
| **Đơn vị tiếng Anh / Quốc tế** | `id="var-p6"`, `unit="pack"`, `name="Pack of 6"` | **6 chai** | **1** | Bỏ lọt hệ số đóng gói |
| **Đơn vị lon / hộp** | `id="var_lon6"`, `unit="lon"`, `name="Lốc 6 lon"` | **6** | **1** | Fallback về 1 |
| **ID biến thể sinh ngẫu nhiên (UUID)** | `id="f47ac10b-..."`, `unit="lốc"`, `name="Lốc quà tặng"` | Tuỳ cấu hình | **1** | Hoàn toàn không nhận diện được |

---

## MỤC 3: HIỆN TƯỢNG CHECKOUT TỰ ĐỘNG ĐÈ CỬA HÀNG KHÁCH ĐÃ CHỌN

### 3.1. Phân tích nguyên nhân mã nguồn
- **Tệp tin gây lỗi:** [src/app/thanh-toan/page.tsx:382-388](file:///d:/WebTSF/thai-son-foods/src/app/thanh-toan/page.tsx#L382-L388)
- **Đoạn mã kích hoạt:**
```tsx
useEffect(() => {
  if (customerCoords && stores.length > 0) {
    const nearest = findNearestStore(stores, customerCoords.lat, customerCoords.lng);
    if (nearest && nearest.store.code !== selectedStoreCode) {
      handleSelectStore(nearest.store.code); // <-- ĐÈ CỬA HÀNG TẠI ĐÂY!
    }
  }
}, [customerCoords, stores]);
```
- **Cơ chế xảy ra lỗi:**
  1. Khách hàng chủ động chọn chi nhánh tại Header hoặc Pop-up (ví dụ: `AMA` - Biên Hòa).
  2. Khách vào trang `/thanh-toan`, bắt đầu nhập địa chỉ nhận hàng (chọn Tỉnh "Hồ Chí Minh", Quận "Tân Phú").
  3. Tại các dòng 186-222, hàm `estimateCoordinatesFromAddress` được gọi để sinh `customerCoords`.
  4. `useEffect` ở dòng 382 lập tức bị trigger vì `customerCoords` thay đổi.
  5. `findNearestStore` tính khoảng cách địa lý và tìm thấy cửa hàng gần địa chỉ giao hàng nhất là `NH` (Vườn Lài, Tân Phú - cách ~0.6km).
  6. Điều kiện `nearest.store.code !== selectedStoreCode` thỏa mãn (`'NH' !== 'AMA'`), hàm `handleSelectStore('NH')` lập tức thực thi, **tự ý ghi đè chi nhánh khách đã chọn mà không có bất kỳ xác nhận nào**!

### 3.2. Bằng chứng kiểm thử tái hiện (Reproduction Test)
- **File test thực thi:** `tests/reproduce_checkout_store_overwrite.mjs`
- **Lệnh chạy:** `npx tsx tests/reproduce_checkout_store_overwrite.mjs`
- **Kết quả kiểm thử:** **PASS (Tái hiện lỗi thành công 100%)**
```text
================================================================
TEST TÁI HIỆN: CƠ CHẾ TỰ ĐỘNG ĐÈ CỬA HÀNG TRONG CHECKOUT
================================================================
[Bước 1] Khách hàng chủ động chọn chi nhánh tại Header: AMA
[Bước 2] Khách hàng nhập địa chỉ: Tỉnh "Hồ Chí Minh", Quận "Tân Phú"
   -> Tọa độ ước tính từ địa chỉ: lat=10.79, lng=106.628
[Bước 3] useEffect tại src/app/thanh-toan/page.tsx:382-388 được kích hoạt do customerCoords thay đổi:
   -> Chi nhánh gần nhất tìm thấy: Cửa Hàng Vườn Lài (Tân Phú) (NH) - Khoảng cách: ~0.60 km
❌ [XÁC NHẬN SỰ CỐ]: Cửa hàng ban đầu [AMA] ĐÃ BỊ TỰ ĐỘNG ĐÈ THÀNH [NH]!
```

---

## MỤC 4: GIAO DỊCH CHUYỂN CHI NHÁNH (TRANSFER TRANSACTION) VÀ KHI KHO B THIẾU HÀNG

### 4.1. Phân tích Transactionality trong Order Transfer
Kiểm toán mã nguồn tại [src/app/api/admin/orders/transfer/route.ts:44-170](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/transfer/route.ts#L44-L170):

| Tiêu chí | Hiện trạng kiểm toán | Chi tiết vị trí mã nguồn |
| :--- | :---: | :--- |
| Khởi tạo Transaction | **CÓ** | [transfer/route.ts:44](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/transfer/route.ts#L44) `await client.query('BEGIN');` |
| Rollback khi có lỗi | **CÓ** | [transfer/route.ts:159](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/transfer/route.ts#L159) `await client.query('ROLLBACK');` |
| Commit khi thành công | **CÓ** | [transfer/route.ts:143](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/transfer/route.ts#L143) `await client.query('COMMIT');` |
| Giải phóng client | **CÓ** | [transfer/route.ts:162](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/transfer/route.ts#L162) `client.release();` trong khối `finally` |

### 4.2. PHÁT HIỆN BUG NGHIÊM TRỌNG: BỎ LỌT KIỂM TRA TỒN KHO TẠI KHO B!
Tại [src/app/api/admin/orders/transfer/route.ts:84](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/orders/transfer/route.ts#L84):
```ts
const itemsRes = await client.query(
  `SELECT product_id, name, quantity, unit, price FROM order_items WHERE order_id = $1;`,
  [orderId]
);
```
- **Lỗ hổng:** Câu SQL trả về trường tên là `product_id` (snake_case).
- **Hệ quả dây chuyền:** 
  1. Đối tượng `itemsRes.rows` truyền vào hàm `expandComboItems(items)`.
  2. Hàm `expandComboItems` lại tìm thuộc tính `item.productId` (camelCase)!
  3. Vì `item.productId === undefined`, hàm không tìm thấy sản phẩm nào và trả về danh sách rỗng `[]`!
  4. Hàm `getAvailability(targetStoreCode, [])` thấy danh sách kiểm tra là rỗng nên trả về `isAvailable = true`!
  5. **KHO B DÙ CÓ 0 CHAI TỒN KHO VẪN BÁO ĐỦ HÀNG VÀ CHO PHÉP CHUYỂN ĐƠN HÀNG THÀNH CÔNG!**

### 4.3. Bằng chứng kiểm thử tự động (Reproduction Test)
- **File test thực thi:** `tests/reproduce_transfer_stock_deficiency.mjs`
- **Lệnh chạy:** `npx tsx tests/reproduce_transfer_stock_deficiency.mjs`
- **Kết quả kiểm thử:** **PASS**

```text
================================================================
TEST TÁI HIỆN: ORDER TRANSFER & TRANSACTION TOÀN VẸN KHI KHO B THIẾU HÀNG
================================================================
[Bước 1] Khởi tạo đơn hàng TSF-TRF-3659 tại Kho A (AMA)...
   -> Kho A (AMA): stock=100, reserved=10

[Phần A] Kiểm tra câu SQL hiện tại trong src/app/api/admin/orders/transfer/route.ts:84
   Câu SQL hiện tại: SELECT product_id, name, quantity, unit, price FROM order_items
   -> expandComboItems trả về số chai: 0 (BỊ RỖNG VÌ THIẾU ALIAS productId!)
   -> getAvailability tại Kho B rỗng trả về: isAvailable = true (NGUY HIỂM: Luôn báo đủ hàng!)

[Phần B] Kiểm tra cơ chế Transaction & Rollback khi query đúng: SELECT product_id AS "productId"...
   -> getAvailability tại Kho B (kho rỗng): isAvailable = false

[Bước 2] Thực thi Transaction chuyển kho với dữ liệu chuẩn:
   -> [BẮT ĐƯỢC LỖI THIẾU HÀNG]: Chi nhánh đích (staff_empty_store) không đủ hàng cho các món trong đơn này.
   -> THỰC THI ROLLBACK TRANSACTION...

[Bước 3] Kiểm tra tính toàn vẹn dữ liệu sau khi ROLLBACK:
   - Đơn hàng store_code: [AMA] (Mong đợi: AMA)
   - Kho A reserved: [10] (Ban đầu: 10)
```

---

## MỤC 5: KHẢO SÁT VIỆC ĐỌC VÀ GHI CỘT PRODUCTS.STOCK_QUANTITY

Khảo sát toàn diện mã nguồn xem những trang, component, hoặc API nào còn đọc hoặc ghi trực tiếp vào cột `products.stock_quantity`:

| Tệp tin & Dòng | Câu lệnh / Thao tác | Hành vi Đọc hay Ghi | Ý nghĩa & Đánh giá |
| :--- | :--- | :---: | :--- |
| [src/lib/db.ts:189](file:///d:/WebTSF/thai-son-foods/src/lib/db.ts#L189) | `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 100;` | Schema Init | Cột kế thừa (legacy aggregate column) |
| [src/lib/inventory.ts:996-1002](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L996-L1002) | `UPDATE products SET stock_quantity = (SELECT SUM(stock_quantity) FROM store_inventory WHERE product_id = $1)` | **GHI** | Đồng bộ tổng tồn kho toàn chuỗi khi đơn CONFIRMED |
| [src/lib/inventory.ts:1066-1072](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L1066-L1072) | `UPDATE products SET stock_quantity = (SELECT SUM(stock_quantity) FROM store_inventory WHERE product_id = $1)` | **GHI** | Đồng bộ tổng tồn kho toàn chuỗi (đơn cũ không reservation) |
| [src/lib/inventory.ts:1142-1148](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L1142-L1148) | `UPDATE products SET stock_quantity = (SELECT SUM(stock_quantity) FROM store_inventory WHERE product_id = $1)` | **GHI** | Đồng bộ khi đơn CANCELLED và hoàn kho |
| [src/lib/inventory.ts:1472-1476](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L1472-L1476) | `UPDATE products SET stock_quantity = (SELECT SUM(stock_quantity) FROM store_inventory WHERE product_id = $1)` | **GHI** | Đồng bộ khi admin đổi số lượng kho cửa hàng |
| [src/app/api/admin/products/route.ts:50](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/products/route.ts#L50) | `SELECT p.* FROM products p` | **ĐỌC** | Đọc `p.stock_quantity` gửi về client Admin qua API |
| [src/app/api/admin/products/route.ts:285](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/products/route.ts#L285) | `SELECT * FROM products WHERE id = $1;` | **ĐỌC** | Kiểm tra trước khi cập nhật thông tin sản phẩm |
| [src/app/api/admin/products/route.ts:480](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/products/route.ts#L480) | `SELECT * FROM products WHERE id = $1;` | **ĐỌC** | Kiểm tra trước khi xóa sản phẩm |
| [src/app/admin/page.tsx:543, 552](file:///d:/WebTSF/thai-son-foods/src/app/admin/page.tsx#L543) | `fetch('/api/admin/products') -> setProducts(...)` | **ĐỌC** (API) | State nhận trường này nhưng **không hiển thị lên UI** |

> **KẾT LUẬN QUAN TRỌNG:**
> 1. **Khách hàng bên ngoài (Customer Storefront):** Hoàn toàn **KHÔNG CÒN TRANG NÀO** đọc trực tiếp `products.stock_quantity`. Mọi trang (`/san-pham`, `/dat-hang`, `/thanh-toan`, Pop-up chọn chi nhánh) đều đọc dữ liệu phân tán theo từng cửa hàng từ bảng `store_inventory` qua `/api/stores` hoặc `/api/inventory/check`.
> 2. **Phía Admin:** Bảng Quản lý sản phẩm không hiển thị cột tồn kho này; tab "Quản Lý Kho Hàng" đọc chính xác `store_inventory` (`si.stock_quantity`). Cột `products.stock_quantity` đóng vai trò là snapshot tổng tồn kho toàn hệ thống.

---

## MỤC 6: PHÂN LOẠI 38 BẢN GHI TRONG BẢNG STORES

Kết quả truy vấn trực tiếp từ cơ sở dữ liệu PostgreSQL (`WebTSF_staging`):

```sql
SELECT id, code, name, address, phone, is_active, status FROM stores ORDER BY id;
```

Toàn bộ 38 bản ghi được phân loại thành 4 nhóm nghiệp vụ rõ ràng:

### Nhóm 1: Cửa Hàng Bán Lẻ Thật Đang Hoạt Động (25 Cửa hàng)
*Đặc điểm: `is_active = true`, `status = 1`, có số điện thoại quản lý riêng, đang bán hàng trên website.*

| STT | ID | Mã (Code) | Tên Cửa Hàng | Địa Chỉ | Số Điện Thoại | Tình Trạng |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: |
| 1 | `store_AMA` | `AMA` | Cửa Hàng Tân Hiệp (Biên Hòa) | C225 Tổ 16 Kp5, P. Tân Hiệp, Biên Hòa, Đồng Nai | 0836937504 | Active |
| 2 | `store_CM` | `CM` | Cửa Hàng Cầu Xéo (Long Thành) | Số 8, Đinh Bộ Lĩnh, Cầu Xéo, Long Thành, Đồng Nai | 0911812559 | Active |
| 3 | `store_CTH` | `CTH` | Cửa Hàng Ninh Kiều (Cần Thơ) | Lô B4_01, Đ. Số 3, TĐC ĐH Y Dược, P. An Khánh, Ninh Kiều, Cần Thơ | 0836937481 | Active |
| 4 | `store_D1` | `D1` | Cửa Hàng Ung Văn Khiêm (Bình Thạnh) | 255 Ung Văn Khiêm, P25, Bình Thạnh, TP. HCM | 0911812437 | Active |
| 5 | `store_DN` | `DN` | Cửa Hàng Cư Xá Đồng Tiến (Quận 10) | 2c Cư Xá Đồng Tiến, P14, Quận 10, TP. HCM | 0911812428 | Active |
| 6 | `store_LB` | `LB` | Cửa Hàng Phước Tân (Đồng Nai) | 20 Nam Cao, P. Phước Tân, Biên Hòa, Đồng Nai | 0836937503 | Active |
| 7 | `store_LX` | `LX` | Cửa Hàng Linh Tây (Thủ Đức) | Ki Ốt Số 6, Hẻm 96 Đ. Số 9, Linh Tây, Thủ Đức, TP. HCM | 0911812413 | Active |
| 8 | `store_ME` | `ME` | Cửa Hàng An Phú (Thuận An) | 75/5 Kp4, Chu Văn An, P. An Phú, Thuận An, Bình Dương | 0911812412 | Active |
| 9 | `store_MP` | `MP` | Cửa Hàng Mỹ Phước (Bến Cát) | Đường Ne8 An Hòa, P. Hòa Lợi, Bến Cát, Bình Dương | 0911812411 | Active |
| 10 | `store_NB` | `NB` | Cửa Hàng Cao Lỗ (Quận 8) | 25 Đường 152A Cao Lỗ, P4, Quận 8, TP. HCM | 0911812482 | Active |
| 11 | `store_NH` | `NH` | Cửa Hàng Vườn Lài (Tân Phú) | 298/4 Vườn Lài, P. Phú Thọ Hòa, Tân Phú, TP. HCM | 0911812425 | Active |
| 12 | `store_NTB` | `NTB` | Cửa Hàng Nguyễn Thái Bình (Quận 1) | 157 Nguyễn Thái Bình, P. NTB, Quận 1, TP. HCM | 0911812435 | Active |
| 13 | `store_RD` | `RD` | Cửa Hàng Chiến Lược (Bình Tân) | 95/44 Chiến Lược, P. Bình Trị Đông, Bình Tân, TP. HCM | 0911812418 | Active |
| 14 | `store_TB` | `TB` | Cửa Hàng Bình Chiểu (Thủ Đức) | 952/2a Tỉnh Lộ 43, Kp1, Bình Chiểu, Thủ Đức, TP. HCM | 0911812407 | Active |
| 15 | `store_TBA` | `TBA` | Cửa Hàng Trảng Bàng (Tây Ninh) | 28B Đường 22/12, Lộc Du, Trảng Bàng, Tây Ninh | 0836937498 | Active |
| 16 | `store_TCH` | `TCH` | Cửa Hàng Tân Chánh Hiệp (Quận 12) | 113/6 TCH03, Tân Chánh Hiệp, Quận 12, TP. HCM | 0911812433 | Active |
| 17 | `store_TD` | `TD` | Cửa Hàng Tăng Nhơn Phú (Quận 9) | C20/3A Đường 449, Tăng Nhơn Phú A, Quận 9, TP. HCM | 0911812404 | Active |
| 18 | `store_TDM` | `TDM` | Cửa Hàng Thủ Dầu Một (Bình Dương) | 278 Đ. Nguyễn Văn Lộng, P. Chánh Mỹ, TDM, Bình Dương | 0911812405 | Active |
| 19 | `store_THB` | `THB` | Cửa Hàng Phổ Quang (Tân Bình) | 2c Phổ Quang, P2, Tân Bình, TP. HCM | 0911812434 | Active |
| 20 | `store_TN` | `TN` | Cửa Hàng Tân Nhơn (Gò Vấp) | 208/28 Lê Đức Thọ, P6, Gò Vấp, TP. HCM | 0911812432 | Active |
| 21 | `store_TRB` | `TRB` | Cửa Hàng Trảng Bom (Đồng Nai) | 17A Huỳnh Văn Nghệ, TT. Trảng Bom, Đồng Nai | 0846937524 | Active |
| 22 | `store_TTH` | `TTH` | Cửa Hàng Huỳnh Tấn Phát (Quận 7) | 858 Huỳnh Tấn Phát, Tân Phú, Quận 7, TP. HCM | 0911812417 | Active |
| 23 | `store_VT` | `VT` | Cửa Hàng Vũng Tàu (Bà Rịa - VT) | 324/16a Bình Giã, Nguyễn An Ninh, Vũng Tàu | 0911812472 | Active |
| 24 | `store_XA` | `XA` | Cửa Hàng Củ Chi (TP. HCM) | 1D Đường 10A, KP2, TT. Củ Chi, TP. HCM | 0911812473 | Active |
| 25 | `store_XL` | `XL` | Cửa Hàng Xuân Lộc (Đồng Nai) | 1367 Quốc lộ 1A, Ấp 4, Xuân Hưng, Xuân Lộc, Đồng Nai | 0911812439 | Active |

### Nhóm 2: Kho Xưởng / Kho Tổng Sản Xuất (3 Kho)
*Đặc điểm: `is_active = false`, `status = 2`, dùng để luân chuyển và sản xuất, không phục vụ bán lẻ trực tiếp.*

| STT | ID | Mã (Code) | Tên Kho Xưởng | Địa Chỉ | Số Điện Thoại | Tình Trạng |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: |
| 26 | `store_TAT` | `TAT` | Xưởng Tóc Tiên (Kho Tổng) | Ấp 6, Tóc Tiên, TX. Phú Mỹ, Bà Rịa - Vũng Tàu | 02871000472 | Kho xưởng (Inactive) |
| 27 | `store_XBC` | `XBC` | Xưởng Bình Chánh (Kho Tổng) | Số 10, Đ. Số 14, Ấp 5, Phong Phú, Bình Chánh, TP. HCM | 02871000472 | Kho xưởng (Inactive) |
| 28 | `store_XBD` | `XBD` | Xưởng Bình Dương (Kho Tổng) | 6/8 KP. Đồng An 3, Bình Hòa, Thuận An, Bình Dương | 02871000472 | Kho xưởng (Inactive) |

### Nhóm 3: Cửa Hàng Cũ Đã Đóng Cửa (5 Cửa hàng)
*Đặc điểm: `is_active = false`, `status = 0`, đã ngừng kinh doanh mặt bằng, lưu trữ để đối soát hóa đơn cũ.*

| STT | ID | Mã (Code) | Tên Cửa Hàng | Địa Chỉ | Số Điện Thoại | Tình Trạng |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: |
| 29 | `store_BD` | `BD` | Cửa Hàng Dĩ An | 126 Đ. Số 5, KP. Nhị Đồng 1, Dĩ An, Bình Dương | 02871000472 | Đã đóng cửa |
| 30 | `store_CL` | `CL` | Cửa Hàng Cát Lái | 36 Đ. Số 12, KP1, Cát Lái, TP. HCM | 02871000472 | Đã đóng cửa |
| 31 | `store_HHT` | `HHT` | Cửa Hàng Nơ Trang Long | 5/77 Nơ Trang Long, Gia Định, TP. HCM | 02871000472 | Đã đóng cửa |
| 32 | `store_LT` | `LT` | Cửa Hàng Long Thành | Tổ 15, KP 3, Ấp An Phước, Long Thành, Đồng Nai | 02871000472 | Đã đóng cửa |
| 33 | `store_VL` | `VL` | Cửa Hàng Vĩnh Lộc | 59 Nguyễn Thị Tuôi, Vĩnh Lộc, TP. HCM | 02871000472 | Đã đóng cửa |

### Nhóm 4: Tài Khoản Test / Dummy Admin Chi Nhánh Cũ (5 Tài khoản)
*Đặc điểm: `is_active = false`, `status = 0`, dữ liệu mẫu tạo ra trong giai đoạn dev khởi tạo ban đầu.*

| STT | ID | Mã (Code) | Tên Chi Nhánh Mẫu | Địa Chỉ | Số Điện Thoại | Tình Trạng |
| :---: | :--- | :---: | :--- | :--- | :---: | :---: |
| 34 | `store_adminCH1` | `adminCH1` | Chi nhánh 1 (Tân Phú) | 472 - 474 Lê Trọng Tấn, Tây Thạnh, Tân Phú | 02871000472 | Đã khóa (Dummy) |
| 35 | `store_adminCH2` | `adminCH2` | Chi nhánh 2 (Quận 3) | 45 Võ Văn Tần, Võ Thị Sáu, Quận 3 | 02871000473 | Đã khóa (Dummy) |
| 36 | `store_adminCH3` | `adminCH3` | Chi nhánh 3 (Bình Thạnh) | 82 Phan Đăng Lưu, P.5, Bình Thạnh | 02871000474 | Đã khóa (Dummy) |
| 37 | `store_adminCH4` | `adminCH4` | Chi nhánh 4 (Tân Bình) | 19 Hoàng Hoa Thám, P.13, Tân Bình | 02871000475 | Đã khóa (Dummy) |
| 38 | `store_adminCH5` | `adminCH5` | Chi nhánh 5 (TP. Thủ Đức) | 210 Võ Văn Ngân, Bình Thọ, TP. Thủ Đức | 02871000476 | Đã khóa (Dummy) |

---

## MỤC 7: SO SÁNH HÀM TÍNH "SỐ TỒN HIỂN THỊ" VS "SỐ CHẶN ĐẶT HÀNG"

**CÂU HỎI TRỌNG TÂM:** Số tồn hiển thị và số chặn đặt hàng có dùng chung một hàm không?  
**TRẢ LỜI:** **KHÔNG DÙNG CHUNG HÀM (DIVERGENT IMPLEMENTATION)**.

### 7.1. Bảng đối chiếu ma trận các hàm tính toán tồn kho trong hệ thống

| Tiêu chí | (A) Số tồn hiển thị cho Khách (Lẻ) | (B) Số tồn hiển thị cho Khách (Combo) | (C) Số tồn hiển thị cho Admin | (D) Số chặn đặt hàng (Checkout & Transfer) |
| :--- | :--- | :--- | :--- | :--- |
| **Vị trí tệp & dòng** | [src/app/api/stores/route.ts:108-113](file:///d:/WebTSF/thai-son-foods/src/app/api/stores/route.ts#L108-L113) | [src/lib/inventory.ts:581](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L581) qua `getAvailability` | [src/app/api/admin/inventory/route.ts:51, 105](file:///d:/WebTSF/thai-son-foods/src/app/api/admin/inventory/route.ts#L51) | [src/lib/inventory.ts:847](file:///d:/WebTSF/thai-son-foods/src/lib/inventory.ts#L847) qua `reserveStock` |
| **Hàm / Câu lệnh** | SQL inline + `Math.max(0, stock - reserved - safety_stock)` | Hàm `getAvailability(storeCode, items)` | SQL `GREATEST(0, si.stock_quantity - si.reserved)` | Hàm `reserveStock(client, storeCode, ...)` (`SELECT FOR UPDATE`) |
| **Trừ Safety Stock?** | **CÓ TRỪ** | **CÓ TRỪ** | ❌ **KHÔNG TRỪ** | **CÓ TRỪ** |
| **Bóc tách Combo?** | ❌ **KHÔNG BÓC TÁCH** (Nhìn combo như 1 product đơn lẻ) | **CÓ BÓC TÁCH** (`expandComboItems`) | ❌ Không bóc tách trên bảng kho chính | **CÓ BÓC TÁCH** (`expandComboItems`) |
| **Khóa dòng bảo vệ?** | Không (Chỉ đọc) | Không (Chỉ đọc) | Không (Chỉ đọc) | **CÓ KHÓA** (`SELECT ... FOR UPDATE`) |
| **Đầu ra (Output)** | Trạng thái `'in_stock' \| 'low_stock' \| 'out_of_stock'` | `{ isAvailable, maxQuantity, bottleBreakdown }` | Số lượng tồn nguyên thủy + số khả dụng | Đặt giữ chỗ hoặc ném ngoại lệ `InsufficientStockError` |

### 7.2. Các rủi ro do không dùng chung một hàm:
1. **Lệch số liệu giữa Admin và Khách hàng:**
   - Admin nhìn thấy số lượng khả dụng cao hơn thực tế (vì query Admin bỏ qua `safety_stock`).
   - Khách đặt mua thì hệ thống lại chặn đơn vì vướng `safety_stock`.
2. **Lỗ hổng Combo ở Pop-up chọn chi nhánh:**
   - Nếu khách đang ở trang Combo và mở Pop-up `BranchSelectorModal`, API `/api/stores?productId=combo-id` sẽ truy vấn `store_inventory` tìm `product_id = 'combo-id'`.
   - Do bảng `store_inventory` chỉ lưu sản phẩm chai đơn lẻ, query trả về `stock_quantity = 0` -> Pop-up có nguy cơ báo tất cả cửa hàng đều "Hết hàng"!

---

## DANH MỤC TEST TÁI HIỆN VÀ SCRIPT KIỂM TOÁN ĐÃ TẠO

Tất cả các tệp kiểm toán và test tái hiện đã được lưu trữ trong thư mục dự án và có thể chạy lại bất cứ lúc nào:

1. [tests/reproduce_checkout_store_overwrite.mjs](file:///d:/WebTSF/thai-son-foods/tests/reproduce_checkout_store_overwrite.mjs):
   - **Mục đích:** Tái hiện lỗi tự động ghi đè chi nhánh khách đã chọn tại trang Checkout khi nhập địa chỉ giao hàng.
   - **Lệnh chạy:** `npx tsx tests/reproduce_checkout_store_overwrite.mjs`
2. [tests/reproduce_transfer_stock_deficiency.mjs](file:///d:/WebTSF/thai-son-foods/tests/reproduce_transfer_stock_deficiency.mjs):
   - **Mục đích:** Tái hiện lỗi query thiếu alias `product_id AS "productId"` trong Transfer và kiểm chứng tính năng Rollback Transaction khi kho đích thiếu hàng.
   - **Lệnh chạy:** `npx tsx tests/reproduce_transfer_stock_deficiency.mjs`
3. [scripts/test_variants_regex.mjs](file:///d:/WebTSF/thai-son-foods/scripts/test_variants_regex.mjs):
   - **Mục đích:** Kiểm tra bóc tách Regex trên 43 biến thể DB, 46 biến thể code và phân tích các trường hợp Regex bị lỗi.
   - **Lệnh chạy:** `npx tsx scripts/test_variants_regex.mjs`
4. [scripts/compare_variants_detail.mjs](file:///d:/WebTSF/thai-son-foods/scripts/compare_variants_detail.mjs):
   - **Mục đích:** So sánh chi tiết từng variant giữa `products.ts` và bảng `product_variants` trong PostgreSQL.
   - **Lệnh chạy:** `npx tsx scripts/compare_variants_detail.mjs`
5. [scripts/analyze_stores.mjs](file:///d:/WebTSF/thai-son-foods/scripts/analyze_stores.mjs):
   - **Mục đích:** Trích xuất và phân loại toàn bộ 38 chi nhánh trong cơ sở dữ liệu.
   - **Lệnh chạy:** `node scripts/analyze_stores.mjs`

---

## ĐỀ XUẤT HƯỚNG XỬ LÝ (ACTIONABLE RECOMMENDATIONS - DÀNH CHO BƯỚC TIẾP THEO)
*(Tuân thủ chỉ đạo hiện tại: Chưa sửa code, chỉ đề xuất phương án chuẩn bị)*

1. **Khắc phục Bug Transfer (`transfer/route.ts:84`):**
   - Đổi query thành: `SELECT product_id AS "productId", name, quantity, unit, price FROM order_items WHERE order_id = $1;`.
2. **Khắc phục Bug Đè Chi Nhánh Checkout (`thanh-toan/page.tsx:382`):**
   - Bổ sung cờ đánh dấu `hasManuallySelectedStore` (khách đã tự chọn).
   - Chỉ tự động gán chi nhánh gần nhất khi khách **chưa từng chọn chi nhánh nào**.
3. **Đồng bộ Variant `prod-ss-01` vào DB:**
   - Chạy script bổ sung 3 bản ghi variant của `prod-ss-01` (`ss-5chai`, `ss-7chai`, `ss-10chai`) vào bảng `product_variants`.
4. **Nâng cấp `extractBottleMultiplier`:**
   - Bổ sung nhận diện từ khóa đóng gói phổ biến: `(\d+)\s*(chai|lốc|thùng|hộp|pack|lon)` và tách số từ tên trước khi quét suffix.
5. **Thống nhất hàm tính tồn kho:**
   - Dùng hàm chung `getAvailability()` hoặc `getStoreStock()` cho cả hiển thị client và kiểm tra checkout để triệt tiêu độ lệch nghiệp vụ.
