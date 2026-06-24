import path from 'path';
import fs from 'fs';

/**
 * Giải quyết đường dẫn file an toàn — Port từ MoneyPrinterTurbo file_security.py
 * 
 * Ngăn chặn Path Traversal attack (../../etc/passwd)
 * bằng cách đảm bảo resolved path luôn nằm trong thư mục cho phép.
 * 
 * Quan trọng cho hệ thống tài chính vì:
 * - Endpoint upload bill thanh toán có thể bị lợi dụng
 * - Avatar upload cũng là vector tấn công
 * 
 * @param {string} baseDir - Thư mục gốc cho phép (whitelist directory)
 * @param {string} unsafePath - Đường dẫn do user cung cấp (không tin tưởng)
 * @param {Object} options
 * @param {boolean} options.requireFile - Yêu cầu file phải tồn tại (default: true)
 * @returns {string} Đường dẫn an toàn đã được resolve
 * @throws {Error} Nếu đường dẫn nằm ngoài baseDir hoặc file không tồn tại
 */
export const resolvePathWithinDirectory = (baseDir, unsafePath, { requireFile = true } = {}) => {
  if (!unsafePath || unsafePath.trim() === '') {
    throw new Error('Đường dẫn file không được để trống.');
  }

  // Normalize base directory — dùng resolve thay vì realpathSync
  // để tránh lỗi khi baseDir chưa tồn tại (edge case khi init)
  const baseDirReal = path.resolve(baseDir);

  // Nếu unsafePath là relative → join với baseDir
  let candidatePath = unsafePath;
  if (!path.isAbsolute(candidatePath)) {
    candidatePath = path.join(baseDirReal, candidatePath);
  }

  // Resolve symlinks, '..' segments, các ký tự đặc biệt
  const resolvedPath = path.resolve(candidatePath);

  // Kiểm tra resolvedPath có nằm trong baseDir không
  // Dùng path.relative thay vì string comparison để xử lý edge cases
  // như: double slashes, trailing slashes, case sensitivity trên Windows
  const relative = path.relative(baseDirReal, resolvedPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Đường dẫn nằm ngoài thư mục cho phép.');
  }

  // Kiểm tra file tồn tại (nếu yêu cầu)
  if (requireFile && !fs.existsSync(resolvedPath)) {
    throw new Error('File không tồn tại.');
  }

  return resolvedPath;
};

/**
 * Sanitize tên file upload — Port từ MoneyPrinterTurbo _sanitize_upload_filename
 * 
 * Loại bỏ directory components, chống directory traversal qua filename.
 * Ví dụ: "../../etc/passwd" → "passwd"
 *         "images\\..\\config.json" → "config.json"
 * 
 * @param {string} filename - Tên file gốc từ client
 * @returns {string} Tên file đã sanitize
 * @throws {Error} Nếu tên file không hợp lệ
 */
export const sanitizeUploadFilename = (filename) => {
  if (!filename) {
    throw new Error('Tên file không hợp lệ.');
  }

  // Normalize path separators và chỉ giữ phần filename
  const normalized = filename.replace(/\\/g, '/').split('/').pop().trim();

  if (!normalized || normalized === '.' || normalized === '..') {
    throw new Error('Tên file không hợp lệ.');
  }

  // Loại bỏ ký tự đặc biệt nguy hiểm, chỉ giữ alphanumeric,
  // dấu gạch ngang, gạch dưới, dấu chấm, và ký tự Unicode (tiếng Việt)
  const safe = normalized.replace(/[^a-zA-Z0-9._\-\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
  return safe;
};

/**
 * Kiểm tra MIME type có nằm trong whitelist không
 * 
 * @param {string} mimetype - MIME type của file upload
 * @param {string[]} allowedTypes - Danh sách MIME type cho phép
 * @returns {boolean}
 */
export const isAllowedMimeType = (mimetype, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Kiểm tra kích thước file có vượt quá giới hạn không
 * 
 * @param {number} sizeInBytes - Kích thước file
 * @param {number} maxSizeInBytes - Giới hạn tối đa (default 5MB)
 * @returns {boolean}
 */
export const isWithinSizeLimit = (sizeInBytes, maxSizeInBytes = 5 * 1024 * 1024) => {
  return sizeInBytes <= maxSizeInBytes;
};
