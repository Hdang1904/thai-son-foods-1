import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { query } from '@/lib/db';
import {
  OrderEmailData,
  ShippingExtraInfo,
  renderOrderConfirmationEmail,
  renderOrderShippingEmail,
  renderOrderCompletedEmail,
} from './templates';

export type EmailType = 'ORDER_CONFIRMATION' | 'ORDER_SHIPPING' | 'ORDER_COMPLETED';

interface SendResult {
  success: boolean;
  messageId?: string;
  provider: 'RESEND' | 'SMTP' | 'MOCK';
  error?: string;
}

// ─── TỰ ĐỘNG KHỞI TẠO BẢNG LƯU LỊCH SỬ EMAIL NẾU CHƯA CÓ ───
let isEmailLogsTableReady = false;
async function ensureEmailLogsTable() {
  if (isEmailLogsTableReady) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(50) PRIMARY KEY,
        order_code VARCHAR(100),
        recipient VARCHAR(255) NOT NULL,
        email_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'SENT',
        provider VARCHAR(50) NOT NULL,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_email_logs_order ON email_logs(order_code);
    `);
    isEmailLogsTableReady = true;
  } catch (err) {
    console.error('[EmailService] Error creating email_logs table:', err);
  }
}

// ─── GỬI EMAIL QUA RESEND REST API ───
async function sendViaResend({
  to,
  subject,
  html,
  apiKey,
}: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
}): Promise<{ messageId: string }> {
  const fromEmail = process.env.EMAIL_FROM || 'Thái Sơn Foods <onboarding@resend.dev>';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Resend API failed to send email');
  }
  return { messageId: data.id };
}

// ─── GỬI EMAIL QUA SMTP (GMAIL HOẶC DOMAIN CÔNG TY) ───
async function sendViaSmtp({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ messageId: string }> {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '').trim();

  if (!user || !pass) {
    throw new Error('Missing SMTP_USER or SMTP_PASS');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-clean-1000.png');
  const attachments = fs.existsSync(logoPath)
    ? [
        {
          filename: 'logo-clean-1000.png',
          path: logoPath,
          cid: 'thaison-logo',
        },
      ]
    : [];

  const fromEmail = process.env.EMAIL_FROM || `Thái Sơn Foods <${user}>`;
  const info = await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    html,
    attachments,
  });

  return { messageId: info.messageId };
}

// ════════════════════════════════════════════════════════════════════════
// HÀM CHÍNH: GỬI EMAIL ĐƠN HÀNG (NON-BLOCKING)
// ════════════════════════════════════════════════════════════════════════
export async function sendOrderEmail(
  type: EmailType,
  order: OrderEmailData,
  extra?: ShippingExtraInfo
): Promise<SendResult> {
  const recipient = order.email?.trim();
  if (!recipient || !recipient.includes('@')) {
    console.log(`[EmailService] Bỏ qua gửi email ${type} cho đơn #${order.orderCode} vì không có email người nhận.`);
    return {
      success: false,
      provider: 'MOCK',
      error: 'Khách hàng không cung cấp địa chỉ email',
    };
  }

  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-clean-1000.png');
  const hasLocalLogo = fs.existsSync(logoPath);
  const logoSrc = hasLocalLogo ? 'cid:thaison-logo' : '/images/logo-clean-1000.png';

  // 1. Render template tương ứng với Logo chính thức
  let emailData: { subject: string; html: string };
  switch (type) {
    case 'ORDER_CONFIRMATION':
      emailData = renderOrderConfirmationEmail(order, { logoSrc });
      break;
    case 'ORDER_SHIPPING':
      emailData = renderOrderShippingEmail(order, extra, { logoSrc });
      break;
    case 'ORDER_COMPLETED':
      emailData = renderOrderCompletedEmail(order, { logoSrc });
      break;
    default:
      return { success: false, provider: 'MOCK', error: 'Invalid email type' };
  }

  const { subject, html } = emailData;
  let provider: 'RESEND' | 'SMTP' | 'MOCK' = 'MOCK';
  let messageId: string | undefined;
  let errorMsg: string | undefined;
  let isSuccess = false;

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim() || '';

  // Ưu tiên SMTP nếu đã cung cấp SMTP_USER/PASS hoặc EMAIL_FROM là Gmail
  const shouldUseSmtp =
    Boolean(smtpUser && smtpPass) &&
    (emailFrom.includes('@gmail.com') || !resendApiKey || process.env.EMAIL_PROVIDER === 'SMTP');

  // 2. Tiến hành gửi mail theo thứ tự ưu tiên
  try {
    if (shouldUseSmtp) {
      provider = 'SMTP';
      const res = await sendViaSmtp({ to: recipient, subject, html });
      messageId = res.messageId;
      isSuccess = true;
      console.log(`[EmailService] [SMTP] Đã gửi mail ${type} thành công đến ${recipient} (Đơn #${order.orderCode}) - ID: ${messageId}`);
    } else if (resendApiKey) {
      provider = 'RESEND';
      const res = await sendViaResend({ to: recipient, subject, html, apiKey: resendApiKey });
      messageId = res.messageId;
      isSuccess = true;
      console.log(`[EmailService] [RESEND] Đã gửi mail ${type} thành công đến ${recipient} (Đơn #${order.orderCode}) - ID: ${messageId}`);
    } else {
      // Chế độ mô phỏng / Development (Chưa cấu hình API Key)
      provider = 'MOCK';
      messageId = `mock_mail_${Date.now()}`;
      isSuccess = true;
      console.log(`
════════════════════════════════════════════════════════════════════
[EMAIL SERVICE MOCK NOTIFICATION]
- Loại thư: ${type}
- Gửi đến: ${recipient} (${order.fullName} - Đơn #${order.orderCode})
- Tiêu đề: ${subject}
- Gợi ý kích hoạt thực tế: Thêm RESEND_API_KEY hoặc SMTP_USER/PASS vào file .env
════════════════════════════════════════════════════════════════════
      `);
    }
  } catch (err: any) {
    isSuccess = false;
    errorMsg = err.message || 'Lỗi gửi email không xác định';
    console.error(`[EmailService] Lỗi khi gửi mail ${type} cho đơn #${order.orderCode}:`, errorMsg);
  }

  // 3. Ghi nhận lịch sử gửi mail vào PostgreSQL để theo dõi
  try {
    await ensureEmailLogsTable();
    const logId = `eml_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    await query(
      `INSERT INTO email_logs (id, order_code, recipient, email_type, subject, status, provider, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
      [
        logId,
        order.orderCode,
        recipient,
        type,
        subject,
        isSuccess ? 'SENT' : 'FAILED',
        provider,
        errorMsg || null,
      ]
    );
  } catch (logErr) {
    console.error('[EmailService] Không thể ghi email_logs:', logErr);
  }

  return {
    success: isSuccess,
    messageId,
    provider,
    error: errorMsg,
  };
}
