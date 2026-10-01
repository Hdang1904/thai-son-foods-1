import { formatPrice } from '@/lib/utils';

export interface OrderEmailItem {
  name: string;
  price: number;
  quantity: number;
  unit?: string;
  thumbnail?: string | null;
}

export interface OrderEmailData {
  id?: string;
  orderCode: string;
  fullName: string;
  phone: string;
  email?: string | null;
  address: string;
  province?: string;
  district?: string;
  ward?: string;
  paymentMethod?: string;
  shippingFee: number;
  subtotal: number;
  total: number;
  note?: string | null;
  storeCode?: string | null;
  storeAddress?: string | null;
  items: OrderEmailItem[];
  createdAt?: Date | string;
}

export interface ShippingExtraInfo {
  shipperName?: string;
  shipperPhone?: string;
  storePhone?: string;
  storeAddress?: string;
  estimatedDeliveryTime?: string;
}

interface WrapEmailOptions {
  title: string;
  preheader: string;
  content: string;
  logoSrc?: string;
}

// ─── BASE LAYOUT HELPER ───
function wrapEmailLayout({
  title,
  preheader,
  content,
  logoSrc = '/images/logo-clean-1000.png',
}: WrapEmailOptions): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #FAF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .fluid { max-width: 100% !important; height: auto !important; margin-left: auto !important; margin-right: auto !important; }
      .stack-column, .stack-column-center { display: block !important; width: 100% !important; max-width: 100% !important; direction: ltr !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F5; color: #2D3748;">
  <!-- Preheader text (invisible preview text in email client inbox) -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF9F5;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Container 620px -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);" class="email-container">
          
          <!-- ─── HEADER THƯƠNG HIỆU (LOGO CHÍNH THỨC THÁI SƠN FOODS) ─── -->
          <tr>
            <td style="background: linear-gradient(135deg, #005A34 0%, #1B5E3B 100%); padding: 26px 20px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Khung Logo Trắng Nổi Bật Thái Sơn Foods -->
                    <div style="display: inline-block; background-color: #ffffff; padding: 12px 28px 10px 28px; border-radius: 18px; margin-bottom: 12px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);">
                      <img src="${logoSrc}" alt="Thái Sơn Foods - Món ngon quê Việt" width="220" style="display: block; width: 220px; max-width: 100%; height: auto; margin: 0 auto; border: 0;" />
                    </div>
                    <div style="color: #E6F4EA; font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
                      Món Ngon Quê Việt • Đồ Uống Tươi Dinh Dưỡng
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── NỘI DUNG CHÍNH ─── -->
          <tr>
            <td style="padding: 28px 24px;" class="mobile-padding">
              ${content}
            </td>
          </tr>

          <!-- ─── FOOTER LIÊN HỆ & BẢO QUẢN ─── -->
          <tr>
            <td style="background-color: #F8FAF9; padding: 24px; border-top: 1px solid #EDF2F7; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-size: 13px; color: #4A5568; line-height: 1.6;">
                    <strong style="color: #1A202C;">CÔNG TY TNHH THỰC PHẨM THÁI SƠN (THÁI SƠN FOODS)</strong><br>
                    📞 Hotline CSKH / Giao nhanh: <strong style="color: #005A34;">028 6291 5024</strong> • 📧 Email: <a href="mailto:cskh@thaisonfoods.vn" style="color: #005A34; text-decoration: none;">cskh@thaisonfoods.vn</a><br>
                    🌐 Website: <a href="https://thaisonfoods.vn" style="color: #005A34; text-decoration: none; font-weight: 700;">thaisonfoods.vn</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px; font-size: 11px; color: #A0AEC0; line-height: 1.4;">
                    Email này được gửi tự động từ hệ thống quản lý đơn hàng Thái Sơn Foods.<br>
                    Nếu quý khách có bất kỳ câu hỏi nào, vui lòng liên hệ hotline hỗ trợ 24/7 của chúng tôi.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── HELPER FORMAT ITEMS TABLE ───
function renderItemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #2D3748;">
        <strong style="color: #1A202C; display: block; font-size: 13.5px;">${item.name}</strong>
        <span style="font-size: 11.5px; color: #718096;">Quy cách: ${item.unit || '1 chai'}</span>
      </td>
      <td align="center" style="padding: 12px 8px; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #4A5568; font-weight: 600;">
        x${item.quantity}
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #EDF2F7; font-size: 13px; color: #1B5E3B; font-weight: 700;">
        ${formatPrice(item.price * item.quantity)}đ
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 12px; margin-bottom: 16px;">
      <thead>
        <tr style="border-bottom: 2px solid #E2E8F0;">
          <th align="left" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #718096; letter-spacing: 0.5px;">Sản phẩm</th>
          <th align="center" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #718096; letter-spacing: 0.5px; width: 60px;">SL</th>
          <th align="right" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #718096; letter-spacing: 0.5px; width: 100px;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// ════════════════════════════════════════════════════════════════════════
// 1. GỬI MAIL KHÁCH: "XÁC NHẬN ĐÃ NHẬN ĐƠN #DH..."
// ════════════════════════════════════════════════════════════════════════
export function renderOrderConfirmationEmail(
  order: OrderEmailData,
  options?: { logoSrc?: string }
): {
  subject: string;
  html: string;
} {
  const subject = `🌿 [Thái Sơn Foods] Xác nhận đã nhận đơn hàng #${order.orderCode}`;
  const preheader = `Cảm ơn bạn! Đơn hàng #${order.orderCode} trị giá ${formatPrice(order.total)}đ đã được tiếp nhận và đang chuẩn bị giao.`;

  const fullAddress = [order.address, order.ward, order.district, order.province]
    .filter(Boolean)
    .join(', ');

  const paymentMethodLabel =
    order.paymentMethod === 'bank_transfer'
      ? 'Chuyển khoản QR ngân hàng'
      : 'Thanh toán tiền mặt khi nhận hàng (COD)';

  const content = `
    <!-- Lời chào & Trạng thái đơn -->
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; background-color: #E8F5E9; border: 1px solid #A5D6A7; color: #1B5E3B; font-size: 11.5px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px;">
        ✓ Đơn hàng đã tiếp nhận
      </div>
      <h1 style="font-size: 20px; font-weight: 800; color: #1A202C; margin: 0 0 8px 0; line-height: 1.3;">
        Cảm ơn quý khách, ${order.fullName}!
      </h1>
      <p style="font-size: 13.5px; color: #4A5568; line-height: 1.6; margin: 0;">
        Đơn hàng <strong style="color: #005A34;">#${order.orderCode}</strong> của bạn đã được ghi nhận trên hệ thống. Đội ngũ cửa hàng Thái Sơn Foods đang tiến hành kiểm tra kho và đóng gói đồ uống tươi mát để giao đến bạn sớm nhất.
      </p>
    </div>

    <!-- Hộp thông tin giao hàng & người nhận -->
    <div style="background-color: #F8FAF9; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 800; color: #005A34; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
        📍 Thông tin nhận hàng
      </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.6; color: #2D3748;">
        <tr>
          <td style="width: 110px; color: #718096; vertical-align: top;">Người nhận:</td>
          <td><strong>${order.fullName}</strong> - 📞 ${order.phone}</td>
        </tr>
        <tr>
          <td style="color: #718096; vertical-align: top;">Địa chỉ giao:</td>
          <td>${fullAddress}</td>
        </tr>
        <tr>
          <td style="color: #718096; vertical-align: top;">Thanh toán:</td>
          <td><strong>${paymentMethodLabel}</strong></td>
        </tr>
        ${
          order.note
            ? `<tr>
                <td style="color: #718096; vertical-align: top;">Ghi chú:</td>
                <td style="color: #C53030; font-style: italic;">${order.note}</td>
              </tr>`
            : ''
        }
      </table>
    </div>

    <!-- Danh sách sản phẩm -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 800; color: #1A202C; text-transform: uppercase; letter-spacing: 0.5px;">
        🛒 Chi tiết sản phẩm đã chọn
      </div>
      ${renderItemsTable(order.items)}

      <!-- Tóm tắt chi phí -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.7; border-top: 1px dashed #CBD5E0; padding-top: 10px;">
        <tr>
          <td style="color: #718096;">Tạm tính tiền hàng:</td>
          <td align="right" style="font-weight: 600; color: #2D3748;">${formatPrice(order.subtotal)}đ</td>
        </tr>
        <tr>
          <td style="color: #718096;">Phí vận chuyển:</td>
          <td align="right" style="font-weight: 600;">
            ${
              order.shippingFee === 0
                ? '<span style="color: #1B5E3B; font-weight: 800; background-color: #E8F5E9; padding: 2px 6px; border-radius: 4px; font-size: 11px;">FREESHIP</span>'
                : `${formatPrice(order.shippingFee)}đ`
            }
          </td>
        </tr>
        <tr>
          <td style="font-size: 15px; font-weight: 800; color: #1A202C; padding-top: 6px;">Tổng thanh toán:</td>
          <td align="right" style="font-size: 18px; font-weight: 900; color: #005A34; padding-top: 6px;">${formatPrice(order.total)}đ</td>
        </tr>
      </table>
    </div>

    <!-- Lưu ý nhận hàng quan trọng -->
    <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
      <div style="font-size: 12.5px; font-weight: 800; color: #92400E; margin-bottom: 4px;">
        ⏰ Lưu ý quan trọng khi nhận hàng:
      </div>
      <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #78350F; line-height: 1.6;">
        <li>Đơn hàng được giao nhanh trong vòng <strong>2 - 4 giờ</strong> khu vực nội thành TP.HCM.</li>
        <li>Tài xế/Shipper sẽ gọi điện trước khi đến, quý khách vui lòng <strong>để ý điện thoại</strong>.</li>
        <li>Đồ uống được ướp lạnh tự nhiên. Quý khách vui lòng <strong>bảo quản vào tủ mát (2°C - 5°C)</strong> ngay khi nhận để giữ hương vị tươi ngon nhất.</li>
      </ul>
    </div>
  `;

  return { subject, html: wrapEmailLayout({ title: subject, preheader, content, logoSrc: options?.logoSrc }) };
}

