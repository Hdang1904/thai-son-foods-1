/**
 * Danh sách từ khóa cấm / nhạy cảm / spam cho hệ thống Đánh giá Thái Sơn Foods.
 * Đánh giá chứa các từ này sẽ không được tự động duyệt, mà luôn chuyển sang PENDING để kiểm duyệt viên xem xét.
 */

export const BANNED_WORDS: readonly string[] = [
  // Từ khóa thô tục, xúc phạm
  'đm',
  'dcm',
  'đcm',
  'dm',
  'vcl',
  'vkl',
  'clgt',
  'đậu má',
  'đụ má',
  'đụ mẹ',
  'đĩ',
  'đoé',
  'đéo',
  'mẹ kiếp',
  'chó má',
  'khốn nạn',
  // Từ khóa cáo buộc phá hoại, lừa đảo
  'lừa đảo',
  'lua dao',
  'đa cấp',
  'ăn cắp',
  'ăn cướp',
  'bẩn thỉu',
  'hôi nách',
  'ngộ độc',
  'chết người',
  // Spam link, cờ bạc, cá độ
  'http://',
  'https://',
  'www.',
  't.me/',
  'zalo.me/',
  'cá cược',
  'cá độ',
  'casino',
  'nổ hũ',
  'tài xỉu',
  'bắn cá',
  'ku bet',
  'kubet',
  'shbet',
  'fb88',
  'fun88',
  'm88',
  'w88',
  'chốt số',
  'soi cầu',
  'lô đề',
  'vay tiền',
  'tín dụng đen',
] as const;

/**
 * Kiểm tra chuỗi văn bản có chứa từ khóa cấm hay không (không phân biệt hoa thường).
 */
export function containsBannedWords(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase();
  return BANNED_WORDS.some((word) => normalized.includes(word.toLowerCase()));
}
