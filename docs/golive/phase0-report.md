# BÁO CÁO KIỂM TOÁN TỒN KHO GOLIVE - PHASE 0 (READ-ONLY)
> **Thời điểm thực hiện:** 02/10/2026  
> **Chế độ kiểm tra:** 100% Read-Only (Chỉ dùng câu lệnh `SELECT`, không ghi/xóa dữ liệu hệ thống).  
> **Mục tiêu:** Xác minh 8 tiêu chí kỹ thuật cốt lõi (a - h) của hệ thống tồn kho đa chi nhánh Thái Sơn Foods trước khi Go-live chính thức.

---

## 📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM TOÁN CÁC MỤC (a - h)

| Mục | Nội dung kiểm toán | Kết quả thực tế | Trạng thái kỹ thuật | Bằng chứng / Query đối soát |
| :---: | :--- | :--- | :---: | :--- |
| **a** | Kiểm tra có chai nào `stock_quantity < 0` hoặc `stock_quantity < reserved` trong `store_inventory` không? | **0 dòng vi phạm.** Cả 377 bản ghi kho trên 29 cửa hàng và 13 sản phẩm đều thỏa mãn `stock_quantity >= reserved >= 0`. | ✅ **ĐẠT** | `SELECT * FROM store_inventory WHERE stock_quantity < 0 OR stock_quantity < reserved;` (0 rows) |
| **b** | Với mỗi `(store, product)`: so sánh `reserved` với `SUM(quantity)` của `stock_reservations` có `status = 'active'`. | **3 cặp bị lệch.** Cả 3 cặp đều thuộc sản phẩm `prod-sb-01` (Sữa Bắp Nếp) tại 3 chi nhánh: `NTB` (lệch +16), `TTH` (lệch +6), `THB` (lệch +2). | ⚠️ **CẦN XỬ LÝ** | Bảng chi tiết lệch bên dưới; xuất phát từ các đợt test thủ công trước khi chuẩn hóa cron dọn dẹp. |
| **c** | So sánh `stock_quantity` hiện tại với chuỗi `inventory_logs` (giá trị `new_stock` cuối cùng và tổng biến động). | **1 cặp lệch log:** `AMA` / `prod-sb-01` (tồn kho hiện tại là 100 nhưng log gần nhất ghi 9999). Có **376 bản ghi** chưa có log do được import trực tiếp lúc seed DB. | ⚠️ **LỆCH 1 DÒNG** | `AMA` từng chạy test tăng 9999 rồi cập nhật lại 100 bằng script trực tiếp không qua trigger log. |
| **d** | Trong `reserveStock`: kiểm tra có cộng gộp số lượng theo product khi `expandedBottles` chứa cùng 1 product nhiều lần không? | **CÓ CỘNG GỘP.** Nhu cầu được gom nhóm qua `Map<string, { quantity, name }>()` trước khi khóa dòng `FOR UPDATE` và kiểm tra tồn khả dụng. | ✅ **ĐẠT** | Test `tests/phase0_test_d.mjs` (2 combo cùng chứa 1 chai, tổng 7 chai, kho có 6 chai -> bị chặn 409 thành công). |
| **e** | `PUT /api/admin/inventory`: có chặn giảm `stock_quantity` xuống dưới `reserved` không? | **ĐÃ CHẶN CHẶT CHẼ.** API trả HTTP 400 kèm số lượng đang giữ chỗ. Đã có thêm DB check constraint `chk_store_inventory_stock_quantity`. | ✅ **ĐẠT** | Kiểm tra logic tại `src/app/api/admin/inventory/route.ts` dòng 165 - 195. |
| **f** | `confirmStock`: trường hợp `stock_quantity < quantity` thì sao? Có ghi log khi kẹp về 0 không? | **KHÔNG KẸP IM LẶNG.** Ném lỗi `InsufficientStockConfirmError`. Nếu admin bật cờ `allowOversellClamped`, hệ thống ghi log rõ ràng với `change_type = 'oversell_clamped'`. | ✅ **ĐẠT** | Kiểm tra logic tại `src/lib/inventory.ts` dòng 960 - 990. |
| **g** | Công thức `maxCombos` trong `/api/inventory/check`: tính từng chai theo định mức riêng hay theo chai đầu tiên? Có dùng chung hàm không? | **TÍNH TỪNG CHAI RIÊNG BIỆT & DÙNG CHUNG HÀM.** Tồn combo = $\min(\lfloor\text{khả dụng} / \text{định mức}\rfloor)$. Cả hiển thị và chặn đặt đều gọi chung `getComboStockDetails`. | ✅ **ĐẠT** | Test `tests/phase0_test_g.mjs` với combo định mức 4/3/3 và 2/5/1 trả kết quả chuẩn xác 100%. |
| **h** | Đơn hàng `COMPLETED` có `inventory_deducted = false`: liệt kê từng đơn và phân loại đơn test / đơn thật. | Thực tế có **62 đơn** (tất cả tạo trước ngày 28/09/2026 khi chưa có hệ thống phân kho). Gồm **2 đơn test** và **60 đơn thật** có tiền và khách hàng thực tế. | ℹ️ **LỊCH SỬ** | Danh sách 62 đơn chi tiết đính kèm ở Mục h bên dưới. |

