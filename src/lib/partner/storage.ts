import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { query } from '@/lib/db';

const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'secure_documents');
const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

export async function savePartnerDocument(params: {
  partnerId: string;
  documentType: 'ID_CARD_FRONT' | 'ID_CARD_BACK' | 'BUSINESS_LICENSE' | 'TAX_DOC';
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
}): Promise<{ id: string; filePath: string }> {
  if (params.buffer.length > MAX_DOC_SIZE) {
    throw new Error('Dung lượng tệp tài liệu vượt quá giới hạn 5MB.');
  }

  if (!ALLOWED_MIME.includes(params.mimeType as any)) {
    throw new Error('Định dạng tệp không được hỗ trợ. Chỉ chấp nhận ảnh (JPG, PNG, WEBP) hoặc tài liệu PDF.');
  }

  // Tạo thư mục lưu trữ private cách ly theo partner_id
  const targetDir = path.join(STORAGE_ROOT, params.partnerId);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const ext = path.extname(params.originalFilename).toLowerCase() || '.jpg';
  const safeFilename = `${params.documentType.toLowerCase()}_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
  const absolutePath = path.join(targetDir, safeFilename);

  // Lưu file vào ổ cứng private (không public URL)
  await fs.promises.writeFile(absolutePath, params.buffer);

  const docId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  await query(
    `INSERT INTO partner_documents (id, partner_id, document_type, file_path, original_filename, mime_type, file_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
    [
      docId,
      params.partnerId,
      params.documentType,
      absolutePath,
      params.originalFilename,
      params.mimeType,
      params.buffer.length,
    ]
  );

  return { id: docId, filePath: absolutePath };
}

export async function getPartnerDocumentById(docId: string): Promise<{
  id: string;
  partnerId: string;
  documentType: string;
  filePath: string;
  mimeType: string;
  originalFilename: string;
} | null> {
  const res = await query(
    `SELECT id, partner_id AS "partnerId", document_type AS "documentType", file_path AS "filePath",
            mime_type AS "mimeType", original_filename AS "originalFilename"
     FROM partner_documents
     WHERE id = $1
     LIMIT 1;`,
    [docId]
  );

  if (res.rows.length === 0) return null;
  return res.rows[0];
}
