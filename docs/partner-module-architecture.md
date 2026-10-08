# TÀI LIỆU THIẾT KẾ KIẾN TRÚC MIỀN NGHIỆP VỤ (DOMAIN ARCHITECTURE)
## PHÂN HỆ ĐỐI TÁC: PARTNER → CTV → ĐẠI LÝ (THÁI SƠN FOODS)

- **Phiên bản:** 1.0.0
- **Tác giả:** Principal Full-Stack Engineer + Senior Product/UX Architect + Business Analyst
- **Trạng thái:** Thiết kế chuẩn mực thực thi trực tiếp vào mã nguồn `thai-son-foods`

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Phân hệ Đối tác được xây dựng trên nguyên tắc mở rộng kiến trúc hiện tại của website Thái Sơn Foods, không làm gián đoạn hay thay đổi luồng đặt hàng bán lẻ cốt lõi.

```
+-----------------------------------------------------------------------------------+
|                                  THÁI SƠN FOODS                                   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                        TÀI KHOẢN NGƯỜI DÙNG (users)                       |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         | 1:1                                     |
|   +-------------------------------------v-------------------------------------+   |
|   |                  HỒ SƠ ĐỐI TÁC (partner_profiles)                        |   |
|   |   - partner_code (TSF-CTV-xxxx)       - partner_type (CTV | DEALER)       |   |
|   |   - lifecycle_status                  - tier_id (dealer_tiers)            |   |
|   +-------------------+-----------------------------------+-------------------+   |
|                       |                                   |                       |
|           +-----------v-----------+           +-----------v-----------+           |
|           |   CỘNG TÁC VIÊN (CTV) |           |      ĐẠI LÝ (DEALER)  |           |
|           +-----------+-----------+           +-----------+-----------+           |
|                       |                                   |                       |
|   - Giới thiệu khách qua link/ref code    - Nhập hàng số lượng lớn (>100 chai)    |
|   - Nhận hoa hồng trên đơn hợp lệ         - Áp dụng bảng giá Đại lý theo Tier     |
|   - TSF ship hàng, thu COD, đối soát      - Thanh toán Bank Transfer / Hạn mức    |
|   - Tích lũy điều kiện nâng cấp Đại lý    - Quản lý xuất kho theo FEFO (Lô/Date)  |
+-----------------------------------------------------------------------------------+
```

---

## 2. VÒNG ĐỜI ĐỐI TÁC (PARTNER LIFECYCLE STATE MACHINE)

```
                       [Đăng ký Lớp 1 (SĐT + OTP + Tên)]
                                      │
                                      ▼
                                    LITE
                     (Đã có link/mã ref, được giới thiệu,
                      CHƯA được rút tiền)
                                      │
                         [Nộp hồ sơ Lớp 2 (CCCD + Bank)]
                                      │
                                      ▼
                                  SUBMITTED
                                      │
                                      ▼
                                UNDER_REVIEW
                                 /         \
                 [Admin Duyệt]  /           \  [Admin Từ chối]
                               ▼             ▼
                            APPROVED      REJECTED
                               │             │
                    [Kích hoạt mã chính thức] [Cho phép nộp lại]
                               │
                               ▼
                             ACTIVE
                            /      \
             [Phát hiện gian lận]   \ [Đạt tiêu chí nâng cấp]
                    /                \
                   ▼                  ▼
               SUSPENDED            DEALER
         (Vẫn ghi nhận click, (Chuyển đổi sang cấp Đại lý,
          khóa rút tiền payout) hưởng chiết khấu & giá sỉ)
                   │
         [Admin Re-activate]
                   │
                   ▼
                 ACTIVE
```

### Chi tiết các trạng thái:
1. **LITE:** Đăng ký thành công lớp 1 qua Số điện thoại + OTP + Họ tên. Đã được cấp mã đối tác tạm thời, có thể lấy link giới thiệu đi chia sẻ. Chưa được rút tiền.
2. **SUBMITTED:** Đã hoàn thành thông tin lớp 2 (Số CCCD, Ngân hàng, Tên chủ tài khoản, Chi nhánh). Hồ sơ chuyển vào hàng đợi xét duyệt của Admin.
3. **UNDER_REVIEW:** Admin hoặc bộ phận vận hành đang tiến hành thẩm định thông tin định danh và tài khoản ngân hàng.
4. **APPROVED:** Hồ sơ được phê duyệt hợp lệ.
5. **ACTIVE:** Đối tác hoạt động đầy đủ tính năng: chia sẻ link, theo dõi đơn hàng, nhận hoa hồng, tạo yêu cầu rút tiền.
6. **SUSPENDED:** Bị tạm khóa do nghi ngờ gian lận hoặc vi phạm chính sách. Vẫn lưu lịch sử đơn và attribution, nhưng khóa chức năng rút tiền (`payout_requests`).
7. **REJECTED:** Hồ sơ bị từ chối kèm lý do (ví dụ: ảnh CCCD mờ, tên tài khoản ngân hàng không khớp họ tên). Cho phép đối tác cập nhật lại thông tin.