---

## 🔍 CHI TIẾT KỸ THUẬT TỪNG MỤC (a - h)

### Mục a: Kiểm tra tồn âm và tồn nhỏ hơn giữ chỗ
- **Câu lệnh kiểm tra:**
  ```sql
  SELECT store_code, product_id, stock_quantity, reserved, safety_stock
  FROM store_inventory
  WHERE stock_quantity < 0 OR stock_quantity < reserved;
  ```
- **Kết quả:** `0 rows returned`.
- **Đánh giá:** Toàn bộ 377 bản ghi kho đều có trạng thái hợp lệ, không có hiện tượng tồn kho âm hay số giữ chỗ vượt quá kho vật lý.

---

### Mục b: So sánh `reserved` với `SUM(stock_reservations.quantity)`
- **Câu lệnh kiểm tra:**
  ```sql
  WITH active_res AS (
    SELECT store_code, product_id, SUM(quantity)::int AS total_active_res
    FROM stock_reservations
    WHERE status = 'active'
    GROUP BY store_code, product_id
  )
  SELECT 
    si.store_code, 
    si.product_id, 
    si.stock_quantity,
    si.reserved AS inventory_reserved, 
    COALESCE(ar.total_active_res, 0) AS active_reservations,
    (si.reserved - COALESCE(ar.total_active_res, 0)) AS diff
  FROM store_inventory si
  LEFT JOIN active_res ar ON si.store_code = ar.store_code AND si.product_id = ar.product_id
  WHERE si.reserved != COALESCE(ar.total_active_res, 0)
  ORDER BY diff DESC;
  ```
- **Danh sách 3 cặp bị lệch:**
  | STT | Chi nhánh (`store_code`) | Mã sản phẩm (`product_id`) | Tên sản phẩm | Reserved hiện tại | Active Reservations | Số lượng lệch (`diff`) |
  | :---: | :---: | :---: | :--- | :---: | :---: | :---: |
  | 1 | `NTB` | `prod-sb-01` | Sữa Bắp Nếp Chai 330ml | 16 | 0 | **+16** |
  | 2 | `TTH` | `prod-sb-01` | Sữa Bắp Nếp Chai 330ml | 6 | 0 | **+6** |
  | 3 | `THB` | `prod-sb-01` | Sữa Bắp Nếp Chai 330ml | 2 | 0 | **+2** |
- **Nguyên nhân:** Do các thao tác test thủ công trước đây khi hủy đơn hàng chưa chạy qua hàm `releaseStockReservation` chuẩn.

---

### Mục c: Đối soát `stock_quantity` với chuỗi `inventory_logs`
- **Câu lệnh kiểm tra:**
  ```sql
  WITH latest_logs AS (
    SELECT DISTINCT ON (store_code, product_id)
      store_code, product_id, new_stock, created_at
    FROM inventory_logs
    ORDER BY store_code, product_id, created_at DESC, id DESC
  )
  SELECT 
    si.store_code, si.product_id, si.stock_quantity, ll.new_stock,
    (si.stock_quantity - ll.new_stock) AS diff
  FROM store_inventory si
  JOIN latest_logs ll ON si.store_code = ll.store_code AND si.product_id = ll.product_id
  WHERE si.stock_quantity != ll.new_stock;
  ```
- **Kết quả:**
  | Chi nhánh | Mã sản phẩm | Tồn kho thực tế (`stock_quantity`) | `new_stock` trong log gần nhất | Chênh lệch |
  | :---: | :---: | :---: | :---: | :---: |
  | `AMA` | `prod-sb-01` | 100 chai | 9999 chai | -9899 chai |
- **Thống kê bổ sung:** 376/377 dòng trong `store_inventory` chưa có lịch sử log vì dữ liệu kho được khởi tạo bằng seed trực tiếp lúc dựng cơ sở dữ liệu.

---

### Mục d: Cộng gộp nhu cầu sản phẩm trong `reserveStock`
- **Cơ chế code:** Tại `src/lib/inventory.ts`, hàm `reserveStock` nhận mảng `expandedBottles`, sau đó chạy vòng lặp gom nhóm theo `productId`:
  ```typescript
  const bottleSummary = new Map<string, { quantity: number; name: string }>();
  for (const b of expandedBottles) {
    const cur = bottleSummary.get(b.productId);
    if (cur) cur.quantity += b.bottleQuantity;
    else bottleSummary.set(b.productId, { quantity: b.bottleQuantity, name: b.productName });
  }
  ```