// ════════════════════════════════════════════════════════════════════════
// 2. GỬI MAIL KHÁCH: "ĐƠN HÀNG ĐANG TRÊN ĐƯỜNG GIAO ĐẾN BẠN"
// ════════════════════════════════════════════════════════════════════════
export function renderOrderShippingEmail(
  order: OrderEmailData,
  shippingInfo?: ShippingExtraInfo,
  options?: { logoSrc?: string }
): {
  subject: string;
  html: string;
} {
  const subject = `🚀 [Thái Sơn Foods] Đơn hàng #${order.orderCode} đang trên đường giao đến bạn!`;
  const preheader = `Shipper đang mang đồ uống ướp lạnh đến địa chỉ của bạn. Dự kiến giao trong 30-60 phút.`;

  const shipperPhone = shippingInfo?.shipperPhone || '0961 888 888';
  const shipperName = shippingInfo?.shipperName || 'Đội ngũ giao hàng Thái Sơn Foods';
  const storeAddress = shippingInfo?.storeAddress || order.storeAddress || 'Chi nhánh Thái Sơn Foods TP.HCM';

  const fullAddress = [order.address, order.ward, order.district, order.province]
    .filter(Boolean)
    .join(', ');

  const content = `
    <!-- Lời chào & Trạng thái đang giao -->
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; background-color: #E0F2FE; border: 1px solid #7DD3FC; color: #0369A1; font-size: 11.5px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px;">
        🚚 Đang trên đường giao hàng
      </div>
      <h1 style="font-size: 20px; font-weight: 800; color: #1A202C; margin: 0 0 8px 0; line-height: 1.3;">
        Đồ uống tươi mát đang trên đường đến bạn!
      </h1>
      <p style="font-size: 13.5px; color: #4A5568; line-height: 1.6; margin: 0;">
        Chào <strong>${order.fullName}</strong>, đơn hàng <strong style="color: #005A34;">#${order.orderCode}</strong> đã được xuất kho và giao cho nhân viên vận chuyển. Bạn hãy chuẩn bị nghe điện thoại nhận hàng nhé!
      </p>
    </div>

    <!-- Hộp thông tin Shipper & Tài xế -->
    <div style="background: linear-gradient(135deg, #F0FDF4 0%, #E6F4EA 100%); border: 1px solid #BBF7D0; border-radius: 14px; padding: 18px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
        🛵 Thông tin vận chuyển
      </div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.7; color: #14532D;">
        <tr>
          <td style="width: 120px; color: #15803D;">Người giao hàng:</td>
          <td><strong>${shipperName}</strong></td>
        </tr>
        <tr>
          <td style="color: #15803D;">Số điện thoại:</td>
          <td>
            <a href="tel:${shipperPhone}" style="color: #005A34; font-weight: 800; text-decoration: none; background-color: #ffffff; padding: 2px 8px; border-radius: 6px; border: 1px solid #86EFAC;">
              📞 ${shipperPhone}
            </a>
          </td>
        </tr>
        <tr>
          <td style="color: #15803D;">Cửa hàng xuất:</td>
          <td>${storeAddress}</td>
        </tr>
        <tr>
          <td style="color: #15803D;">Giao đến:</td>
          <td><strong>${fullAddress}</strong></td>
        </tr>
      </table>
    </div>

    <!-- Tóm tắt số tiền thu hộ -->
    <div style="background-color: #F8FAF9; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13.5px;">
        <tr>
          <td style="color: #4A5568;">Hình thức thanh toán:</td>
          <td align="right" style="font-weight: 700; color: #1A202C;">
            ${order.paymentMethod === 'bank_transfer' ? 'Đã chuyển khoản QR' : 'Tiền mặt khi nhận (COD)'}
          </td>
        </tr>
        <tr>
          <td style="font-size: 15px; font-weight: 800; color: #1A202C; padding-top: 6px;">
            ${order.paymentMethod === 'bank_transfer' ? 'Số tiền đã thanh toán:' : 'Số tiền shipper thu:'}
          </td>
          <td align="right" style="font-size: 18px; font-weight: 900; color: #005A34; padding-top: 6px;">
            ${formatPrice(order.total)}đ
          </td>
        </tr>
      </table>
    </div>

    <!-- Danh sách món tóm tắt -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12.5px; font-weight: 700; color: #718096; margin-bottom: 8px;">
        Danh sách ${order.items.length} món trong đơn:
      </div>
      <ul style="margin: 0; padding-left: 18px; font-size: 12.5px; color: #4A5568; line-height: 1.6;">
        ${order.items.map((i) => `<li><strong>${i.name}</strong> (x${i.quantity}) - ${formatPrice(i.price * i.quantity)}đ</li>`).join('')}
      </ul>
    </div>

    <!-- Nhắc nhở bảo quản thùng giữ nhiệt -->
    <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 14px; margin-bottom: 20px; font-size: 12.5px; color: #1E40AF; line-height: 1.5;">
      ❄️ <em>Sản phẩm được bảo quản trong túi giữ nhiệt chuyên dụng để đảm bảo độ lạnh sâu. Sau khi nhận, quý khách hãy cho vào tủ lạnh ngay nhé!</em>
    </div>
  `;

  return { subject, html: wrapEmailLayout({ title: subject, preheader, content, logoSrc: options?.logoSrc }) };
}

