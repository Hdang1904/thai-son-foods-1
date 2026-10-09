# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ HỆ THỐNG THÁI SƠN FOODS (CORE V1.0)
## BẢN BACKUP NGHIỆP VỤ HỆ THỐNG TẠI MỐC 3 NGÀY TRƯỚC (GIAI ĐOẠN GO-LIVE 04/10/2026)

---

> **MÃ TÀI LIỆU:** `TSF-BRD-CORE-V1.0`  
> **PHIÊN BẢN HỆ THỐNG:** Core E-Commerce & Multi-Store Inventory Engine v1.0  
> **MỐC THỜI GIAN BACKUP:** Ngày 04/10/2026 (Commit `f69c633` & `1c97251`)  
> **TRẠNG THÁI KIỂM DUYỆT:** Đã hoàn tất đối soát thực tế trên toàn bộ 29 chi nhánh và 83 tệp mã nguồn  
> **PHẠM VI ĐỐI TƯỢNG:** Ban Giám Đốc, Đội ngũ Vận hành Chuỗi, Quản lý Cửa hàng, Kỹ sư Hệ thống & Kiểm thử  

---

## MỤC LỤC CHI TIẾT

1. [TỔNG QUAN HỆ THỐNG & PHẠM VI NGHIỆP VỤ (EXECUTIVE SUMMARY)](#1-tổng-quan-hệ-thống--phạm-vi-nghiệp-vụ)
2. [DANH MỤC SẢN PHẨM & CƠ CHẾ ĐƠN VỊ QUY ĐỔI (CATALOG & VARIANT MULTIPLIER)](#2-danh-mục-sản-phẩm--cơ-chế-đơn-vị-quy-đổi)
3. [MẠNG LƯỚI CHI NHÁNH & ĐỊNH TUYẾN ĐỊA LÝ THÔNG MINH (MULTI-STORE & GEO-ROUTING)](#3-mạng-lưới-chi-nhánh--định-tuyến-địa-lý-thông-minh)
4. [QUẢN LÝ TỒN KHO THỜI GIAN THỰC & CƠ CHẾ GIỮ CHỖ (REAL-TIME INVENTORY & RESERVATIONS)](#4-quản-lý-tồn-kho-thời-gian-thực--cơ-chế-giữ-chỗ)
5. [QUY TRÌNH ĐẶT HÀNG, THANH TOÁN & ĐIỀU PHỐI ĐƠN HÀNG (ORDER LIFECYCLE & DISPATCHING)](#5-quy-trình-đặt-hàng-thanh-toán--điều-phối-đơn-hàng)
6. [HỆ THỐNG PHÂN QUYỀN QUẢN TRỊ & BẢO VỆ PHẠM VI CHI NHÁNH (RBAC & STORE ISOLATION)](#6-hệ-thống-phân-quyền-quản-trị--bảo-vệ-phạm-vi-chi-nhánh)
7. [QUẢN TRỊ GIÁ VỐN & BÁO CÁO LỢI NHUẬN GỘP (COST PRICE & PROFIT MARGIN)](#7-quản-trị-giá-vốn--báo-cáo-lợi-nhuận-gộp)
8. [KIỂM SOÁT RỦI RO, BẢO MẬT & ĐỐI SOÁT DỮ LIỆU (SECURITY & AUDIT TRAILS)](#8-kiểm-soát-rủi-ro-bảo-mật--đối-soát-dữ-liệu)
9. [BẢNG MA TRẬN PHÂN ĐỊNH RANH GIỚI V1.0 VS MODULE ĐỐI TÁC (PARTNER EXTENSION)](#9-bảng-ma-trận-phân-định-ranh-giới-v10-vs-module-đối-tác)

---

## 1. TỔNG QUAN HỆ THỐNG & PHẠM VI NGHIỆP VỤ

### 1.1. Bối cảnh Doanh nghiệp
Thái Sơn Foods là thương hiệu chuyên sản xuất và phân phối các dòng sản phẩm đồ uống dinh dưỡng tươi thanh mát từ thiên nhiên (Sữa bắp nếp tươi, Sữa hạt sen Mekong Xanh, Sữa mè đen, Sữa đậu nành nguyên chất, Nước nha đam tự nhiên...). Đặc thù sản phẩm là đồ uống tươi, hạn sử dụng ngắn, yêu cầu bảo quản lạnh nghiêm ngặt từ xưởng sản xuất đến tay người tiêu dùng.

### 1.2. Mục tiêu Nghiệp vụ của Hệ thống Core V1.0
Hệ thống Thương mại điện tử Bán lẻ đa chi nhánh của Thái Sơn Foods được thiết kế nhằm đáp ứng các yêu cầu kinh doanh:
- **Bán lẻ trực tiếp đến tay người tiêu dùng (D2C):** Mua hàng không cần đăng ký phức tạp (hỗ trợ cả khách vãng lai Guest và khách hàng thành viên Member).
- **Phục vụ mạng lưới đa điểm bán:** 29 chi nhánh và kho xưởng phân bổ tại TP.HCM, tự động định tuyến đơn hàng đến cửa hàng gần nhất còn đủ hàng.
- **Quản lý tồn kho thời gian thực (Zero-Oversell Guarantee):** Chặn đứng tình trạng bán vượt tồn kho (bán âm) bằng cơ chế khóa bi quan (Pessimistic Locking) và giữ chỗ tồn kho (Stock Reservation).
- **Quy đổi đóng gói tự động:** Không bán lẻ từng chai giao hàng tận nơi để đảm bảo chi phí vận chuyển, hệ thống tự động quy đổi và bán theo Lốc (5 hoặc 7 chai) hoặc Thùng (12, 15, 24 chai).
- **Phân quyền và bảo mật nghiêm ngặt (RBAC Store Scoping):** Nhân viên cửa hàng chỉ xem và xử lý đơn hàng của chi nhánh mình phụ trách, ngăn chặn rò rỉ dữ liệu khách hàng (PII) và lộ giá vốn công ty.

---

## 2. DANH MỤC SẢN PHẨM & CƠ CHẾ ĐƠN VỊ QUY ĐỔI

### 2.1. Cấu trúc Danh mục Sản phẩm
Toàn bộ sản phẩm được phân loại vào 3 nhóm ngành hàng chính:
1. **Sữa Hạt (`sua-hat`):**
   - *Sữa Bắp Nếp Thái Sơn Chai 330ml (`SB-01` / `prod-sb-01`):* Sản phẩm chủ lực từ bắp tươi tự nhiên, chuẩn HACCP.
   - *Sữa Hạt Sen Mekong Xanh Chai 330ml (`SHS-01` / `prod-shs-01`):* Chiết xuất từ hạt sen Đồng Tháp, kết hợp đậu xanh và đậu trắng.
   - *Sữa Gạo Lứt Huyết Rồng Chai 330ml (`SGL-01` / `prod-sgl-01`):* Thức uống thực dưỡng thanh lành.
   - *Sữa Đậu Nành Tươi Lá Dứa Chai 330ml (`SL-01` / `prod-sl-01`):* Đậu nành nguyên chất thơm mùi lá dứa.
   - *Sữa Mè Đen Chai 330ml (`MD-01` / `prod-md-01`):* Bổ sung dinh dưỡng và khoáng chất.
2. **Trà Sữa & Thức uống Pha chế (`tra-sua`):**
   - Các dòng trà sữa đóng chai tươi trong ngày.
3. **Nước Giải Khát Tươi (`nuoc-giai-khat`):**
   - Dòng nước nha đam tươi tự nhiên YOO (`YOO-ND`), nước trái cây lên men YOO (`YOO-TC`), nước yến nha đam YOO (`YOO-NY`).

### 2.2. Cơ chế Đơn vị Quy đổi (Bottle Multiplier Engine)

#### Quy tắc kinh doanh cốt lõi:
- **Chính sách không bán chai lẻ giao tận nơi:** Nhằm tối ưu chi phí bao bì, túi giữ nhiệt và giao vận cho đồ uống tươi, hệ thống website **tuyệt đối không cho phép tạo đơn giao tận nơi với số lượng 1 chai đơn lẻ**.
- Nếu khách hàng bấm chọn mua hoặc dữ liệu đầu vào chứa `1 chai`, giỏ hàng tự động kích hoạt cơ chế chuẩn hóa (`sanitizeCartProduct`), tự động quy đổi sản phẩm về quy cách nhỏ nhất:
  - Dòng sản phẩm Sữa truyền thống: Tự động chuyển thành **Lốc 7 chai** (`sb-7chai`, `shs-7chai`...).
  - Dòng sản phẩm YOO / Nha đam: Tự động chuyển thành **Lốc 5 chai** (`5 chai`).

#### Danh mục Biến thể và Hệ số quy đổi (`multiplier`):
Mỗi đơn vị đóng gói có một hệ số nhân chai thực tế (`bottle_multiplier`):

| Nhóm Quy Cách | Tên Biến Thể | Mã Biến Thể (`variant_id`) | Hệ số nhân (`multiplier`) | Mục đích quy đổi tồn kho vật lý |
| :--- | :--- | :--- | :---: | :--- |
| **Chai Lẻ** | 1 Chai (Tiêu chuẩn) | `1-chai` | **1** | Đơn vị cơ sở lưu trữ trong kho vật lý |
| **Lốc 5** | Lốc 5 Chai (Dòng YOO) | `*-5chai` | **5** | Khách mua 1 lốc $\rightarrow$ Kho trừ 5 chai |
| **Lốc 7** | Lốc 7 Chai (Sữa truyền thống) | `*-7chai` | **7** | Khách mua 1 lốc $\rightarrow$ Kho trừ 7 chai |
| **Lốc 10** | Lốc 10 Chai | `*-10chai` | **10** | Khách mua 1 lốc $\rightarrow$ Kho trừ 10 chai |
| **Thùng 12** | Thùng 12 Chai | `*-12chai` | **12** | Khách mua 1 thùng $\rightarrow$ Kho trừ 12 chai |
| **Thùng 15** | Thùng 15 Chai | `*-15chai` | **15** | Khách mua 1 thùng $\rightarrow$ Kho trừ 15 chai |
| **Thùng 24** | Thùng 24 Chai | `*-24chai` | **24** | Khách mua 1 thùng $\rightarrow$ Kho trừ 24 chai |

#### Thuật toán trích xuất hệ số (`getItemBottleMultiplier`):
Hệ thống sử dụng bộ Regex đa tầng đối soát trên chuỗi định danh biến thể, đơn vị và tên sản phẩm:
1. Nhận diện trực tiếp số chai: `(\d+)\s*(?:chai|bottle)`
2. Nhận diện quy cách đóng gói: `(?:lốc|thùng|pack|set)\s*(\d+)`
3. Nhận diện ID biến thể: `[-_](\d+)(?:chai|loc|thung)`
4. Nếu không khớp bất kỳ điều kiện nào, hệ số mặc định là `1`.

$$\text{Tổng số chai trừ kho} = \text{Số lượng đặt (Quantity)} \times \text{Hệ số biến thể (Multiplier)}$$

---

### 2.3. Nghiệp vụ Combo Động (Dynamic Combo Breakdown)
Hệ thống không quản lý combo như một mặt hàng vật lý đóng gói sẵn cố định trong kho, mà quản lý combo theo **định mức thành phần linh hoạt (Bill of Materials - BOM)**:
- Mỗi combo chứa danh sách các chai thành phần kèm định mức (`normQuantity`).
- Ví dụ: Combo "Năng Lượng Gia Đình 6 Chai" gồm: 3 Chai Sữa Bắp Nếp + 3 Chai Sữa Hạt Sen.
- **Công thức xác định tồn kho Combo khả dụng (MaxCombos):**
  $$\text{MaxCombos} = \min_{i \in \text{Bottles}} \left( \left\lfloor \frac{\text{Tồn khả dụng chai}_i}{\text{Định mức chai}_i} \right\rfloor \right)$$
- **Xác định chai điểm nghẽn (Bottleneck):**
  Chai nào có tỷ lệ $\lfloor \text{Tồn} / \text{Định mức} \rfloor$ nhỏ nhất sẽ là điểm nghẽn giới hạn số lượng combo có thể bán.
- **Số chai cần thêm để lên mức tiếp theo:**
  $$\text{Bottles Needed} = (\text{MaxCombos} + 1) \times \text{Định mức} - \text{Tồn khả dụng}$$

---

## 3. MẠNG LƯỚI CHI NHÁNH & ĐỊNH TUYẾN ĐỊA LÝ THÔNG MINH

### 3.1. Danh mục Chi nhánh Vận hành
Hệ thống quản lý **29 điểm bán và kho xưởng** bao phủ các quận huyện trọng điểm tại TP.HCM:
- **Phân loại địa điểm:**
  - `store` (25 cửa hàng bán lẻ chính thức): Phục vụ bán lẻ trực tiếp, giao hàng nội thành nhanh 1-2h và khách đến lấy tận nơi.
  - `warehouse` (3 kho trung tâm & xưởng sản xuất): Điều phối hàng hóa, lưu trữ quy mô lớn và cấp hàng cho các chi nhánh.
  - Điểm đại diện / Vận hành thử nghiệm.
- **Các thông tin quản lý của mỗi Chi nhánh:**
  - `code` (Mã viết tắt chuẩn hóa: `TCH`, `TN`, `PQ`, `BT`, `GV`, `Q1`, `Q7`, `NTB`, `TTH`, `THB`...).
  - `name`: Tên định danh cửa hàng kèm khu vực quận.
  - `address`: Địa chỉ chi tiết số nhà, tên đường, phường, quận.
  - `latitude`, `longitude`: Tọa độ GPS độ chính xác cao phục vụ tính toán khoảng cách.
  - `phone`: Hotline phụ trách của cửa hàng.
  - `isActive`: Trạng thái hoạt động (1: Hoạt động, 0: Tạm ngưng).

### 3.2. Thuật toán Định tuyến Geo-routing & Gợi ý Cửa hàng
Khi khách hàng tiến hành thanh toán và nhập địa chỉ giao hàng:
1. **Chuẩn hóa địa chỉ (Geocoding / Autocomplete):**
   - Tích hợp bộ từ điển dữ liệu địa chỉ 63 tỉnh thành Việt Nam (`vietnam-addresses.ts`) kết hợp OpenStreetMap Geocoding API.
   - Trả về tọa độ $(\text{lat}_{\text{khách}}, \text{lng}_{\text{khách}})$.
2. **Tính toán khoảng cách vật lý (Haversine Formula):**
   $$d = 2R \times \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
   Với $R = 6371 \text{ km}$ (bán kính Trái Đất).
3. **Thuật toán lựa chọn Cửa hàng phục vụ:**
   - Bước 1: Lọc danh sách các cửa hàng có trạng thái `isActive = true` và khoảng cách $d \le 25 \text{ km}$ (bán kính phục vụ tối đa).
   - Bước 2: Sắp xếp các cửa hàng theo thứ tự khoảng cách tăng dần ($d_1 < d_2 < d_3 ...$).
   - Bước 3: Lần lượt kiểm tra tồn kho khả dụng của giỏ hàng tại từng cửa hàng:
     - Nếu cửa hàng gần nhất còn **ĐỦ HÀNG** cho toàn bộ các món trong giỏ: Tự động gán làm cửa hàng phục vụ.
     - Nếu cửa hàng gần nhất bị thiếu hàng: Chuyển sang kiểm tra cửa hàng kế tiếp gần thứ 2, thứ 3...
     - Nếu không có cửa hàng nào trong bán kính 25km đủ hàng: Hệ thống đưa ra cảnh báo cho khách hàng và đề xuất liên hệ hotline điều phối.
4. **Tùy chọn Khách hàng nhận tại cửa hàng (Pickup):**
   - Khách có quyền chủ động tự chọn một chi nhánh cụ thể từ danh sách 25 cửa hàng để đến nhận trực tiếp. Khi đó, hệ thống sẽ kiểm tra tồn kho tại đúng chi nhánh khách đã chọn.

---

## 4. QUẢN LÝ TỒN KHO THỜI GIAN THỰC & CƠ CHẾ GIỮ CHỖ

### 4.1. Mô hình Bảng Dữ liệu Tồn kho
Hệ thống sử dụng cơ sở dữ liệu PostgreSQL chuẩn hóa với 3 bảng cốt lõi:

#### 1. Bảng `store_inventory` (Tồn kho theo Chi nhánh & Sản phẩm):
- `store_code` (VARCHAR): Mã chi nhánh.
- `product_id` (VARCHAR): Mã sản phẩm chuẩn (VD: `prod-sb-01`).
- `stock_quantity` (INTEGER): Tồn kho vật lý thực tế trong tủ/kệ của cửa hàng.
- `reserved` (INTEGER): Số lượng chai đang được giữ chỗ cho các đơn hàng chưa hoàn tất.
- `safety_stock` (INTEGER): Ngưỡng tồn an toàn tối thiểu (không cho phép bán chạm ngưỡng này).
- `updated_at` (TIMESTAMP): Thời điểm cập nhật cuối cùng.
- **Ràng buộc toàn vẹn (Check Constraints):**
  - `chk_store_inventory_stock_quantity`: `stock_quantity >= 0`
  - `chk_store_inventory_reserved`: `reserved >= 0`
  - `chk_store_inventory_sellable`: `stock_quantity >= reserved`

#### 2. Bảng `stock_reservations` (Phiếu giữ chỗ tạm thời):
- `id` (VARCHAR/UUID): Khóa chính phiếu giữ chỗ.
- `order_id` (VARCHAR): Mã đơn hàng liên kết.
- `store_code` (VARCHAR): Chi nhánh giữ hàng.
- `product_id` (VARCHAR): Sản phẩm được giữ.
- `quantity` (INTEGER): Số chai được giữ chỗ.
- `expires_at` (TIMESTAMP): Thời điểm hết hạn giữ chỗ (Mặc định: +24 giờ từ lúc tạo đơn).
- `status` (VARCHAR): Trạng thái phiếu (`active`, `confirmed`, `released`).

#### 3. Bảng `inventory_logs` (Nhật ký Biến động Kho - Immutable Audit Log):
- `id` (SERIAL): Khóa chính.
- `store_code`, `product_id`: Chi nhánh và mặt hàng.
- `change_type`: Loại biến động (`reservation_created`, `order_confirmed`, `reservation_released`, `order_transfer`, `manual_adjustment`, `oversell_clamped`).
- `change_amount`: Số lượng biến động (+/- chai).
- `old_stock`, `new_stock`: Số lượng trước và sau biến động.
- `order_id`, `reason`, `created_by`: Ngữ cảnh biến động.

### 4.2. Công thức Tồn kho Khả dụng (Sellable Quantity)
$$\text{Sellable Quantity} = \text{Stock Quantity} - \text{Reserved}$$

*(Trong trường hợp cấu hình chi nhánh bật chế độ trừ tồn an toàn: $\text{Sellable} = \text{Stock Quantity} - \text{Reserved} - \text{Safety Stock}$)*.

---

### 4.3. Ba Quy trình Nghiệp vụ Biến động Kho Cốt lõi

```
[Khách bấm Đặt hàng] ──► reserveStock()   ──► Tăng reserved, Tạo stock_reservations ('active')
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
[Đơn Hủy / Quá hạn 24h]               [Đơn được Xác nhận / Giao thành công]
            │                                     │
    releaseStock()                         confirmStock()
            │                                     │
 Giảm reserved,                        Giảm cả stock_quantity VÀ reserved,
 Đổi status -> 'released'               Đổi status -> 'confirmed'
 (Kho vật lý giữ nguyên)                (Kho vật lý chính thức bị trừ)
```

#### 1. Quy trình Giữ chỗ Tồn kho (`reserveStock`):
- **Thời điểm kích hoạt:** Khi khách hàng nhấn nút "Đặt hàng" trên trang Checkout (`POST /api/orders`).
- **Xử lý gom nhóm (Bottles Aggregation):**
  Bóc tách toàn bộ các combo và sản phẩm đơn lẻ thành danh sách chai thành phần, sau đó dùng `Map<productId, quantity>` để cộng dồn nhu cầu của từng loại chai. Việc này loại bỏ rủi ro dead-lock khi 2 combo khác nhau có cùng thành phần chai.
- **Khóa bi quan chống Race Condition:**
  Trong Transaction, hệ thống thực thi lệnh khóa độc quyền từng dòng tồn kho:
  ```sql
  SELECT stock_quantity, reserved, safety_stock 
  FROM store_inventory 
  WHERE store_code = $1 AND product_id = $2 
  FOR UPDATE;
  ```
- **Kiểm tra khả dụng:**
  Nếu $\text{Sellable Quantity} < \text{Requested Quantity}$:
  $\rightarrow$ Ngay lập tức Rollback transaction, ném lỗi `InsufficientStockError`, trả về HTTP 409 Conflict cho khách hàng kèm danh sách chi tiết các mặt hàng không đủ tồn.
- **Tạo giữ chỗ:**
  Nếu đủ hàng:
  ```sql
  UPDATE store_inventory 
  SET reserved = reserved + $qty 
  WHERE store_code = $1 AND product_id = $2;
  
  INSERT INTO stock_reservations (order_id, store_code, product_id, quantity, expires_at, status)
  VALUES ($orderId, $storeCode, $productId, $qty, NOW() + INTERVAL '24 HOURS', 'active');
  ```

#### 2. Quy trình Xác nhận & Trừ kho Vật lý (`confirmStock`):
- **Thời điểm kích hoạt:** Khi đơn hàng chuyển trạng thái sang `CONFIRMED` (nhân viên xác nhận đơn hoặc xác nhận thanh toán chuyển khoản) hoặc `PROCESSING`, `SHIPPING`, `COMPLETED`.
- **Cơ chế trừ kép:**
  Hệ thống đồng thời giảm số lượng giữ chỗ và giảm số lượng tồn kho thực tế:
  ```sql
  UPDATE store_inventory
  SET stock_quantity = GREATEST(0, stock_quantity - $qty),
      reserved = GREATEST(0, reserved - $qty),
      updated_at = CURRENT_TIMESTAMP
  WHERE store_code = $storeCode AND product_id = $productId;
  
  UPDATE stock_reservations 
  SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP 
  WHERE order_id = $orderId AND status = 'active';
  ```
- **Chống kẹp âm im lặng:** Nếu `stock_quantity < quantity` (kho vật lý bất ngờ bị thiếu hụt thực tế ngoài đời), hệ thống ném `InsufficientStockConfirmError` để thông báo cho Quản lý. Nếu Admin cố tình ép trừ (`allowOversellClamped`), hệ thống sẽ kẹp về 0 và ghi log loại `oversell_clamped` để truy vết trách nhiệm.

#### 3. Quy trình Hoàn kho & Giải phóng Giữ chỗ (`releaseStock`):
- **Thời điểm kích hoạt:** Khi đơn hàng bị hủy (`CANCELLED`) hoặc bị từ chối phục vụ.
- **Xử lý:**
  - Nếu đơn hàng đang ở trạng thái `PENDING` (chưa trừ kho vật lý): Chỉ giải phóng phần `reserved`:
    ```sql
    UPDATE store_inventory 
    SET reserved = GREATEST(0, reserved - $qty) 
    WHERE store_code = $storeCode AND product_id = $productId;
    ```
  - Nếu đơn hàng trước đó đã từng `CONFIRMED` (đã trừ kho vật lý): Hệ thống cộng hoàn trả lại kho vật lý:
    ```sql
    UPDATE store_inventory 
    SET stock_quantity = stock_quantity + $qty 
    WHERE store_code = $storeCode AND product_id = $productId;
    ```
  - Chuyển trạng thái phiếu giữ chỗ: `status = 'released'`.

---

### 4.4. Cơ chế Tự động Dọn dẹp Giữ chỗ Quá hạn (Multi-Tier Auto Cleanup)
Để tránh tình trạng khách hàng đặt đơn ảo (giữ chỗ tồn kho khiến khách khác không mua được), hệ thống áp dụng cơ chế dọn dẹp giữ chỗ tự động 2 tầng:
- **Tầng 1 (Vercel Cron độc lập):** Chạy định kỳ mỗi 5 phút một lần (`*/5 * * * *`), gọi API `/api/cron/cleanup-reservations` với Header bảo mật `Authorization: Bearer <CRON_SECRET>`.
- **Tầng 2 (In-App Auto Trigger):** Mỗi khi có request gọi vào `/api/orders` hoặc `/api/inventory/check`, hệ thống sẽ kích hoạt một tiến trình nền bất đồng bộ (`cleanupExpiredReservations().catch(...)`) để dọn dẹp các phiếu giữ chỗ hết hạn mà không làm chậm tốc độ phản hồi của khách hàng.
- **Tiêu chí dọn dẹp:** Tìm tất cả các phiếu `stock_reservations` có `status = 'active'` và `expires_at < NOW()`, tự động hoàn trả `reserved` về kho và cập nhật đơn hàng thành `CANCELLED (Hết hạn giữ chỗ)`.

---

## 5. QUY TRÌNH ĐẶT HÀNG, THANH TOÁN & ĐIỀU PHỐI ĐƠN HÀNG

### 5.1. Vòng đời Trạng thái Đơn hàng (Order State Machine)

```
[Khách tạo đơn] ──► PENDING (Chờ duyệt / Chờ thanh toán)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   CONFIRMED       PROCESSING         CANCELLED
 (Đã duyệt đơn)  (Đang đóng gói)    (Hủy đơn / Trả kho)
        │                │
        └────────┬───────┘
                 ▼
              SHIPPING (Shipper đang giao hàng)
                 │
                 ▼
             COMPLETED (Giao thành công & Thu tiền)
```

| Trạng thái | Diễn giải nghiệp vụ | Thao tác Tồn kho tương ứng |
| :--- | :--- | :--- |
| **`PENDING`** | Đơn hàng mới tạo thành công trên web, chờ cửa hàng liên hệ xác nhận hoặc chờ khách chuyển khoản QR. | Giữ chỗ tồn kho (`reserved + N`), kho vật lý chưa trừ. |
| **`CONFIRMED`** | Nhân viên chi nhánh đã gọi điện thoại xác nhận với khách hoặc nhận được tiền chuyển khoản. | Trừ kho vật lý (`stock_quantity - N`, `reserved - N`). |
| **`PROCESSING`** | Nhân viên đang lấy chai từ tủ mát, đóng thùng, dán nhãn, chuẩn bị bàn giao cho shipper. | Đảm bảo kho vật lý đã được trừ đầy đủ. |
| **`SHIPPING`** | Đơn hàng đã bàn giao cho nhân viên giao hàng của cửa hàng hoặc đơn vị vận chuyển công nghệ. | Kho đã trừ. Theo dõi hành trình giao. |
| **`COMPLETED`** | Khách đã nhận đủ hàng và thanh toán đủ tiền COD (hoặc đơn đã thanh toán trước thành công). | Đơn hoàn tất 100%. Ghi nhận doanh thu và lợi nhuận. |
| **`CANCELLED`** | Đơn bị hủy do khách đổi ý, số điện thoại không liên lạc được, hoặc quá hạn giữ chỗ 24h. | Hoàn trả giữ chỗ hoặc hoàn lại kho vật lý (`releaseStock`). |

---

### 5.2. Chính sách Thanh toán & Kiểm soát Rủi ro COD

#### 1. Các phương thức thanh toán hỗ trợ:
- **`COD` (Thanh toán tiền mặt khi nhận hàng):** Khách thanh toán cho shipper khi cầm hàng trên tay.
- **`BANK_TRANSFER` (Chuyển khoản qua mã VietQR động):** Hệ thống sinh mã QR ngân hàng chuẩn NAPAS kèm nội dung chuyển khoản chứa Mã đơn hàng.
- **`PICKUP` (Nhận tại cửa hàng):** Khách đến chi nhánh thanh toán trực tiếp bằng tiền mặt hoặc quẹt thẻ.

#### 2. Quy tắc kiểm soát rủi ro chống boom hàng & spam đơn COD (`COD_VALIDATION`):
- **Giá trị đơn COD tối đa:** Không quá **10.000.000 VNĐ**. Nếu giỏ hàng vượt 10 triệu đồng, khách hàng bắt buộc phải thanh toán chuyển khoản trước hoặc liên hệ hotline đặt cọc.
- **Giới hạn đơn PENDING theo Số điện thoại:** Mỗi số điện thoại chỉ được phép có tối đa **3 đơn hàng ở trạng thái `PENDING`** cùng lúc. Đơn thứ 4 sẽ bị hệ thống từ chối nhằm ngăn chặn hành vi spam phá kho.
- **Giới hạn tần suất đặt hàng (Rate Limit):** Giữa 2 lần tạo đơn từ cùng một số điện thoại phải cách nhau tối thiểu **5 phút**.
- **Xác thực định dạng số điện thoại:** Số điện thoại bắt buộc phải khớp đầu số các nhà mạng Việt Nam (Viettel, Vinaphone, Mobifone, Vietnamobile...) qua chuẩn Regex:
  `^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[1-689]|9[0-46-9])\d{7}$`
- **Độ dài địa chỉ giao hàng:** Địa chỉ phải có tối thiểu **10 ký tự** (ngăn chặn nhập địa chỉ rác như "a", "123").

---

### 5.3. Chính sách Phí Vận chuyển (Shipping Fee Rules)
- **Cấu hình chuẩn đang áp dụng:**
  - Phí giao hàng tiêu chuẩn đồng giá nội thành: **30.000 VNĐ**.
  - Ngưỡng miễn phí vận chuyển (Freeship Policy): Đơn hàng có tổng tiền hàng (Subtotal) từ **200.000 VNĐ** trở lên được **MIỄN PHÍ VẬN CHUYỂN TOÀN BỘ (0 VNĐ)**.
- **Cơ chế tính phí theo khoảng cách (Dự phòng mở rộng):**
  - Dưới 3 km: 15.000 VNĐ.
  - Từ 3 km đến 6 km: 25.000 VNĐ.
  - Từ 6 km đến 10 km: 35.000 VNĐ.
  - Từ 10 km đến 25 km: 50.000 VNĐ.
  - Bán kính giao hàng tối đa: 25 km.

---

### 5.4. Nghiệp vụ Điều chuyển Đơn hàng Đa Chi nhánh (Atomic Order Transfer)
Trong thực tế vận hành chuỗi F&B, khi Chi nhánh A (nguồn tiếp nhận đơn ban đầu) gặp sự cố đột xuất (hết đá, shipper không nhận chuyến, sự cố mất điện, hoặc hết một loại chai trong combo), Ban Quản lý được phép điều chuyển đơn hàng sang Chi nhánh B (chi nhánh đích).

#### Quy trình Chuyển đơn Nguyên tử (Atomic Transfer Flow - `/api/admin/orders/transfer`):
Mọi bước chuyển kho bắt buộc phải nằm trọn vẹn trong **01 Transaction Cơ sở dữ liệu duy nhất**:
1. **Kiểm tra quyền hạn:** Chỉ tài khoản có quyền `orders.transfer` (Super Admin hoặc Cửa hàng trưởng được ủy quyền) mới được thực hiện.
2. **Khóa và Kiểm tra tồn kho tại Kho B (Kho nhận):**
   Thực thi lệnh khóa `SELECT ... FOR UPDATE` trên các mặt hàng của đơn tại `target_store`.
   - **QUY TẮC AN TOÀN:** Nếu Chi nhánh B **THIẾU BẤT KỲ MẶT HÀNG NÀO** $\rightarrow$ Hệ thống lập tức hủy bỏ giao dịch (Rollback), không cho phép chuyển đơn, báo lỗi rõ ràng cho quản trị viên.
3. **Giải phóng tồn kho tại Kho A (Kho chuyển):**
   Nếu đơn đang giữ chỗ tại Kho A: Giảm `reserved` tại Kho A và hủy phiếu giữ chỗ cũ.
4. **Tạo giữ chỗ tại Kho B (Kho nhận):**
   Tăng `reserved` tại Kho B và tạo phiếu `stock_reservations` mới với thời hạn 24 giờ.
5. **Cập nhật đơn hàng:**
   Đổi `orders.store_code = target_store`.
6. **Ghi sổ nhật ký (Audit Log):**
   Ghi lại chi tiết: Người thực hiện chuyển, Kho đi, Kho đến, Lý do chuyển đơn, Thời gian thực hiện.

---

## 6. HỆ THỐNG PHÂN QUYỀN QUẢN TRỊ & BẢO VỆ PHẠM VI CHI NHÁNH

### 6.1. Ma trận Vai trò Người dùng (Roles & Responsibilities)
Hệ thống Core V1.0 thiết lập 3 vai trò phân quyền chặt chẽ:

```
                      ┌─────────────────────────┐
                      │       SUPER_ADMIN       │
                      │ (Toàn quyền hệ thống)   │
                      └────────────┬────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼                                           ▼
   ┌───────────────────┐                       ┌───────────────────┐
   │     MARKETING     │                       │    STORE_STAFF    │
   │  (Sản phẩm, Giá   │                       │ (Bán hàng & Kho   │
   │   Combo, Banner)  │                       │  theo Chi nhánh)  │
   └───────────────────┘                       └───────────────────┘
```

| Quyền hạn cụ thể | `SUPER_ADMIN` | `MARKETING` | `STORE_STAFF` |
| :--- | :---: | :---: | :---: |
| **Xem Dashboard toàn công ty** (`dashboard.view_company`) | ✅ Có | ❌ Không | ❌ Không |
| **Xem Dashboard chi nhánh được phân công** (`dashboard.view_store`) | ✅ Có | ❌ Không | ✅ Có |
| **Xem giá vốn sản phẩm** (`cost_price.view`) | ✅ Có | ❌ Không | ❌ Không |
| **Chỉnh sửa giá vốn sản phẩm** (`cost_price.edit`) | ✅ Có | ❌ Không | ❌ Không |
| **Xem báo cáo lợi nhuận gộp** (`profit.view`) | ✅ Có | ❌ Không | ❌ Không |
| **Quản lý danh mục & giá bán lẻ** (`products.manage_price`) | ✅ Có | ✅ Có | ❌ Không |
| **Quản lý nội dung, Banner, Combo** (`combos.manage`, `content.manage`) | ✅ Có | ✅ Có | ❌ Không |
| **Quản lý tài khoản nhân viên** (`users.manage`) | ✅ Có | ❌ Không | ❌ Không |
| **Xem đơn hàng tất cả chi nhánh** (`orders.view_all`) | ✅ Có | ❌ Không | ❌ Không |
| **Xem đơn hàng của chi nhánh mình** (`orders.view_own_store`) | ✅ Có | ❌ Không | ✅ Có (Chỉ kho mình) |
| **Cập nhật trạng thái đơn chi nhánh mình** (`orders.update_status_own_store`) | ✅ Có | ❌ Không | ✅ Có |
| **Điều chuyển đơn giữa các chi nhánh** (`orders.transfer`) | ✅ Có | ❌ Không | ❌ Không |
| **Xem tồn kho tất cả chi nhánh** (`inventory.view_all`) | ✅ Có | ❌ Không | ❌ Không |
| **Xem & chỉnh sửa tồn kho chi nhánh mình** (`inventory.update_own_store`) | ✅ Có | ❌ Không | ✅ Có (Chỉ kho mình) |
| **Xem thông tin khách hàng đầy đủ** (`members.view_full`) | ✅ Có | ❌ Không | ❌ Không |
| **Xem thông tin khách hàng bị che** (`members.view_masked`) | ✅ Có | ❌ Không | ✅ Có (Che PII) |
| **Xem nhật ký kiểm toán hệ thống** (`audit.view`) | ✅ Có | ❌ Không | ❌ Không |

---

### 6.2. Cơ chế Phân lập Dữ liệu Chi nhánh & Chống IDOR (Anti-IDOR Protection)
- **Định danh phiên làm việc (Session Scope):** Mỗi tài khoản nhân viên khi đăng nhập (`STORE_STAFF`) đều gắn liền với một trường `storeCode` trong JWT Token và Session Database.
- **Kiểm soát truy cập cấp độ dòng (Row-Level Security / API Middleware):**
  - Mọi API truy vấn đơn hàng (`GET /api/admin/orders`) hoặc tồn kho (`GET /api/admin/inventory`) đều tự động chèn mệnh đề lọc:
    `WHERE store_code = session.storeCode`.
  - Nếu nhân viên chi nhánh A cố tình gửi request với tham số `store_code = B` hoặc truy cập mã đơn hàng của chi nhánh B bằng cách đoán ID (Tấn công IDOR - Insecure Direct Object References), Middleware chặn đứng và trả về ngay lập tức:
    `HTTP 403 Forbidden - Bạn không có quyền truy cập dữ liệu của chi nhánh này!`

---

### 6.3. Chính sách Che giấu Dữ liệu Nhạy cảm Khách hàng (PII Masking)
Nhằm tuân thủ bảo vệ quyền riêng tư người dùng và tránh nhân viên cửa hàng lấy cắp dữ liệu khách hàng:
- **Số điện thoại:** Nhân viên `STORE_STAFF` chỉ nhìn thấy định dạng che: `091****433`. Chỉ khi bấm gọi xác nhận trên hệ thống tổng đài tích hợp hoặc Super Admin mới thấy số đầy đủ.
- **Địa chỉ chi tiết:** Che một phần số nhà trong danh sách tổng quan, chỉ hiện đầy đủ trên phiếu in giao hàng khi đơn chuyển sang `SHIPPING`.

---

## 7. QUẢN TRỊ GIÁ VỐN & BÁO CÁO LỢI NHUẬN GỘP

### 7.1. Chụp giá vốn tại thời điểm bán (Cost Price Snapshotting)
Một trong những nguyên lý nghiệp vụ tài chính quan trọng nhất của hệ thống Thái Sơn Foods là:
- Giá vốn sản phẩm (`cost_price` trong bảng `products`) có thể biến động theo thời gian (giá bắp tươi, giá hạt sen theo mùa vụ thay đổi).
- **Quy tắc Snapshot:** Khi khách hàng đặt đơn hàng, hệ thống lập tức sao chép giá vốn hiện hành của từng sản phẩm tại thời điểm đó và lưu trực tiếp vào cột `order_items.cost_price`.
- **Lợi ích:** Đảm bảo báo cáo kết quả kinh doanh và biên lợi nhuận của các đơn hàng trong quá khứ phản ánh chính xác 100% chi phí thực tế tại thời điểm phát sinh đơn, không bị méo mó khi công ty điều chỉnh giá vốn sản phẩm trong tương lai.

### 7.2. Công thức Báo cáo Lợi nhuận Gộp (`/api/admin/reports/profit`)
Báo cáo tài chính chỉ cung cấp cho tài khoản có quyền `profit.view` (`SUPER_ADMIN`):
- **Doanh thu thuần (Net Revenue):**
  $$\text{Doanh thu} = \sum_{\text{Đơn hoàn tất}} (\text{Giá bán} \times \text{Số lượng}) - \text{Giảm giá}$$
- **Tổng giá vốn hàng bán (Cost of Goods Sold - COGS):**
  $$\text{Giá vốn} = \sum_{\text{Đơn hoàn tất}} (\text{Giá vốn snapshot} \times \text{Số lượng})$$
- **Lợi nhuận gộp (Gross Profit):**
  $$\text{Lợi nhuận gộp} = \text{Doanh thu} - \text{Giá vốn}$$
- **Biên lợi nhuận gộp (Gross Profit Margin):**
  $$\text{Biên lợi nhuận} = \left( \frac{\text{Lợi nhuận gộp}}{\text{Doanh thu}} \right) \times 100\%$$

---

## 8. KIỂM SOÁT RỦI RO, BẢO MẬT & ĐỐI SOÁT DỮ LIỆU

### 8.1. Khởi động An toàn Môi trường Production (Fail-Closed Startup Engine)
Hệ thống tích hợp cơ chế tự kiểm tra nghiêm ngặt ngay khi ứng dụng khởi động (`validateProductionEnvironment`):
- Nếu chạy môi trường `production`, hệ thống bắt buộc kiểm tra:
  1. `CRON_SECRET` phải tồn tại và có độ dài tối thiểu 16 ký tự.
  2. `JWT_SECRET` phải là chuỗi ngẫu nhiên bảo mật mạnh tối thiểu 32 ký tự, không được dùng chuỗi mặc định.
  3. Cờ kiểm thử `ENABLE_MOCK_OAUTH` bắt buộc phải là `false` (chống tạo phiên giả mạo).
  4. Phải có kết nối cơ sở dữ liệu `DATABASE_URL` hoặc `POSTGRES_URL`.
- Nếu thiếu bất kỳ tiêu chí nào, hệ thống từ chối khởi động (Fail-closed) để ngăn ngừa lỗ hổng bảo mật.

### 8.2. Bảo vệ Chống Trùng lặp Khóa Đơn Hàng (Order Collision Prevention)
- Định dạng mã đơn hàng được sinh bằng thuật toán ngẫu nhiên bảo mật (`crypto.randomBytes`).
- Hệ thống bọc trong vòng lặp thử lại tự động (Retry Loop) xử lý bắt mã lỗi PostgreSQL `23505` (Unique Violation), đảm bảo 100% không bao giờ xảy ra tình trạng trùng lặp mã đơn kể cả khi hàng ngàn đơn hàng phát sinh đồng thời trong các đợt flash sale.

### 8.3. Bảo vệ Tấn công Giả mạo Yêu cầu (CSRF Protection) & Header An toàn OWASP
- Tất cả các request làm thay đổi trạng thái (POST, PUT, DELETE, PATCH) trong phân hệ Quản trị đều bắt buộc có CSRF Token hợp lệ.
- Cấu hình chuẩn OWASP Security Headers trên toàn bộ trang:
  - `X-Frame-Options: SAMEORIGIN` (Chống Clickjacking).
  - `X-Content-Type-Options: nosniff` (Chống MIME-type sniffing).
  - `Strict-Transport-Security` (Ép buộc kết nối HTTPS).
  - `Content-Security-Policy-Report-Only` (Giám sát mã độc XSS).

### 8.4. Bảo vệ Cron Job Dọn dẹp Tồn kho
Endpoint `/api/cron/cleanup-reservations` được bảo vệ bằng cơ chế so sánh chuỗi thời gian không đổi (`crypto.timingSafeEqual`) đối với chuỗi Bearer Token, triệt tiêu hoàn toàn nguy cơ bị tấn công dò tìm khóa qua độ trễ mạng (Timing Attack).

---

## 9. BẢNG MA TRẬN PHÂN ĐỊNH RANH GIỚI V1.0 VS MODULE ĐỐI TÁC

Bảng dưới đây xác định ranh giới rõ ràng giữa **Nghiệp vụ Hệ thống Cốt lõi V1.0 (trước ngày 08/10/2026)** và **Phân hệ Đối tác Mở rộng (Partner Module mới commit trưa ngày 08/10/2026)**:

| Phân hệ / Nghiệp vụ | Hệ thống Cốt lõi V1.0 (Mốc 3 ngày trước) | Phân hệ Đối tác Mới (Commit 08/10/2026) |
| :--- | :--- | :--- |
| **Đối tượng người dùng** | Khách lẻ D2C (Khách vãng lai & Thành viên Member tích điểm). | Cộng tác viên (CTV) và Đại lý nhập sỉ (Dealer). |
| **Cơ chế đặt hàng** | Đặt hàng lẻ trên Website theo giá niêm yết chuẩn, quy cách Lốc/Thùng. | Đặt hàng qua liên kết giới thiệu Affiliate (Cookie 30 ngày) hoặc Đại lý đặt sỉ số lượng lớn (>100 chai). |
| **Chính sách giá** | Giá bán lẻ niêm yết công khai thống nhất toàn hệ thống. | Bảng giá Đại lý chiết khấu theo cấp bậc (Tier 1, 2, 3), hoa hồng CTV theo sản phẩm. |
| **Mô hình Tồn kho** | Tồn kho tổng thời gian thực theo Cửa hàng (`store_inventory`), giữ chỗ theo đơn (`stock_reservations`). | Bổ sung quản lý Xuất kho theo Lô và Hạn sử dụng (FEFO - First Expired First Out) cho đơn hàng Đại lý. |
| **Quy trình Thanh toán** | COD, Chuyển khoản VietQR, Trả tiền mặt tại quầy. | Bổ sung Ví số dư hoa hồng CTV (`partner_ledger`), Yêu cầu rút tiền (`payout_requests`), Hạn mức nợ Đại lý. |
| **Phân quyền Quản trị** | `SUPER_ADMIN`, `MARKETING`, `STORE_STAFF` (Store Scoped). | Mở rộng thêm quyền: `partners.view`, `partners.review`, `partners.suspend`, `payouts.approve`, `dealer.manage`. |
| **Bảo toàn Kiến trúc** | **Là NỀN TẢNG BẤT BIẾN:** Mọi luồng giỏ hàng, chọn cửa hàng, trừ kho, thanh toán của V1.0 được giữ nguyên 100%. | Module Đối tác chỉ là một tầng mở rộng độc lập, không làm thay đổi luồng mua bán lẻ của khách hàng thông thường. |

---

## 10. KẾT LUẬN & HƯỚNG DẪN BẢO TOÀN NGHIỆP VỤ

1. Toàn bộ các đặc tả nghiệp vụ trong tài liệu này phản ánh chính xác cấu trúc logic và quy tắc vận hành đã được kiểm toán toàn diện của chuỗi Thái Sơn Foods tại phiên bản hoàn thiện Go-Live V1.0 (trước ngày 08/10/2026).
2. Khi phát triển các tính năng mới hoặc bảo trì hệ thống, các kỹ sư phần mềm bắt buộc phải tuân thủ nghiêm ngặt các nguyên tắc:
   - **Không phá vỡ ràng buộc tồn kho:** Mọi thao tác giảm kho vật lý phải đi qua giữ chỗ (`reserveStock`) và trừ kép (`confirmStock`), không bao giờ trừ trực tiếp ngoài luồng.
   - **Không phá vỡ định tuyến chi nhánh:** Luôn tôn trọng chi nhánh khách hàng đã chọn hoặc thuật toán khoảng cách kết hợp tồn khả dụng.
   - **Bảo toàn quy cách quy đổi chai:** Mọi đơn vị lốc, thùng bắt buộc phải nhân đúng hệ số `bottle_multiplier` trước khi can thiệp vào kho chai lẻ.
   - **Bảo mật phạm vi Store:** Tuyệt đối không cho phép nhân viên cửa hàng đọc hoặc sửa dữ liệu ngoài phạm vi `store_code` được cấp phép.

---
*(Tài liệu này được sao lưu và lưu trữ chính thức tại `docs/tai-lieu-nghiep-vu-he-thong-thai-son-foods-v1.md` thuộc mã nguồn dự án Thái Sơn Foods)*