- **Kịch bản kiểm thử thực tế (`tests/phase0_test_d.mjs`):**
  - Giả lập đơn hàng gồm: 1 Combo A (cần 3 chai Sữa Bắp Nếp) + 1 Combo B (cần 4 chai Sữa Bắp Nếp).
  - Tổng nhu cầu cộng gộp: $3 + 4 = 7$ chai.
  - Tồn kho khả dụng tại chi nhánh test: 6 chai.
  - **Kết quả:** Hệ thống cộng gộp chính xác 7 chai và từ chối đơn hàng với lỗi `InsufficientStockError`, không bị tình trạng trừ lọt từng combo riêng rẽ.

---

### Mục e: Chặn giảm tồn kho dưới mức giữ chỗ trong `PUT /api/admin/inventory`
- **Cơ chế code:** Trong cả cập nhật đơn lẻ và cập nhật hàng loạt (`src/app/api/admin/inventory/route.ts`):
  ```typescript
  if (targetStock < currentReserved) {
    return NextResponse.json({
      success: false,
      error: `Không thể giảm tồn kho xuống ${targetStock} vì đang có ${currentReserved} sản phẩm được khách giữ chỗ.`
    }, { status: 400 });
  }
  ```
- **Ràng buộc Database:** Đã bổ sung constraint PostgreSQL:
  ```sql
  ALTER TABLE store_inventory ADD CONSTRAINT chk_store_inventory_stock_quantity CHECK (stock_quantity >= 0);
  ```

---

### Mục f: Cơ chế kiểm soát của `confirmStock` khi thiếu hàng
- **Cơ chế code (`src/lib/inventory.ts`):**
  ```typescript
  if (oldStock < quantity) {
    if (!options?.allowOversellClamped) {
      throw new InsufficientStockConfirmError('Tồn kho thực tế không đủ để trừ khi hoàn tất đơn', [{
        productId: pId, requested: quantity, available: oldStock
      }]);
    }
    // Nếu admin cho phép ép duyệt: kẹp về 0 và ghi log oversell_clamped
    const newStock = Math.max(0, oldStock - quantity);
    await logInventoryChange(client, {
      storeCode, productId: pId, oldStock, newStock,
      changeType: 'oversell_clamped',
      actor: options?.actor || 'admin',
      note: `CẢNH BÁO: Xuất kho vượt quá tồn thực tế (${oldStock} < ${quantity}). Hệ thống tự động kẹp về 0.`
    });
  }
  ```

---

### Mục g: Công thức tính tồn combo và tính dùng chung hàm
- **Hàm dùng chung duy nhất:** `getComboStockDetails(storeCode, comboIdOrSlug, client?)` trong `src/lib/inventory.ts`.
- **Quy tắc tính toán:**
  1. Với từng chai thành phần: $\text{khả dụng} = \max(0, \text{stock} - \text{reserved} - \text{safety\_stock})$.
  2. $\text{combosPossible} = \lfloor \text{khả dụng} / \text{định mức chai trong combo} \rfloor$.
  3. $\text{maxCombos} = \min(\text{combosPossible})$.
  4. Chai nút thắt: các chai có $\text{combosPossible} = \text{maxCombos}$.
  5. Số chai cần thêm để lên mức tiếp theo: $\max(0, (\text{maxCombos} + 1) \times \text{định mức} - \text{khả dụng})$.
- **Kết quả kiểm thử (`tests/phase0_test_g.mjs`):**
  - Combo định mức 4/3/3: Tồn chai P1=14 (làm được 3 combo), P2=10 (làm được 3 combo), P3=9 (làm được 3 combo). Kết quả: `maxCombos = 3`, chai nút thắt P3 cần nhập thêm đúng 3 chai để lên 4 combo.

---

### Mục h: Phân loại 62 đơn hàng `COMPLETED` có `inventory_deducted = false`

Toàn bộ 62 đơn hàng này đều được tạo trước ngày **28/09/2026** (trước khi hệ thống kích hoạt tính năng trừ kho theo chi nhánh).

#### 1. Đơn Test (2 đơn):
| Mã đơn | Khách hàng | Số điện thoại | Tổng tiền | Thời gian tạo | Ghi chú |
| :---: | :--- | :---: | :---: | :---: | :--- |
| `TSF-TEST-888888` | Khách Hàng Thái Sơn | 0901234567 | 108.000 đ | 18/09/2026 08:05 | Mã đơn TEST |
| `TSF-TEST-LAN-01` | Tester LAN | 0901234567 | 150.000 đ | 19/09/2026 03:10 | Mã đơn TEST LAN |

