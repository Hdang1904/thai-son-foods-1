# TÀI LIỆU YÊU CẦU BƯỚC 1: THIẾT KẾ KIẾN TRÚC & NGHIỆP VỤ HỘI VIÊN VÀ ĐĂNG KÝ ĐỊNH KỲ
# (PHASE 1 - BRIEF: MEMBERSHIP & SUBSCRIBE & SAVE CORE DESIGN)

---

## 1. MỤC TIÊU BƯỚC 1
Xây dựng tài liệu thiết kế kỹ thuật, mô hình kinh tế đơn vị, kiến trúc dữ liệu và wireframe chuẩn mực cho chương trình Hội viên (Membership) và Giao hàng định kỳ (Subscribe & Save) của Thái Sơn Foods. 

## 2. PHẠM VI NỘI DUNG BẮT BUỘC
1. **Phân tích xung đột và khoảng trống (Gap & Conflict Analysis):** So sánh với mã nguồn và dữ liệu thực tế tại Core V1.0 (Giỏ hàng, Tồn kho 24h, Định tuyến cửa hàng, Quy cách Lốc/Thùng, Khách vãng lai).
2. **Kinh tế đơn vị (Unit Economics):** Lập bảng tính toán với dữ liệu đầu vào [PLACEHOLDER - CHỜ DOANH NGHIỆP XÁC NHẬN] kèm 3 kịch bản mô phỏng (Thận trọng, Mục tiêu, Tấn công).
3. **Thiết kế kiến trúc hệ thống (Architecture Design):**
   - Diff Prisma Schema (chỉ ở dạng diff văn bản, không ghi vào schema.prisma).
   - Danh sách RESTful API và cơ chế bảo mật RBAC.
   - Máy trạng thái Thành viên (Member Lifecycle State Machine).
   - Máy trạng thái Đăng ký định kỳ (Subscription Order Line State Machine).
4. **Wireframe giao diện (UI/UX Wireframes):** Sơ đồ bố cục văn bản / Mermaid cho 5 màn hình người dùng chính (PDP/Cart S&S, Member Modal, Member Dashboard, Subscription Hub, Ethical Cancellation).
5. **Phương án xác minh số điện thoại:** Đánh giá 2-3 giải pháp, rủi ro bảo mật & quyền riêng tư, đề xuất 1 phương án mặc định.
6. **Việc doanh nghiệp cần quyết định:** Bảng phân loại hành động kèm mức ưu tiên.

## 3. NGUYÊN TẮC THỰC HIỆN
- Chỉ phân tích và thiết kế tài liệu, không ghi dữ liệu vào CSDL, không chạy migration, không sửa code `src/`.
- Tuân thủ Luật Bảo vệ quyền lợi người tiêu dùng 2023, triệt tiêu Dark Patterns trong luồng hủy và gia hạn.
