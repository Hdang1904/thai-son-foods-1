# BÁO CÁO PHÂN TÍCH KHOẢNG TRỐNG KỸ THUẬT & NGHIỆP VỤ (GAP ANALYSIS)
## DỰ ÁN PHÂN HỆ ĐỐI TÁC: PARTNER → CTV → ĐẠI LÝ (THÁI SƠN FOODS)

- **Phiên bản tài liệu:** 1.0.0
- **Tác giả:** Principal Full-Stack Engineer + Senior Product/UX Architect + Business Analyst
- **Ngày lập:** 08/10/2026
- **Phạm vi:** Đối chiếu mã nguồn hiện tại của website Thái Sơn Foods (`thai-son-foods`) với các yêu cầu của Master Goal phân hệ Đối tác.

---

## 1. TỔNG QUAN HIỆN TRẠNG (CURRENT STATE)

Hệ thống Thái Sơn Foods hiện tại là nền tảng thương mại điện tử Next.js 16.3.5 (React 19.2.8), PostgreSQL (truy vấn qua thư viện `pg` Pool thuần và `initDatabase()` trong `src/lib/db.ts`), quản lý tồn kho đa chi nhánh (38 chi nhánh) với cơ chế giữ chỗ `stock_reservations` và trừ kho vật lý `store_inventory` khi xác nhận đơn.

### 1.1. Hiện trạng Người dùng & Xác thực (Auth & Users)
- **Bảng `users`:** Lưu thông tin khách hàng bán lẻ (`id, email, password_hash, full_name, phone, address, province, district, ward, provider, provider_id, avatar_url, is_active`). Hoàn toàn **không có cột `role`**.
- **Bảng `admin_users`:** Lưu tài khoản quản trị nội bộ (`SUPER_ADMIN, MARKETING, STORE_STAFF`).
- **Phiên đăng nhập:** Khách hàng sử dụng cookie `tsf_user_session` (7 ngày); Admin sử dụng cookie `tsf_admin_token` (24 giờ).
- **Middleware:** `src/middleware.ts` chỉ bắt matcher `['/admin/:path*', '/api/admin/:path*']`. Chưa có lớp bảo vệ nào cho `/doi-tac` hay `/api/partner/*`.

### 1.2. Hiện trạng Đơn hàng & Kho (Orders & Inventory)
- **Tạo đơn (`POST /api/orders`):** Nhận đơn, bóc tách combo, mở transaction `BEGIN -> INSERT orders -> INSERT order_items -> reserveStock() (SELECT ... FOR UPDATE) -> COMMIT`.
- **Trạng thái đơn hàng:** Khách đặt là `PENDING`. Đổi sang `CONFIRMED` khi admin duyệt hoặc trừ kho. `COMPLETED` khi giao thành công. `CANCELLED` khi admin hủy, hoặc quá 24h giữ chỗ (`cleanupExpiredReservations`), hoặc hoàn COD (`processOrderReturn`).
- **Thanh toán:** Chủ yếu xử lý COD tiền mặt. Giao diện checkout gán cứng `paymentMethod = 'cod'`. Chưa có flow xác nhận chuyển khoản ngân hàng hay kiểm tra hạn mức công nợ.
- **Tồn kho:** Bảng `store_inventory` lưu duy nhất 1 dòng cho mỗi `(store_code, product_id)`. Chưa có thông tin Lô (Lot/Batch), NSX (MFG), Hạn dùng (Expiry), chưa có FEFO/FIFO.
- **Hoàn trả:** Chỉ hỗ trợ hoàn toàn bộ đơn (hủy đơn và phục hồi toàn bộ số chai hoặc ghi nhận hư hỏng toàn bộ). Không có hoàn một phần.

---

## 2. MỤC TIÊU NGHIỆP VỤ PHÂN HỆ ĐỐI TÁC (TARGET STATE)

Mô hình phân hệ thống nhất:
```
                 PARTNER (partner_profiles)
                     │
             ┌───────┴───────┐
             │               │
      CTV (Cộng tác viên)   ĐẠI LÝ (Dealer)
             │               │
     - Bán hộ / Giới thiệu   - Nhập hàng số lượng lớn
     - Nhận hoa hồng         - Giá đại lý theo Tier
     - TSF ship & thu COD    - Thanh toán Bank Transfer / Hạn mức
     - Không cần nhập hàng   - Xuất kho theo FEFO (Lot/Expiry)
```