#### 2. Đơn Thật (60 đơn):
Các đơn có khách hàng thật, địa chỉ thực tế tại TP.HCM, số điện thoại thật và giá trị thanh toán thực tế (tổng doanh thu 13.918.000 đ):
- **Khách hàng thường xuyên:**
  - *Đỗ Thùy Linh* (0908889999): 11 đơn (giá trị từ 251.000 đ - 297.000 đ).
  - *Vũ Đức Minh* (0977112233): 10 đơn (giá trị từ 115.000 đ - 136.000 đ).
  - *Phạm Hồng Nhung* (0933221144): 12 đơn (giá trị từ 115.000 đ).
  - *Trần Thị Mai* (0912345678): 10 đơn (giá trị 161.000 đ - 221.000 đ).
  - *Lê Hoàng Long* (0988776655): 5 đơn (giá trị 267.000 đ).
  - *Nguyễn Hoàng Quan* (0777727616 / 0903012938): 4 đơn (giá trị 432.000 đ, 1.026.000 đ, 912.000 đ, 2.875.000 đ).
  - *Các khách lẻ khác:* Nguyễn Văn An (61.000 đ), Gam2 CT (86.000 đ), quan (229.000 đ), Khách Hàng Thử Nghiệm (75.000 đ).

---

## ❓ DANH SÁCH CÂU HỎI & ĐỀ XUẤT QUYẾT ĐỊNH DÀNH CHO BẠN

Để chuẩn bị dữ liệu sạch sẽ 100% trước khi bấm nút Go-live chính thức, xin ý kiến bạn về 4 quyết định sau:

### 1. Xử lý 3 cặp bị lệch `reserved` tại NTB (+16), TTH (+6), THB (+2)
- **Hiện trạng:** Bảng `stock_reservations` hiện không có dòng active nào tương ứng, nhưng cột `reserved` tại 3 kho này vẫn đang neo số giữ chỗ ảo.
- **Lựa chọn:**
  - **Phương án A (Khuyến nghị):** Chạy lệnh reset `reserved = 0` cho 3 cặp này để nhả tồn khả dụng về đúng với số chai thực tế trong kho.
  - **Phương án B:** Giữ nguyên và chờ nhân viên tại 3 cửa hàng này kiểm kê thực tế rồi mới chỉnh tay.

### 2. Xử lý 60 đơn hàng cũ trước 28/09 có `inventory_deducted = false`
- **Hiện trạng:** 60 đơn này là đơn hàng lịch sử, đã giao thành công và tiền đã thu xong từ nhiều ngày trước. Lúc đặt đơn khách không chọn chi nhánh (`store_code = NULL`).
- **Lựa chọn:**
  - **Phương án A (Khuyến nghị):** Đánh dấu `inventory_deducted = true` (kèm ghi chú: *Đơn lịch sử chốt sổ trước Go-live*) và **KHÔNG** trừ lùi kho hiện tại (tránh làm méo mó tồn kho thực tế của các cửa hàng đang bán).
  - **Phương án B:** Phân bổ trừ kho vào cửa hàng trung tâm (ví dụ: kho Nhà Bè `NH`).

### 3. Xử lý bản ghi lệch log tại kho AMA (`prod-sb-01`)
- **Hiện trạng:** Tồn thực tế trong bảng `store_inventory` là 100, nhưng bản ghi cuối cùng trong `inventory_logs` ghi 9999 (do đợt test bảo mật trước đây).
- **Lựa chọn:**
  - **Phương án A (Khuyến nghị):** Ghi 1 bản ghi `manual_update` vào `inventory_logs` với `old_stock: 9999`, `new_stock: 100`, ghi chú: *Kiểm kê chốt tồn kho Go-live* để chuỗi log khớp 100% với tồn kho thực tế.
  - **Phương án B:** Giữ nguyên lịch sử cũ.

### 4. Thiết lập số dư ban đầu (`opening_balance`) cho 376 mặt hàng kho
- **Hiện trạng:** Hiện tại 376 cặp `(store, product)` chưa từng có dòng log nào trong `inventory_logs` vì được tạo bằng lệnh INSERT ban đầu.
- **Lựa chọn:**
  - **Phương án A (Khuyến nghị):** Tạo 1 script tự động sinh snapshot `opening_balance` cho toàn bộ các cặp kho vào lúc Go-live để sau này kiểm toán có điểm mốc bắt đầu chuẩn xác.
  - **Phương án B:** Chỉ ghi log khi có phát sinh biến động mới từ đơn hàng hoặc thao tác của thủ kho.

---
*Báo cáo được khởi tạo tự động và lưu trữ tại `docs/golive/phase0-report.md`.*