---

## 3. CƠ CHẾ GHI NHẬN ĐƠN HÀNG GIỚI THIỆU (REFERRAL & ATTRIBUTION ENGINE)

### 3.1. Quy tắc Last-Click Attribution
- Khách hàng bấm vào link có query param `?ref=TSF-CTV-XXXX`.
- Hệ thống ghi nhận lượt click vào bảng `referral_clicks` (IP, User Agent, Referrer, Landing Page).
- Hệ thống thiết lập cookie an toàn:
  - Tên cookie: `tsf_partner_ref`
  - Giá trị: Mã đối tác được mã hóa kèm chữ ký HMAC (hoặc định dạng an toàn chống giả mạo)
  - Thuộc tính: `Path=/`, `Max-Age=30 ngày` (cấu hình trong `PARTNER_CONFIG.COOKIE_EXPIRY_DAYS`), `SameSite=Lax`.
- **Nguyên tắc Last-Click:** Nếu khách hàng bấm link của CTV A, sau đó bấm link của CTV B, cookie sẽ cập nhật sang CTV B. Đơn hàng phát sinh sẽ được tính cho CTV B.

### 3.2. Chống Gian Lận Tự Mua (Anti-Self-Referral & Fraud Rules)
Khi khách hàng đặt hàng tại `/api/orders`:
- Hệ thống kiểm tra đối chiếu thông tin người đặt với hồ sơ của CTV:
  1. `phone`: SĐT người nhận trùng với SĐT của CTV sở hữu mã ref.
  2. `email`: Email người nhận trùng với Email của CTV.
  3. `user_id`: Tài khoản người mua trùng với tài khoản `user_id` của CTV.
- Nếu phát hiện trùng lặp: Đơn hàng vẫn được tạo bình thường (không làm gián đoạn trải nghiệm khách mua), nhưng bản ghi `order_attributions` được gắn cờ `is_self_referral = true` và `status = 'FLAGGED'`. Hệ thống **không tạo hoa hồng** cho đơn hàng tự mua này.

### 3.3. Tích hợp Transaction An toàn với Luồng Tạo Đơn
Tại `src/app/api/orders/route.ts`:
```sql
BEGIN;
-- 1. Insert đơn hàng
INSERT INTO orders (...) VALUES (...);
-- 2. Insert chi tiết món
INSERT INTO order_items (...) VALUES (...);
-- 3. Khóa kho và giữ chỗ
SELECT reserveStock(...);
-- 4. Ghi nhận attribution trong CÙNG transaction
INSERT INTO order_attributions (
  id, order_id, partner_id, referral_code, attribution_method,
  snapshot_commission_rate, snapshot_policy_id, status, created_at
) VALUES (...);
-- 5. Khởi tạo dòng thu nhập dự kiến (ESTIMATED) trong sổ cái
INSERT INTO partner_ledger (
  id, partner_id, order_id, type, amount, direction, status, available_at, ...
) VALUES (...);
COMMIT;
```
*Lưu ý cốt lõi:* Nếu `reserveStock()` quăng lỗi `InsufficientStockError`, toàn bộ transaction bị `ROLLBACK`. Không có bất kỳ attribution hay hoa hồng nào bị lưu rác.

---

## 4. SỔ CÁI BẤT BIẾN & CÁC TRẠNG THÁI THU NHẬP (PARTNER LEDGER)

Bảng `partner_ledger` là nguồn sự thật tài chính duy nhất. Mọi biến động số dư chỉ được thực hiện bằng cách thêm dòng mới (Append-only), không chỉnh sửa lịch sử dòng cũ.

### 4.1. Chu trình Trạng thái Thu nhập (Income Statuses)
```
      [Đơn hàng PENDING vừa tạo]
                  │
                  ▼
              ESTIMATED (Dự kiến)
                  │
                  ├──────────────────────┐
                  │                      │ [Đơn bị Hủy trước khi giao]
                  │                      ▼
                  │                    VOID (Vô hiệu hóa)
                  │
     [Đơn COMPLETED & Đã đối soát COD]
                  │
                  ▼
              CONFIRMED (Xác nhận)
                  │
      [Sau N ngày chờ khiếu nại: now >= available_at]
                  │
                  ▼
              AVAILABLE (Khả dụng - Có thể rút)
                  │
                  ├──────────────────────┐
                  │                      │ [Khách trả hàng sau khi khả dụng]
                  │                      ▼
                  │                  CLAWBACK (Tạo dòng âm thu hồi)
                  │
           [Duyệt rút tiền]
                  │
                  ▼
                PAID (Đã thanh toán qua ngân hàng)
                  │
                  │ [Khách trả hàng sau khi đã chi trả hoa hồng]
                  ▼
            CLAWBACK ÂM (Số dư ví thành âm, cấn trừ vào đơn sau)
```

