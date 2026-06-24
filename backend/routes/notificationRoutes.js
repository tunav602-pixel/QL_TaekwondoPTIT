import express from 'express';
import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tất cả routes cần auth
router.use(authMiddleware);

// Lấy danh sách thông báo
router.get('/', getMyNotifications);

// Lấy số thông báo chưa đọc
router.get('/unread-count', getUnreadCount);

// Đánh dấu tất cả đã đọc
router.put('/read-all', markAllAsRead);

// Đánh dấu một thông báo đã đọc
router.put('/:id/read', markAsRead);

export default router;
