import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware bảo vệ route - Xác thực JWT token
 * Extract token từ Authorization header → verify → gắn user vào req
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user và loại bỏ password
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ. User không tồn tại.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.'
    });
  }
};

export default authMiddleware;

/**
 * Middleware kiểm tra quyền Super Admin (tunav602@gmail.com)
 */
export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.email === 'tunav602@gmail.com' && req.user.role === 'Super-Admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Quyền truy cập bị từ chối. Chỉ Super Admin mới có quyền thực hiện hành động này.'
    });
  }
};

/**
 * Middleware kiểm tra quyền Admin (Super-Admin hoặc Sub-Admin)
 */
export const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Super-Admin' || req.user.role === 'Sub-Admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Quyền truy cập bị từ chối. Chỉ Admin mới có quyền thực hiện hành động này.'
    });
  }
};

/**
 * Middleware kiểm tra quyền theo danh sách roles
 */
export const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Không có quyền truy cập. Vui lòng đăng nhập.'
      });
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: 'Quyền truy cập bị từ chối. Bạn không có quyền thực hiện hành động này.'
      });
    }
  };
};

// Legacy middleware for backward compatibility
export const isChunhiem = isSuperAdmin;