// ════════════════════════════════════════════════════════════════════════
// 3. GỬI MAIL KHÁCH: "CẢM ƠN & HƯỚNG DẪN BẢO QUẢN ĐỒ UỐNG TƯƠI"
// ════════════════════════════════════════════════════════════════════════
export function renderOrderCompletedEmail(
  order: OrderEmailData,
  options?: { logoSrc?: string }
): {
  subject: string;
  html: string;
} {
  const subject = `❤️ [Thái Sơn Foods] Cảm ơn bạn & Hướng dẫn bảo quản đồ uống tươi ngon #${order.orderCode}`;
  const preheader = `Cảm ơn bạn đã nhận hàng! Hãy xem ngay 4 mẹo bảo quản đồ uống tươi mát chuẩn vị quê Việt.`;

  const content = `
    <!-- Lời cảm ơn & Hoàn tất -->
    <div style="margin-bottom: 22px; text-align: center;">
      <div style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; font-size: 11.5px; font-weight: 800; padding: 4px 14px; border-radius: 20px; text-transform: uppercase; margin-bottom: 12px;">
        ✓ Giao hàng thành công
      </div>
      <h1 style="font-size: 22px; font-weight: 800; color: #005A34; margin: 0 0 10px 0; line-height: 1.3;">
        Cảm ơn bạn đã tin chọn Thái Sơn Foods!
      </h1>
      <p style="font-size: 13.5px; color: #4A5568; line-height: 1.6; margin: 0 auto; max-width: 480px;">
        Đơn hàng <strong>#${order.orderCode}</strong> đã được giao thành công đến bạn. Đội ngũ Thái Sơn Foods hy vọng bạn sẽ có những phút giây thưởng thức đồ uống mát lành, tràn đầy năng lượng cùng gia đình!
      </p>
    </div>

    <!-- ─── CẨM NANG BẢO QUẢN ĐỒ UỐNG TƯƠI (HÀNG DATE NGẮN) ─── -->
    <div style="background-color: #FFFFFF; border: 2px solid #005A34; border-radius: 16px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(0, 90, 52, 0.06);">
      <div style="text-align: center; margin-bottom: 14px;">
        <span style="font-size: 16px; font-weight: 800; color: #005A34; text-transform: uppercase; letter-spacing: 0.5px;">
          🌿 HƯỚNG DẪN BẢO QUẢN ĐỒ UỐNG TƯƠI
        </span>
        <div style="font-size: 11.5px; color: #718096; margin-top: 3px;">
          (Do đồ uống Thái Sơn 100% nguyên liệu tự nhiên - không chất bảo quản)
        </div>
      </div>

      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; line-height: 1.6; color: #2D3748;">
        <tr>
          <td style="width: 32px; vertical-align: top; padding-top: 2px; font-size: 18px;">❄️</td>
          <td style="padding-bottom: 14px;">
            <strong style="color: #1A202C;">1. Bảo quản lạnh ngay (2°C - 5°C):</strong><br>
            <span style="color: #4A5568;">Hãy xếp chai vào <strong>ngăn mát tủ lạnh ngay sau khi nhận</strong>. Không để sản phẩm ở nhiệt độ phòng hoặc nơi có ánh nắng trực tiếp.</span>
          </td>
        </tr>

        <tr>
          <td style="vertical-align: top; padding-top: 2px; font-size: 18px;">⏰</td>
          <td style="padding-bottom: 14px;">
            <strong style="color: #1A202C;">2. Thời hạn dùng ngon nhất:</strong><br>
            <span style="color: #4A5568;">Khuyên dùng ngon nhất trong vòng <strong>24 - 48 giờ</strong> sau khi mở nắp để cảm nhận trọn vẹn hương vị thanh ngọt tự nhiên của bắp tươi, hạt sen, gạo lứt.</span>
          </td>
        </tr>

        <tr>
          <td style="vertical-align: top; padding-top: 2px; font-size: 18px;">🔄</td>
          <td style="padding-bottom: 14px;">
            <strong style="color: #1A202C;">3. Lắc đều trước khi uống:</strong><br>
            <span style="color: #4A5568;">Hiện tượng lắng đọng nhẹ tinh bột bắp hoặc dưỡng chất hạt tự nhiên dưới đáy chai là hoàn toàn bình thường. Lắc đều trước khi thưởng thức!</span>
          </td>
        </tr>

        <tr>
          <td style="vertical-align: top; padding-top: 2px; font-size: 18px;">🛡️</td>
          <td>
            <strong style="color: #1A202C;">4. Đổi trả 1-1 miễn phí trong 24h:</strong><br>
            <span style="color: #4A5568;">Nếu sản phẩm có bất kỳ vấn đề gì về móp méo, độ lạnh hoặc chất lượng do vận chuyển, hãy gọi ngay hotline <strong>028 6291 5024</strong> để được đổi mới 100% miễn phí.</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Voucher ưu đãi lần sau -->
    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border: 1px dashed #D97706; border-radius: 14px; padding: 16px; text-align: center; margin-bottom: 22px;">
      <div style="font-size: 12px; font-weight: 700; color: #92400E; text-transform: uppercase;">
        🎁 Quà tặng tri ân khách hàng thân thiết
      </div>
      <div style="font-size: 18px; font-weight: 900; color: #B45309; letter-spacing: 2px; margin: 6px 0;">
        TSFHEALTHY
      </div>
      <p style="font-size: 12px; color: #78350F; margin: 0;">
        Giảm <strong>10%</strong> cho lần đặt hàng tiếp theo tại website <a href="https://thaisonfoods.vn" style="color: #B45309; font-weight: 700;">thaisonfoods.vn</a>
      </p>
    </div>
  `;

  return { subject, html: wrapEmailLayout({ title: subject, preheader, content, logoSrc: options?.logoSrc }) };
}