### 4.2. Thời điểm Khả dụng Độc lập (`available_at`)
- Khi một đơn hàng chuyển sang `CONFIRMED`, hệ thống ghi trường:
  `available_at = CURRENT_TIMESTAMP + INTERVAL '7 days'` (cấu hình trong chính sách hoa hồng).
- Khi tính toán số dư khả dụng (`available_balance`), hệ thống dùng điều kiện SQL:
  ```sql
  WHERE (status = 'AVAILABLE' OR (status = 'CONFIRMED' AND CURRENT_TIMESTAMP >= available_at))
  ```
- Nhờ vậy, tính chính xác tài chính **hoàn toàn không phụ thuộc vào cron job**. Dù cron dọn dẹp có chạy chậm hay máy chủ khởi động lại, số dư vẫn tự động đạt mức khả dụng đúng thời điểm.

---

## 5. QUY TRÌNH THANH TOÁN HOA HỒNG (PAYOUT ENGINE)

1. **Tạo yêu cầu (`payout_requests`):**
   - CTV gửi yêu cầu rút tiền với số tiền $X$.
   - Điều kiện: Tài khoản `ACTIVE`, `available_balance >= X`, $X \ge \text{MIN\_PAYOUT}$ (mặc định 200.000 đ), không có yêu cầu rút tiền khác đang ở trạng thái `PENDING`.
   - Hệ thống tạo dòng `payout_requests` với trạng thái `PENDING` và ghi nhận một dòng tạm giữ trong sổ cái (hoặc khóa số dư khả dụng) để chống double-payout.
2. **Kế toán kiểm tra & Duyệt:**
   - Kế toán kiểm tra đối chiếu tên tài khoản ngân hàng và hóa đơn/bảng kê.
   - Thao tác `APPROVE` -> Kế toán thực hiện lệnh chuyển khoản qua ngân hàng.
   - Thao tác `MARK_AS_PAID` (nhập mã giao dịch ngân hàng / Bank Ref) -> Cập nhật trạng thái `PAID`, sinh dòng ghi nợ `DEBIT` chính thức trong `partner_ledger`.
   - Thao tác `REJECT` (nếu thông tin tài khoản sai) -> Hoàn lại số dư khả dụng cho CTV.

---

## 6. KIẾN TRÚC ĐẠI LÝ (DEALER SUBSYSTEM)

Đại lý không phải là hệ thống độc lập mà là cấp độ phát triển cao nhất của Partner.

### 6.1. Tiêu chí Nâng cấp Tự động / Xét duyệt
- Bảng `dealer_tiers`:
  - `tier_code`: VÀNG, BẠCH KIM, KIM CƯƠNG (hoặc TIER_1, TIER_2, TIER_3).
  - `min_monthly_revenue`: Doanh số CTV tích lũy tối thiểu (ví dụ 20.000.000 đ).
  - `min_monthly_orders`: Số lượng đơn CTV thành công tối thiểu (ví dụ 30 đơn).
  - `discount_rate`: Chiết khấu giá sỉ theo tier (ví dụ 15%, 20%, 25%).
  - `credit_limit`: Hạn mức công nợ tối đa (nếu được cấp phép).
- CTV theo dõi thanh tiến độ trên Dashboard. Khi đủ điều kiện, nút "Đăng ký Nâng cấp Đại lý" mở khóa. Sau khi gửi yêu cầu, Admin duyệt -> Hồ sơ đổi thành `partner_type = 'DEALER'`, kích hoạt giao diện và bảng giá Đại lý.

### 6.2. Đơn hàng Đại lý & Quản lý Thanh toán
- Đơn hàng của Đại lý mang thuộc tính `order_channel = 'DEALER_PURCHASE'`.
- Quy định giá: Tự động tính toán giá chiết khấu dựa trên Tier hiện tại của Đại lý.
- Quy trình thanh toán:
  - Bổ sung trường `payment_status` (`UNPAID`, `PENDING_REVIEW`, `PAID`, `REFUNDED`).
  - Đại lý thanh toán chuyển khoản, đính kèm ảnh ủy nhiệm chi.
  - Kế toán xác nhận nhận tiền -> Cập nhật `payment_status = 'PAID'` -> Cho phép xuất kho giao hàng.

