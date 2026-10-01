import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAdminSession } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { writeAuditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
];

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

function sanitizeFileName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const baseName = path.basename(name, ext);
  const cleanBase = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 50);
  return `${Date.now()}_${cleanBase}${ext}`;
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session || !hasPermission(session, 'upload.use')) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có quyền tải tệp lên máy chủ.', code: 'FORBIDDEN' },
        { status: !session ? 401 : 403 }
      );
    }

    const formData = await request.formData();
    const folderType = (formData.get('folder') as string) || 'products'; // products, combos, banners
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;

    const filesToUpload: File[] = [];
    if (singleFile && singleFile.size > 0) {
      filesToUpload.push(singleFile);
    }
    if (files && files.length > 0) {
      for (const f of files) {
        if (f && f.size > 0 && !filesToUpload.includes(f)) {
          filesToUpload.push(f);
        }
      }
    }

    if (filesToUpload.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tệp tải lên' },
        { status: 400 }
      );
    }

    // Target upload directory: public/uploads/[folderType]
    const cleanFolder = folderType.replace(/[^a-zA-Z0-9_-]/g, '');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', cleanFolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedUrls: { url: string; originalName: string; size: number }[] = [];

    for (const file of filesToUpload) {
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          {
            success: false,
            error: `Định dạng tệp "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP, GIF hoặc MP4.`,
          },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            success: false,
            error: `Dung lượng tệp "${file.name}" vượt quá giới hạn 15MB.`,
          },
          { status: 400 }
        );
      }

      const safeName = sanitizeFileName(file.name);
      const filePath = path.join(uploadDir, safeName);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${cleanFolder}/${safeName}`;
      uploadedUrls.push({
        url: publicUrl,
        originalName: file.name,
        size: file.size,
      });
    }

    await writeAuditLog({
      adminId: session.userId,
      adminUsername: session.username,
      role: session.role,
      action: 'FILE_UPLOAD',
      entityType: 'FILE',
      afterJson: {
        folder: cleanFolder,
        count: uploadedUrls.length,
        files: uploadedUrls.map(u => ({ url: u.url, originalName: u.originalName, size: u.size })),
      },
    });

    return NextResponse.json({
      success: true,
      data: uploadedUrls.length === 1 ? uploadedUrls[0] : uploadedUrls,
      urls: uploadedUrls.map((u) => u.url),
      url: uploadedUrls[0].url,
    });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải tệp lên máy chủ' },
      { status: 500 }
    );
  }
}
