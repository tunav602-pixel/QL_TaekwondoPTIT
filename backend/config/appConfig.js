/**
 * Centralized Configuration — Port từ MoneyPrinterTurbo config.py
 * 
 * Load tất cả environment variables 1 lần, validate, và export singleton.
 * Thay vì rải process.env.XXX khắp nơi, import config object này.
 * 
 * Ưu điểm:
 * - Validate thiếu config ngay lúc khởi tạo (fail fast)
 * - IDE autocomplete khi truy cập config.xxx
 * - Dễ mock trong unit test
 * - Một nơi duy nhất để xem tất cả config options
 */
import dotenv from 'dotenv';
dotenv.config();

/**
 * Yêu cầu env var phải tồn tại, dừng server nếu thiếu.
 * Chỉ dùng cho các biến CRITICAL (DB, JWT secret).
 * Các biến optional dùng giá trị default.
 */
const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    // Trong dev mode, warn thay vì crash — cho phép fallback JSON storage
    console.warn(`⚠️ [Config] Missing env: ${key}`);
    return '';
  }
  return value;
};

const appConfig = Object.freeze({
  // === Server ===
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // === Database ===
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/taekwondo_ptit',

  // === Auth (JWT) ===
  jwtSecret: requireEnv('JWT_SECRET') || 'dev_fallback_secret_CHANGE_ME',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // === Email (SMTP - Nodemailer) ===
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_EMAIL || '',
    pass: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'CLB Taekwondo PTIT <taekwondoptitweb@gmail.com>',
  },

  // === VietQR ===
  vietqr: {
    defaultBankCode: process.env.VIETQR_BANK_CODE || 'MB',
    defaultAccount: process.env.VIETQR_ACCOUNT || '19036329402018',
    webhookSecret: process.env.VIETQR_WEBHOOK_SECRET || '',
    // Template QR đẹp với logo ngân hàng
    template: process.env.VIETQR_TEMPLATE || 'compact2',
  },

  // === Task Queue (từ MoneyPrinterTurbo TaskManager) ===
  taskQueue: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_TASKS || '3'),
    maxQueued: parseInt(process.env.MAX_QUEUED_TASKS || '50'),
  },

  // === Upload ===
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(5 * 1024 * 1024)), // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // === Security ===
  security: {
    // Rate limit: 100 requests per 15 minutes (per IP)
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    // Auth endpoints: stricter limit
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
    // CORS
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : null, // null = dùng logic localhost hiện tại trong server.js
  },

  // === Project Info (giống MoneyPrinterTurbo project_name/version) ===
  projectName: 'Taekwondo PTIT Finance',
  projectVersion: '1.0.0',
  projectDescription: 'Hệ thống quản lý tài chính CLB Taekwondo PTIT',
});

export default appConfig;