---

## 7. QUẢN LÝ LÔ HÀNG & THUẬT TOÁN FEFO (INVENTORY LOTS & EXPIRY)

Đối với các đơn sỉ Đại lý (vài trăm đến vài nghìn chai), hàng hóa date ngắn của Thái Sơn Foods cần được kiểm soát theo lô:

### 7.1. Bảng `inventory_lots`
- `id`: Mã lô định danh
- `store_code`: Chi nhánh lưu kho
- `product_id`: Mã sản phẩm
- `lot_code`: Ký hiệu lô sản xuất (VD: `LOT-20261008-SB`)
- `manufacturing_date`: Ngày sản xuất
- `expiry_date`: Hạn sử dụng
- `stock_quantity`: Tồn kho vật lý của lô
- `reserved_quantity`: Giữ chỗ của lô

### 7.2. Thuật toán Xuất kho FEFO (First Expired, First Out)
Khi xuất kho đơn Đại lý:
1. Truy vấn các lô hàng còn tồn khả dụng của sản phẩm tại chi nhánh:
   ```sql
   SELECT id, lot_code, stock_quantity, reserved_quantity, expiry_date
   FROM inventory_lots
   WHERE store_code = $1 AND product_id = $2 AND (stock_quantity - reserved_quantity) > 0
   ORDER BY expiry_date ASC, manufacturing_date ASC
   FOR UPDATE;
   ```
2. Phân bổ lần lượt số lượng cần xuất từ lô có hạn dùng gần nhất đến lô có hạn dùng xa hơn.
3. Cập nhật tồn lô và đồng thời cập nhật tồn tổng trên `store_inventory` để đảm bảo 100% tương thích với luồng bán lẻ hiện có.

---

## 8. LƯỢC ĐỒ CƠ SỞ DỮ LIỆU ĐẦY ĐỦ (DATABASE SCHEMAS)

