/**
 * Global Error Handler — Port từ MoneyPrinterTurbo exception.py + asgi.py
 * 
 * Tập trung xử lý lỗi tại 1 điểm thay vì rải try/catch khắp controller.
 * Đặc biệt quan trọng cho app tài chính: đảm bảo lỗi nhạy cảm
 * (DB connection string, JWT secret) KHÔNG bị leak ra client.
 * 
 * Sử dụng:
 * 1. Throw AppError/NotFoundError/... trong controller
 * 2. globalErrorHandler middleware sẽ bắt và format response
 */

// ===== Custom Error Classes — giống MoneyPrinterTurbo HttpException =====

/**
 * Base application error — tất cả lỗi domain kế thừa từ đây.
 * isOperational = true → đây là lỗi "có chủ đích" (validation, not found, ...)
 * isOperational = false → lỗi lập trình (null pointer, type error, ...)
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = true;
  }
}

/** 404 — Tài nguyên không tồn tại */
export class NotFoundError extends AppError {
  constructor(resource = 'Tài nguyên') {
    super(`${resource} không tồn tại.`, 404);
    this.name = 'NotFoundError';
  }
}

/** 401 — Chưa xác thực */
export class UnauthorizedError extends AppError {
  constructor(message = 'Không có quyền truy cập. Vui lòng đăng nhập.') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

/** 403 — Không đủ quyền */
export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện hành động này.') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/** 400 — Dữ liệu đầu vào không hợp lệ */
export class ValidationError extends AppError {
  constructor(message = 'Dữ liệu không hợp lệ.', errors = null) {
    super(message, 400, errors);
    this.name = 'ValidationError';
  }
}

/** 409 — Xung đột (duplicate, đã tồn tại) */
export class ConflictError extends AppError {
  constructor(message = 'Dữ liệu đã tồn tại.') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

// ===== Global Error Handler Middleware =====

/**
 * Express error handling middleware — đặt SAU tất cả routes trong server.js
 * 
 * Logic giống MoneyPrinterTurbo asgi.py exception_handler:
 * - AppError (operational) → trả message cho client
 * - Unknown error → log chi tiết nhưng trả generic message (tránh leak info)
 * 
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Tránh gửi response 2 lần nếu headers đã sent
  if (res.headersSent) {
    return next(err);
  }

  // Log error — giống MPT: 400 → warning, 500 → error
  const logLevel = (err.statusCode && err.statusCode < 500) ? 'warn' : 'error';
  console[logLevel](`[${req.method} ${req.path}]`, {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || 500,
    // Chỉ log stack trace cho non-operational errors (lỗi lập trình)
    ...(err.isOperational ? {} : { stack: err.stack }),
  });

  // ── Operational error → trả message cho client ──
  if (err.isOperational) {
    const response = {
      success: false,
      status: err.statusCode,
      message: err.message,
    };
    if (err.data) {
      response.errors = err.data;
    }
    return res.status(err.statusCode).json(response);
  }

  // ── Mongoose validation error ──
  if (err.name === 'ValidationError' && err.errors) {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Dữ liệu không hợp lệ.',
      errors: messages,
    });
  }

  // ── Mongoose duplicate key error ──
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      status: 409,
      message: `${field} đã tồn tại.`,
    });
  }

  // ── JWT errors ──
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Token không hợp lệ.',
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      status: 401,
      message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }

  // ── TaskQueueFullError ──
  if (err.name === 'TaskQueueFullError') {
    return res.status(429).json({
      success: false,
      status: 429,
      message: err.message,
    });
  }

  // ── Programming/Unknown error → trả generic message, KHÔNG leak details ──
  return res.status(500).json({
    success: false,
    status: 500,
    message: 'Lỗi server nội bộ. Vui lòng thử lại sau.',
  });
};

/**
 * Wrapper cho async route handlers — tự động forward errors tới globalErrorHandler.
 * Thay vì viết try/catch trong mỗi controller, wrap hàm handler với asyncHandler.
 * 
 * Cách dùng:
 *   router.get('/expenses', asyncHandler(async (req, res) => {
 *     const expenses = await Expense.find({});
 *     ApiResponse.success(res, { expenses });
 *   }));
 * 
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