---

## 3. BẢNG ĐỐI CHIẾU KHOẢNG TRỐNG (GAP MATRIX)

| STT | Nghiệp vụ / Kỹ thuật | Hiện trạng (Current State) | Yêu cầu mục tiêu (Target State) | Khoảng trống (Gap) & Giải pháp triển khai |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Mô hình Dữ liệu Đối tác** | Chỉ có `users` (khách) và `admin_users` (nhân viên). | Mở rộng: `users` liên kết `partner_profiles`, `partner_documents`, `partner_payment_accounts`. | Tạo bảng `partner_profiles` 1-1 với `users`, lưu cấp bậc (`partner_type: CTV / DEALER`), trạng thái lifecycle (`LITE, SUBMITTED, UNDER_REVIEW, APPROVED, ACTIVE, SUSPENDED, REJECTED`). |
| **2** | **Xác thực & Ủy quyền Partner** | Chưa có xác thực riêng cho Đối tác. Middleware chỉ chặn `/admin/*`. | Bảo vệ `/doi-tac/*` và `/api/partner/*`. Partner chỉ xem dữ liệu của chính mình. | Cập nhật `src/middleware.ts` mở rộng matcher, bổ sung helper `getPartnerSession()` giải mã session từ `tsf_user_session` kết hợp kiểm tra `partner_profiles`. |
| **3** | **Đăng ký 2 lớp & Xác minh OTP** | Đăng ký tài khoản khách lẻ thông thường không có OTP. | Lớp 1 (nhẹ: tên, SĐT, OTP) -> cấp mã giới thiệu; Lớp 2 (CCCD, Ngân hàng, MST) trước khi Payout. | Xây dựng dịch vụ `OtpService` (chế độ Dev/Staging hỗ trợ OTP mock, Production tích hợp SMS/ZNS) và bảng `partner_documents` lưu hồ sơ định danh. |
| **4** | **Bảo mật Tài liệu CCCD/Bank** | `src/app/api/admin/upload` lưu public vào `public/uploads/` không mã hóa. | Tài liệu CCCD của Đối tác phải lưu private, không public URL, kiểm tra quyền sở hữu. | Xây dựng `PrivateStorageService` lưu tại thư mục cách ly `storage/secure_documents/`, API download có kiểm tra token và phân quyền. |
| **5** | **Ghi nhận Giới thiệu (Attribution)** | Checkout không nhận `ref_code`, không lưu click, không ghi nhận người giới thiệu. | Cơ chế Last-Click qua cookie ký bảo mật (`tsf_ref`), bảng `referral_clicks`, bảng `order_attributions` tạo ngay trong transaction đặt đơn. | Bổ sung middleware/handler ghi nhận cookie `tsf_ref`, can thiệp vào `src/app/api/orders/route.ts` chèn bản ghi `order_attributions` cùng transaction với `orders`. |
| **6** | **Chống Gian lận (Anti-Fraud)** | Chỉ có rate limit IP và kiểm tra SĐT spam đơn PENDING. | Phát hiện tự mua (Self-referral), trùng SĐT, trùng Email, trùng CCCD, trùng số tài khoản ngân hàng. | Xây dựng `FraudDetectionEngine` kiểm tra đa tiêu chí, gắn cờ `fraud_flags` và chặn hoa hồng không hợp lệ. |
| **7** | **Sổ cái Thu nhập Bất biến (Ledger)** | Không có sổ cái tài chính cho CTV. | Bảng `partner_ledger` bất biến (Immutable), tính số dư theo các trạng thái: `ESTIMATED -> CONFIRMED -> AVAILABLE -> PAID -> VOID -> CLAWBACK`. | Tạo bảng `partner_ledger`, `partner_commission_policies`. Quản lý `available_at` (thời điểm khả dụng không phụ thuộc cron). |
| **8** | **Đồng bộ Vòng đời Đơn hàng** | Logic trạng thái phân tán ở 4 nơi (`orders/route.ts`, `inventory.ts`). | Mọi biến động đơn (`COMPLETED`, `COD_RECONCILED`, `CANCELLED`, `RETURNED`) phải đồng bộ sang sổ cái thu nhập. | Xây dựng hàm tập trung `processPartnerOrderEvent()` được gọi từ tất cả các điểm cập nhật trạng thái đơn hàng. |
| **9** | **Yêu cầu & Quyết toán Rút tiền (Payout)** | Chưa có nghiệp vụ rút tiền. | CTV tạo `payout_requests`, kế toán duyệt, khóa số dư chống double-payout, ghi audit log, tạo bút toán ghi nợ sổ cái. | Tạo bảng `payout_requests`, API rút tiền, quy trình duyệt cho kế toán/admin, xử lý trường hợp ví âm/bị đình chỉ (`SUSPENDED`). |
| **10** | **Phân hệ Đại lý & Hạng (Dealer Tiers)** | Chỉ có giá bán lẻ và giá combo. | Đại lý có chính sách giá riêng theo Tier (`dealer_tiers`), đặt đơn sỉ số lượng lớn, thanh toán chuyển khoản duyệt tay. | Tạo bảng `dealer_tiers`, `dealer_pricing_policies`, flow nâng cấp CTV -> Đại lý, kênh đơn hàng `order_channel: DEALER_PURCHASE`. |
| **11** | **Xác nhận Thanh toán Chuyển khoản** | Chưa có trường và quy trình duyệt tiền chuyển khoản ngân hàng. | Bổ sung `payment_status` (`UNPAID, PENDING_REVIEW, PAID, FAILED, REFUNDED`), `payment_reference`, kế toán xác nhận nhận tiền. | Bổ sung các trường thanh toán vào bảng `orders`, tạo API và giao diện kế toán xác nhận tiền trước khi xuất kho đơn Đại lý. |
| **12** | **Quản lý Tồn kho Lô/Hạn dùng (FEFO)** | `store_inventory` chỉ có 1 dòng tổng, không có Lot/Expiry. | Hỗ trợ `inventory_lots` (Lot code, NSX, Hạn dùng, Số lượng), thuật toán phân bổ xuất kho theo FEFO (First Expired First Out). | Tạo bảng `inventory_lots`, xây dựng thuật toán FEFO phân bổ lô hàng cho đơn Đại lý mà không phá vỡ logic kho bán lẻ hiện tại. |
| **13** | **Phân quyền Quản trị (Admin RBAC)** | `src/lib/rbac.ts` chỉ có 3 roles và 34 permissions cho cửa hàng/sản phẩm. | Bổ sung các quyền quản trị đối tác: `partners.review, partners.view, partners.suspend, payouts.view, payouts.approve, dealer.manage`. | Bổ sung các quyền mới vào `src/lib/rbac.ts` đồng bộ với giao diện và API. |

---

## 4. KẾ HOẠCH DI TRÚ & KHÔNG GÂY TÁC DỤNG PHỤ (NON-BREAKING MIGRATION)

1. **Bảo tồn luồng Bán lẻ:** Mọi khách hàng thông thường mua hàng tại website (không có ref code hoặc thanh toán COD) tiếp tục hoạt động 100% như cũ.
2. **Bảo tồn Cơ chế Khởi tạo CSDL:** Sử dụng các câu lệnh Raw SQL an toàn `CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` tích hợp vào `src/lib/db.ts` và script `scripts/migrate_partner_module.mjs`.
3. **Mô hình Khách hàng Mở rộng:** CTV/Đại lý thực chất là một tài khoản trong bảng `users` có thêm bản ghi tương ứng trong `partner_profiles`. Họ có thể vừa là khách hàng mua đồ uống, vừa là đối tác kinh doanh.
4. **An toàn Giao dịch:** Toàn bộ thao tác ghi nhận `order_attributions` và sinh dòng thu nhập dự kiến `ESTIMATED` được bọc bên trong cùng PostgreSQL client transaction khi tạo đơn. Nếu giữ kho thất bại (`ROLLBACK`), không có dữ liệu đối tác nào bị lưu rác.