```sql
-- 1. BẢNG HỒ SƠ ĐỐI TÁC
CREATE TABLE IF NOT EXISTS partner_profiles (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_code VARCHAR(50) UNIQUE NOT NULL,
  partner_type VARCHAR(20) NOT NULL DEFAULT 'CTV', -- 'CTV' | 'DEALER'
  lifecycle_status VARCHAR(30) NOT NULL DEFAULT 'LITE', -- 'LITE' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'
  phone VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  id_card_number VARCHAR(50),
  id_card_issued_date DATE,
  id_card_issued_place VARCHAR(255),
  tax_code VARCHAR(50),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(255),
  bank_branch VARCHAR(255),
  tier_id VARCHAR(50),
  referral_count INTEGER DEFAULT 0,
  total_revenue_generated BIGINT DEFAULT 0,
  total_commission_earned BIGINT DEFAULT 0,
  current_balance BIGINT DEFAULT 0,
  verified_at TIMESTAMP WITH TIME ZONE,
  approved_by VARCHAR(50),
  rejection_reason TEXT,
  suspension_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. BẢNG TÀI LIỆU ĐỊNH DANH BẢO MẬT
CREATE TABLE IF NOT EXISTS partner_documents (
  id VARCHAR(50) PRIMARY KEY,
  partner_id VARCHAR(50) NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- 'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'BUSINESS_LICENSE' | 'TAX_DOC'
  file_path TEXT NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  verified_by VARCHAR(50),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. BẢNG CHÍNH SÁCH HOA HỒNG (CÓ HIỆU LỰC THEO THỜI GIAN)
CREATE TABLE IF NOT EXISTS partner_commission_policies (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(20) NOT NULL DEFAULT 'CTV',
  rate_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE', -- 'PERCENTAGE' | 'FIXED_PER_BOTTLE'
  rate NUMERIC(10, 2) NOT NULL DEFAULT 10.00, -- 10%
  base_type VARCHAR(50) NOT NULL DEFAULT 'PRODUCT_SUBTOTAL',
  min_order_value INTEGER DEFAULT 0,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  effective_to TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢNG THEO DÕI CLICK GIỚI THIỆU
CREATE TABLE IF NOT EXISTS referral_clicks (
  id VARCHAR(50) PRIMARY KEY,
  partner_id VARCHAR(50) NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  referer_url TEXT,
  landing_page TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. BẢNG GHI NHẬN ĐƠN HÀNG THUỘC ĐỐI TÁC
CREATE TABLE IF NOT EXISTS order_attributions (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  partner_id VARCHAR(50) NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  attribution_method VARCHAR(50) DEFAULT 'LAST_CLICK',
  is_self_referral BOOLEAN DEFAULT false,
  fraud_flags JSONB,
  policy_id VARCHAR(50) REFERENCES partner_commission_policies(id),
  snapshot_policy_name VARCHAR(255),
  snapshot_commission_rate NUMERIC(10, 2) NOT NULL,
  eligible_order_amount INTEGER NOT NULL,
  estimated_commission INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'CONFIRMED' | 'VOID' | 'FLAGGED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SỔ CÁI BẤT BIẾN CỦA ĐỐI TÁC (IMMUTABLE LEDGER)
CREATE TABLE IF NOT EXISTS partner_ledger (
  id VARCHAR(50) PRIMARY KEY,
  partner_id VARCHAR(50) NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  order_id VARCHAR(50) REFERENCES orders(id) ON DELETE SET NULL,
  entry_type VARCHAR(50) NOT NULL, -- 'COMMISSION' | 'PAYOUT' | 'CLAWBACK' | 'BONUS' | 'ADJUSTMENT'
  amount INTEGER NOT NULL, -- Dương khi thu nhập, âm khi rút/thu hồi
  direction VARCHAR(10) NOT NULL, -- 'CREDIT' | 'DEBIT'
  status VARCHAR(30) NOT NULL DEFAULT 'ESTIMATED', -- 'ESTIMATED' | 'CONFIRMED' | 'AVAILABLE' | 'PAID' | 'VOID' | 'CLAWBACK'
  available_at TIMESTAMP WITH TIME ZONE,
  policy_snapshot JSONB,
  reference_id VARCHAR(100), -- Idempotency key
  note TEXT,
  created_by VARCHAR(50) NOT NULL DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. BẢNG YÊU CẦU RÚT TIỀN (PAYOUT REQUESTS)
CREATE TABLE IF NOT EXISTS payout_requests (
  id VARCHAR(50) PRIMARY KEY,
  partner_id VARCHAR(50) NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  bank_name VARCHAR(100) NOT NULL,
  bank_account_number VARCHAR(50) NOT NULL,
  bank_account_name VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED' | 'CANCELLED'
  rejection_reason TEXT,
  bank_reference VARCHAR(100),
  reviewed_by VARCHAR(50),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  paid_by VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. BẢNG HẠNG ĐẠI LÝ & BẢNG GIÁ ĐẠI LÝ
CREATE TABLE IF NOT EXISTS dealer_tiers (
  id VARCHAR(50) PRIMARY KEY,
  tier_name VARCHAR(100) NOT NULL,
  tier_code VARCHAR(50) UNIQUE NOT NULL, -- 'TIER_1' | 'TIER_2' | 'TIER_3'
  min_monthly_revenue BIGINT DEFAULT 0,
  min_monthly_orders INTEGER DEFAULT 0,
  discount_rate NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
  credit_limit BIGINT DEFAULT 0,
  benefits_description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. BẢNG QUẢN LÝ LÔ HÀNG VÀ HẠN DÙNG (FEFO)
CREATE TABLE IF NOT EXISTS inventory_lots (
  id VARCHAR(50) PRIMARY KEY,
  store_code VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_code VARCHAR(100) NOT NULL,
  manufacturing_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  reserved_quantity INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(store_code, product_id, lot_code)
);
```

---

## 9. QUY TẮC BẢO MẬT & PHÂN QUYỀN RBAC (SECURITY ARCHITECTURE)

- **Phân tách ranh giới:**
  - Route `/doi-tac/*` và `/api/partner/*`: Dành riêng cho Partner. Xác thực thông qua cookie phiên `tsf_user_session` và kiểm tra hồ sơ `partner_profiles`.
  - Mọi API của Partner đều truyền `session.userId`, kiểm tra quyền sở hữu tuyệt đối `WHERE partner_id = :current_partner_id` để ngăn ngừa lỗ hổng IDOR.
- **Admin RBAC:**
  - Bổ sung các quyền vào `src/lib/rbac.ts`:
    - `partners.view`: Xem danh sách đối tác
    - `partners.review`: Phê duyệt/từ chối hồ sơ đăng ký đối tác
    - `partners.suspend`: Tạm khóa/kích hoạt lại tài khoản đối tác
    - `partners.policy_manage`: Cấu hình chính sách hoa hồng
    - `payouts.view`: Xem danh sách yêu cầu rút tiền
    - `payouts.approve`: Duyệt chi và xác nhận chuyển khoản rút tiền
    - `dealer.manage`: Quản lý hạng đại lý và bảng giá sỉ
