#!/usr/bin/env bash
# ==============================================================================
# THÁI SƠN FOODS - AUTOMATED PRODUCTION BACKUP SCRIPT
# Lưu trữ bản sao lưu Database PostgreSQL và thư mục public uploads hàng ngày.
# Tự động dọn dẹp các bản backup cũ hơn 7 ngày.
# ==============================================================================

set -euo pipefail

# 1. Cấu hình biến sao lưu
BACKUP_DIR="${BACKUP_DIR:-/var/backups/webtsf}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-WebTSF_production}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}/database"
mkdir -p "${BACKUP_DIR}/uploads"

echo "=========================================================="
echo " [$(date)] Bắt đầu sao lưu hệ thống Thái Sơn Foods..."
echo "=========================================================="

# 2. Sao lưu Cơ sở dữ liệu PostgreSQL (Dump & nén gzip)
DB_BACKUP_FILE="${BACKUP_DIR}/database/${DB_NAME}_${TIMESTAMP}.sql.gz"
echo "-> Đang xuất Database [${DB_NAME}] ra ${DB_BACKUP_FILE}..."

if pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${DB_BACKUP_FILE}"; then
    echo "✅ Xuất Database thành công: $(du -sh "${DB_BACKUP_FILE}" | cut -f1)"
else
    echo "❌ LỖI: Sao lưu Database thất bại!" >&2
    exit 1
fi

# 3. Sao lưu thư mục Upload / Ảnh sản phẩm nếu có
UPLOADS_SRC="/var/www/thai-son-foods/public/uploads"
if [ -d "${UPLOADS_SRC}" ]; then
    UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads/uploads_${TIMESTAMP}.tar.gz"
    echo "-> Đang nén thư mục uploads..."
    tar -czf "${UPLOADS_BACKUP_FILE}" -C "$(dirname "${UPLOADS_SRC}")" "$(basename "${UPLOADS_SRC}")"
    echo "✅ Sao lưu uploads thành công: $(du -sh "${UPLOADS_BACKUP_FILE}" | cut -f1)"
fi

# 4. Dọn dẹp bản sao lưu cũ hơn RETENTION_DAYS ngày
echo "-> Đang dọn dẹp các bản backup cũ hơn ${RETENTION_DAYS} ngày..."
find "${BACKUP_DIR}/database" -type f -name "*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}/uploads" -type f -name "*.tar.gz" -mtime +${RETENTION_DAYS} -delete

echo "=========================================================="
echo " [$(date)] Hoàn tất sao lưu an toàn."
echo "=========================================================="
